// import { Router } from "express";
// import { Types } from "mongoose";
// import { Slot } from "../models/Slot";
// import { War } from "../models/War";
// import { asyncHandler, HttpError } from "../asyncHandler";

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

// async function validateBaseNumber(
//   warId: Types.ObjectId,
//   size: number,
//   field: "teamBaseNumber" | "enemyBaseNumber",
//   value: number,
//   excludeSlotId: Types.ObjectId
// ): Promise<void> {
//   if (!Number.isInteger(value) || value < 1 || value > size) {
//     throw new HttpError(400, `${field} must be an integer between 1 and ${size}`);
//   }
//   const clash = await Slot.findOne({
//     warId,
//     [field]: value,
//     _id: { $ne: excludeSlotId },
//   }).lean();
//   if (clash) {
//     throw new HttpError(409, `Base #${value} is already assigned to slot ${clash.index}`);
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
//     const war = await War.findById(slot.warId).lean();
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
//         await validateBaseNumber(war._id, war.size, "teamBaseNumber", body.teamBaseNumber, slot._id);
//         slot.teamBaseNumber = body.teamBaseNumber;
//       } else {
//         throw new HttpError(400, "teamBaseNumber must be a number or null");
//       }
//     }

//     if (body.enemyBaseNumber !== undefined) {
//       if (body.enemyBaseNumber === null) {
//         slot.enemyBaseNumber = null;
//       } else if (typeof body.enemyBaseNumber === "number") {
//         await validateBaseNumber(war._id, war.size, "enemyBaseNumber", body.enemyBaseNumber, slot._id);
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
//       if (isMongoDupKeyError(err)) {
//         throw new HttpError(409, "That base number was just taken by another slot");
//       }
//       throw err;
//     }

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

// GET /api/wars/:warId/slots - fixed list of attack slots for a war
router.get(
  "/wars/:warId/slots",
  asyncHandler(async (req, res) => {
    const warId = requireObjectId(req.params.warId, "war");
    const slots = await Slot.find({ warId }).sort({ index: 1 }).lean();
    res.json(slots);
  })
);

// PATCH /api/slots/:id - assign team base / enemy base / stars needed
router.patch(
  "/slots/:id",
  asyncHandler(async (req, res) => {
    const id = requireObjectId(req.params.id, "slot");
    const slot = await Slot.findById(id);
    if (!slot) throw new HttpError(404, "Slot not found");

    // Only need war.size for range validation, so project just that field
    // instead of pulling the whole war document over the wire.
    const war = await War.findById(slot.warId).select("size").lean();
    if (!war) throw new HttpError(404, "Parent war not found");

    const body = req.body as {
      teamBaseNumber?: unknown;
      enemyBaseNumber?: unknown;
      starsNeeded?: unknown;
    };

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
      if (body.enemyBaseNumber === null) {
        slot.enemyBaseNumber = null;
      } else if (typeof body.enemyBaseNumber === "number") {
        validateBaseNumberRange(war.size, "enemyBaseNumber", body.enemyBaseNumber);
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

export default router;