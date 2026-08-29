// import { Router } from "express";
// import { Types } from "mongoose";
// import { Slot } from "../models/Slot";
// import { War } from "../models/War";
// import { asyncHandler, HttpError } from "../asyncHandler";
// import { emitToWar } from "../socket";

// const router = Router();

// function requireObjectId(id: string | undefined, label: string): string {
//   if (!id || !Types.ObjectId.isValid(id)) {
//     throw new HttpError(400, `Invalid ${label} id`);
//   }
//   return id;
// }

// function isMongoDupKeyError(err: unknown): boolean {
//   return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
// }

// function validateBaseNumberRange(size: number, field: string, value: number): void {
//   if (!Number.isInteger(value) || value < 1 || value > size) {
//     throw new HttpError(400, `${field} must be an integer between 1 and ${size}`);
//   }
// }

// // GET /api/wars/:warId/slots - fixed list of attack slots for a war
// router.get(
//   "/wars/:warId/slots",
//   asyncHandler(async (req, res) => {
//     const warId = requireObjectId(req.params.warId, "war");
//     const slots = await Slot.find({ warId }).sort({ index: 1 }).lean();
//     res.json(slots);
//   })
// );

// // PATCH /api/slots/:id - assign team base / enemy base / stars needed
// router.patch(
//   "/slots/:id",
//   asyncHandler(async (req, res) => {
//     const id = requireObjectId(req.params.id, "slot");
//     const slot = await Slot.findById(id);
//     if (!slot) throw new HttpError(404, "Slot not found");

//     // Only need war.size for range validation, so project just that field
//     // instead of pulling the whole war document over the wire.
//     const war = await War.findById(slot.warId).select("size").lean();
//     if (!war) throw new HttpError(404, "Parent war not found");

//     const body = req.body as {
//       teamBaseNumber?: unknown;
//       enemyBaseNumber?: unknown;
//       starsNeeded?: unknown;
//     };

//     if (body.teamBaseNumber !== undefined) {
//       if (body.teamBaseNumber === null) {
//         slot.teamBaseNumber = null;
//       } else if (typeof body.teamBaseNumber === "number") {
//         validateBaseNumberRange(war.size, "teamBaseNumber", body.teamBaseNumber);
//         slot.teamBaseNumber = body.teamBaseNumber;
//       } else {
//         throw new HttpError(400, "teamBaseNumber must be a number or null");
//       }
//     }

//     if (body.enemyBaseNumber !== undefined) {
//       if (body.enemyBaseNumber === null) {
//         slot.enemyBaseNumber = null;
//       } else if (typeof body.enemyBaseNumber === "number") {
//         validateBaseNumberRange(war.size, "enemyBaseNumber", body.enemyBaseNumber);
//         slot.enemyBaseNumber = body.enemyBaseNumber;
//       } else {
//         throw new HttpError(400, "enemyBaseNumber must be a number or null");
//       }
//     }

//     if (body.starsNeeded !== undefined) {
//       if (typeof body.starsNeeded !== "number" || ![1, 2, 3].includes(body.starsNeeded)) {
//         throw new HttpError(400, "starsNeeded must be 1, 2 or 3");
//       }
//       slot.starsNeeded = body.starsNeeded;
//     }

//     try {
//       await slot.save();
//     } catch (err) {
//       // The unique partial indexes on { warId, teamBaseNumber } / { warId, enemyBaseNumber }
//       // are the real source of truth for "is this base already taken" — catching the
//       // dup-key error here avoids an extra findOne() round trip on every single PATCH,
//       // while still guaranteeing correctness (including races between two clients).
//       if (isMongoDupKeyError(err)) {
//         throw new HttpError(409, "That base number is already assigned to another slot");
//       }
//       throw err;
//     }
//     emitToWar(String(slot.warId), "slot:updated", slot);
 
//     res.json(slot);
//   })
// );

// export default router;

