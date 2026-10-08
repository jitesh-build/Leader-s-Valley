import { Router } from "express";
import { Types } from "mongoose";
import { War } from "../models/War";
import { Slot } from "../models/Slot";
import { EnemyScout } from "../models/EnemyScout";
import { WAR_MODE_SIZES, isWarMode } from "../types/warModes";
import { asyncHandler, HttpError } from "../asyncHandler";
import { emitToWar, emitToWarsList } from "../socket";

const router = Router();

function requireObjectId(id: string | undefined, label: string): string {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Invalid ${label} id`);
  }
  return id;
}

// GET /api/wars - list all wars, newest first
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const wars = await War.find().sort({ createdAt: -1 }).lean();
    res.json(wars);
  })
);

// POST /api/wars - create a war
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, mode, size, leagueTier } = req.body as {
      name?: unknown;
      mode?: unknown;
      size?: unknown;
      leagueTier?: unknown;
    };

    if (typeof name !== "string" || name.trim().length === 0) {
      throw new HttpError(400, "name is required");
    }
    if (!isWarMode(mode)) {
      throw new HttpError(400, "mode must be one of 5v5, 15v15, 30v30, custom");
    }

    let resolvedSize: number;
    if (mode === "custom") {
      if (typeof size !== "number" || !Number.isInteger(size) || size < 1 || size > 50) {
        throw new HttpError(400, "custom mode requires an integer size between 1 and 50");
      }
      resolvedSize = size;
    } else {
      resolvedSize = WAR_MODE_SIZES[mode];
    }

    const war = await War.create({
      name: name.trim(),
      mode,
      size: resolvedSize,
      leagueTier: typeof leagueTier === "string" ? leagueTier : "",
    });

    const slotDocs = Array.from({ length: resolvedSize }, (_, i) => ({
      warId: war._id,
      index: i + 1,
      teamBaseNumber: null,
      enemyBaseNumber: null,
      enemyBaseNumbers: [],
      isMultiSelect: false,
      starsNeeded: 3,
    }));
    const scoutDocs = Array.from({ length: resolvedSize }, (_, i) => ({
      warId: war._id,
      baseNumber: i + 1,
      expectedStars: 3,
    }));
    await Promise.all([Slot.insertMany(slotDocs), EnemyScout.insertMany(scoutDocs)]);

    emitToWarsList("war:created", war);

    res.status(201).json(war);
  })
);

// GET /api/wars/:id - single war
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "war");
    const war = await War.findById(id).lean();
    if (!war) throw new HttpError(404, "War not found");
    res.json(war);
  })
);

// GET /api/wars/:id/summary - counts for the top stats bar
router.get(
  "/:id/summary",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "war");

    const [war, slots] = await Promise.all([
      War.findById(id).lean(),
      Slot.find({ warId: id }).select("teamBaseNumber enemyBaseNumber enemyBaseNumbers").lean(),
    ]);
    if (!war) throw new HttpError(404, "War not found");

    const teamAssigned = slots.filter((s) => typeof s.teamBaseNumber === "number").length;

    // An enemy base counts as "assigned" whether it's a normal slot's single
    // target or sitting in one (or several) multi-select pools — dedupe by
    // base number since multi-select pools can legitimately overlap.
    const enemyBaseSet = new Set<number>();
    for (const s of slots) {
      if (typeof s.enemyBaseNumber === "number") enemyBaseSet.add(s.enemyBaseNumber);
      for (const n of s.enemyBaseNumbers ?? []) enemyBaseSet.add(n);
    }

    res.json({
      size: war.size,
      slotCount: slots.length,
      teamBasesTotal: war.size,
      teamBasesAssigned: teamAssigned,
      teamBasesAvailable: war.size - teamAssigned,
      enemyBasesTotal: war.size,
      enemyBasesAssigned: enemyBaseSet.size,
      enemyBasesAvailable: war.size - enemyBaseSet.size,
    });
  })
);

// PATCH /api/wars/:id - update mutable war fields
router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "war");
    const { name, leagueTier, isActive } = req.body as {
      name?: unknown;
      leagueTier?: unknown;
      isActive?: unknown;
    };

    const update: Partial<{ name: string; leagueTier: string; isActive: boolean }> = {};
    if (typeof name === "string" && name.trim().length > 0) update.name = name.trim();
    if (typeof leagueTier === "string") update.leagueTier = leagueTier;
    if (typeof isActive === "boolean") update.isActive = isActive;

    const war = await War.findByIdAndUpdate(id, update, { new: true });
    if (!war) throw new HttpError(404, "War not found");

    emitToWarsList("war:updated", war);
    emitToWar(id, "war:updated", war);

    res.json(war);
  })
);

// POST /api/wars/:id/auto-fill-remaining - fill every still-empty slot with
// the remaining team bases (one each, in ascending order) paired against a
// SHARED multi-select pool made of every remaining enemy base.
//
// Example: remaining team bases [27, 28, 29], remaining enemy bases [20, 21,
// 22] -> three empty slots each become multi-select, one gets teamBaseNumber
// 27 with pool [20,21,22], the next 28 with pool [20,21,22], etc.
router.post(
  "/:id/auto-fill-remaining",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "war");
    const war = await War.findById(id).lean();
    if (!war) throw new HttpError(404, "War not found");

    const slots = await Slot.find({ warId: id }).sort({ index: 1 });

    const usedTeamBases = new Set<number>();
    const usedEnemyBases = new Set<number>();
    for (const s of slots) {
      if (typeof s.teamBaseNumber === "number") usedTeamBases.add(s.teamBaseNumber);
      if (typeof s.enemyBaseNumber === "number") usedEnemyBases.add(s.enemyBaseNumber);
      for (const n of s.enemyBaseNumbers) usedEnemyBases.add(n);
    }

    const remainingTeamBases: number[] = [];
    const remainingEnemyBases: number[] = [];
    for (let n = 1; n <= war.size; n++) {
      if (!usedTeamBases.has(n)) remainingTeamBases.push(n);
      if (!usedEnemyBases.has(n)) remainingEnemyBases.push(n);
    }

    const emptySlots = slots.filter((s) => s.teamBaseNumber === null).sort((a, b) => a.index - b.index);

    if (remainingTeamBases.length === 0 || remainingEnemyBases.length === 0 || emptySlots.length === 0) {
      res.json([]);
      return;
    }

    const pairCount = Math.min(emptySlots.length, remainingTeamBases.length);
    const updated = [];

    for (let i = 0; i < pairCount; i++) {
      const slot = emptySlots[i];
      const teamBaseNumber = remainingTeamBases[i];
      if (!slot || teamBaseNumber === undefined) continue;

      slot.teamBaseNumber = teamBaseNumber;
      slot.isMultiSelect = true;
      slot.enemyBaseNumber = null;
      slot.enemyBaseNumbers = [...remainingEnemyBases];
      await slot.save();
      updated.push(slot);
      emitToWar(id, "slot:updated", slot);
    }

    res.json(updated);
  })
);

// DELETE /api/wars/:id - delete war and its roster
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "war");
    const war = await War.findByIdAndDelete(id);
    if (!war) throw new HttpError(404, "War not found");
    await Promise.all([Slot.deleteMany({ warId: war._id }), EnemyScout.deleteMany({ warId: war._id })]);

    emitToWarsList("war:deleted", { warId: id });
    emitToWar(id, "war:deleted", { warId: id });

    res.status(204).send();
  })
);

export default router;