import { Router } from "express";
import { Types } from "mongoose";
import { War } from "../models/War";
import { Slot } from "../models/Slot";
import { EnemyScout } from "../models/EnemyScout";
import { WAR_MODE_SIZES, isWarMode } from "../types/warModes";
import { asyncHandler, HttpError } from "../asyncHandler";

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
      starsNeeded: 3,
    }));
    const scoutDocs = Array.from({ length: resolvedSize }, (_, i) => ({
      warId: war._id,
      baseNumber: i + 1,
      expectedStars: 3,
    }));
    await Promise.all([Slot.insertMany(slotDocs), EnemyScout.insertMany(scoutDocs)]);

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
    const war = await War.findById(id).lean();
    if (!war) throw new HttpError(404, "War not found");

    const slots = await Slot.find({ warId: war._id }).lean();
    const teamAssigned = slots.filter((s) => typeof s.teamBaseNumber === "number").length;
    const enemyAssigned = slots.filter((s) => typeof s.enemyBaseNumber === "number").length;

    res.json({
      size: war.size,
      slotCount: slots.length,
      teamBasesTotal: war.size,
      teamBasesAssigned: teamAssigned,
      teamBasesAvailable: war.size - teamAssigned,
      enemyBasesTotal: war.size,
      enemyBasesAssigned: enemyAssigned,
      enemyBasesAvailable: war.size - enemyAssigned,
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
    res.json(war);
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
    res.status(204).send();
  })
);

export default router;