import { Router } from "express";
import { Types } from "mongoose";
import { Slot } from "../models/Slot";
import { War } from "../models/War";
import { asyncHandler, HttpError } from "../asyncHandler";
import { emitToWar } from "../socket";

const router = Router();

function requireObjectId(id: string | undefined, label: string): string {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Invalid ${label} id`);
  }
  return id;
}

function isMongoDupKeyError(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: number }).code === 11000;
}

function validateBaseNumberRange(size: number, field: string, value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > size) {
    throw new HttpError(400, `${field} must be an integer between 1 and ${size}`);
  }
}

/** Throws 409 if `baseNumber` is already another slot's locked-in single target. */
async function assertNotNormalTarget(
  warId: Types.ObjectId,
  baseNumber: number,
  excludeSlotId: Types.ObjectId
): Promise<void> {
  const clash = await Slot.findOne({ warId, enemyBaseNumber: baseNumber, _id: { $ne: excludeSlotId } }).lean();
  if (clash) {
    throw new HttpError(
      409,
      `Base #${baseNumber} is already the single target of slot ${clash.index}. Remove it there first.`
    );
  }
}

/** Throws 409 if `baseNumber` is sitting in another slot's multi-select pool. */
async function assertNotInAnyPool(
  warId: Types.ObjectId,
  baseNumber: number,
  excludeSlotId: Types.ObjectId
): Promise<void> {
  const clash = await Slot.findOne({ warId, enemyBaseNumbers: baseNumber, _id: { $ne: excludeSlotId } }).lean();
  if (clash) {
    throw new HttpError(
      409,
      `Base #${baseNumber} is already in slot ${clash.index}'s multi-select pool. Remove it there first.`
    );
  }
}

// GET /api/wars/:warId/slots - fixed list of attack slots for a war
router.get(
  "/wars/:warId/slots",
  asyncHandler(async (req, res) => {
    const warId = requireObjectId(req.params.warId, "war");
    const slots = await Slot.find({ warId }).sort({ index: 1 }).lean();
    res.json(slots);
  })
);

