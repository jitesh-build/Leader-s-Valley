import { Router } from "express";
import { Types } from "mongoose";
import { EnemyScout } from "../models/EnemyScout";
import { asyncHandler, HttpError } from "../asyncHandler";
import { emitToWar } from "../socket";

const router = Router();

function requireObjectId(id: string | undefined, label: string): string {
  if (!id || !Types.ObjectId.isValid(id)) {
    throw new HttpError(400, `Invalid ${label} id`);
  }
  return id;
}

// GET /api/wars/:warId/enemy-scouts - expected-star rating for every enemy base
router.get(
  "/wars/:warId/enemy-scouts",
  asyncHandler(async (req, res) => {
    const warId = requireObjectId(req.params.warId, "war");
    const scouts = await EnemyScout.find({ warId }).sort({ baseNumber: 1 }).lean();
    res.json(scouts);
  })
);

// PATCH /api/wars/:warId/enemy-scouts/:baseNumber - set expected stars for one base
router.patch(
  "/wars/:warId/enemy-scouts/:baseNumber",
  asyncHandler(async (req, res) => {
    const warId = requireObjectId(req.params.warId, "war");
    const baseNumberRaw = req.params.baseNumber;
    const baseNumber = Number(baseNumberRaw);
    if (!Number.isInteger(baseNumber) || baseNumber < 1) {
      throw new HttpError(400, "Invalid base number");
    }

    const { expectedStars } = req.body as { expectedStars?: unknown };
    if (typeof expectedStars !== "number" || ![1, 2, 3].includes(expectedStars)) {
      throw new HttpError(400, "expectedStars must be 1, 2 or 3");
    }

    const scout = await EnemyScout.findOneAndUpdate(
      { warId, baseNumber },
      { expectedStars },
      { new: true }
    );
    if (!scout) throw new HttpError(404, "Enemy base not found for this war");

    emitToWar(warId, "scout:updated", scout);
    
    res.json(scout);
  })
);

export default router;