// PATCH /api/slots/:id - assign team base / enemy base / stars needed / multi-select mode
router.patch(
  "/slots/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "slot");
    const slot = await Slot.findById(id);
    if (!slot) throw new HttpError(404, "Slot not found");

    const war = await War.findById(slot.warId).select("size").lean();
    if (!war) throw new HttpError(404, "Parent war not found");

    const body = req.body as {
      teamBaseNumber?: unknown;
      enemyBaseNumber?: unknown;
      starsNeeded?: unknown;
      isMultiSelect?: unknown;
    };

    // The multi-select toggle is handled in isolation — the UI fires it as
    // its own request from the slot card's toggle button, never bundled
    // with a base assignment in the same PATCH.
    if (body.isMultiSelect !== undefined) {
      if (typeof body.isMultiSelect !== "boolean") {
        throw new HttpError(400, "isMultiSelect must be a boolean");
      }

      if (body.isMultiSelect && !slot.isMultiSelect) {
        // Turning ON: carry the existing single target (if any) into the
        // pool as its first entry so the user doesn't lose their pick.
        slot.enemyBaseNumbers = typeof slot.enemyBaseNumber === "number" ? [slot.enemyBaseNumber] : [];
        slot.enemyBaseNumber = null;
        slot.isMultiSelect = true;
      } else if (!body.isMultiSelect && slot.isMultiSelect) {
        // Turning OFF: keep only the first pool entry, drop the rest.
        slot.enemyBaseNumber = slot.enemyBaseNumbers[0] ?? null;
        slot.enemyBaseNumbers = [];
        slot.isMultiSelect = false;
      }

      try {
        await slot.save();
      } catch (err) {
        if (isMongoDupKeyError(err)) {
          throw new HttpError(409, "That base number is already assigned to another slot");
        }
        throw err;
      }
      emitToWar(String(slot.warId), "slot:updated", slot);
      res.json(slot);
      return;
    }

    if (body.teamBaseNumber !== undefined) {
      if (body.teamBaseNumber === null) {
        slot.teamBaseNumber = null;
      } else if (typeof body.teamBaseNumber === "number") {
        validateBaseNumberRange(war.size, "teamBaseNumber", body.teamBaseNumber);
        slot.teamBaseNumber = body.teamBaseNumber;
      } else {
        throw new HttpError(400, "teamBaseNumber must be a number or null");
      }
    }

    if (body.enemyBaseNumber !== undefined) {
      if (slot.isMultiSelect) {
        throw new HttpError(400, "This slot is in multi-select mode — use the enemy-bases endpoints instead");
      }
      if (body.enemyBaseNumber === null) {
        slot.enemyBaseNumber = null;
      } else if (typeof body.enemyBaseNumber === "number") {
        validateBaseNumberRange(war.size, "enemyBaseNumber", body.enemyBaseNumber);
        await assertNotInAnyPool(slot.warId, body.enemyBaseNumber, slot._id);
        slot.enemyBaseNumber = body.enemyBaseNumber;
      } else {
        throw new HttpError(400, "enemyBaseNumber must be a number or null");
      }
    }

    if (body.starsNeeded !== undefined) {
      if (typeof body.starsNeeded !== "number" || ![1, 2, 3].includes(body.starsNeeded)) {
        throw new HttpError(400, "starsNeeded must be 1, 2 or 3");
      }
      slot.starsNeeded = body.starsNeeded;
    }

    try {
      await slot.save();
    } catch (err) {
      // The unique partial indexes on { warId, teamBaseNumber } / { warId, enemyBaseNumber }
      // are the real source of truth for "is this base already taken" — catching the
      // dup-key error here avoids an extra findOne() round trip on every single PATCH,
      // while still guaranteeing correctness (including races between two clients).
      if (isMongoDupKeyError(err)) {
        throw new HttpError(409, "That base number is already assigned to another slot");
      }
      throw err;
    }
    emitToWar(String(slot.warId), "slot:updated", slot);

    res.json(slot);
  })
);

// POST /api/slots/:id/enemy-bases - add one base to a multi-select slot's pool
router.post(
  "/slots/:id/enemy-bases",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "slot");
    const slot = await Slot.findById(id);
    if (!slot) throw new HttpError(404, "Slot not found");
    if (!slot.isMultiSelect) throw new HttpError(400, "Enable multi-select on this slot first");

    const war = await War.findById(slot.warId).select("size").lean();
    if (!war) throw new HttpError(404, "Parent war not found");

    const { baseNumber } = req.body as { baseNumber?: unknown };
    if (typeof baseNumber !== "number") throw new HttpError(400, "baseNumber must be a number");
    validateBaseNumberRange(war.size, "baseNumber", baseNumber);

    if (slot.enemyBaseNumbers.includes(baseNumber)) {
      res.json(slot);
      return;
    }

    await assertNotNormalTarget(slot.warId, baseNumber, slot._id);

    slot.enemyBaseNumbers.push(baseNumber);
    await slot.save();

    emitToWar(String(slot.warId), "slot:updated", slot);
    res.json(slot);
  })
);

// DELETE /api/slots/:id/enemy-bases/:baseNumber - remove one base from the pool
router.delete(
  "/slots/:id/enemy-bases/:baseNumber",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "slot");
    const slot = await Slot.findById(id);
    if (!slot) throw new HttpError(404, "Slot not found");
    if (!slot.isMultiSelect) throw new HttpError(400, "This slot is not in multi-select mode");

    const baseNumber = Number(req.params.baseNumber);
    if (!Number.isInteger(baseNumber)) throw new HttpError(400, "Invalid base number");

    slot.enemyBaseNumbers = slot.enemyBaseNumbers.filter((n) => n !== baseNumber);
    await slot.save();

    emitToWar(String(slot.warId), "slot:updated", slot);
    res.json(slot);
  })
);

export default router;