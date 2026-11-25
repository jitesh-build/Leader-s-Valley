import { Router } from "express";
import { UserData } from "../models/UserData";
import { asyncHandler, HttpError } from "../asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { ACCOUNT_DATA_KEYS, isAccountDataKey, MAX_VALUE_BYTES } from "../types/accountKeys";

const router = Router();
router.use(requireAuth);

// GET /api/account/data - every saved key for this account
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const docs = await UserData.find({ userId: req.userId, key: { $in: ACCOUNT_DATA_KEYS } }).lean();
    res.json({ items: docs.map((d) => ({ key: d.key, value: d.value, updatedAt: d.updatedAt })) });
  })
);

// PUT /api/account/data/:key - save (create or replace) one key's value
router.put(
  "/:key",
  asyncHandler(async (req, res) => {
    const key = req.params.key ?? "";
    if (!isAccountDataKey(key)) throw new HttpError(400, "Unknown storage key");
    const { value } = req.body as { value?: unknown };
    if (typeof value !== "string") throw new HttpError(400, "value must be a string");
    if (Buffer.byteLength(value, "utf8") > MAX_VALUE_BYTES) throw new HttpError(413, "That's too much data for one item");

    const doc = await UserData.findOneAndUpdate({ userId: req.userId, key }, { value }, { upsert: true, new: true, setDefaultsOnInsert: true });
    if (!doc) throw new HttpError(500, "Could not save");
    res.json({ key: doc.key, value: doc.value, updatedAt: doc.updatedAt });
  })
);

// DELETE /api/account/data/:key
router.delete(
  "/:key",
  asyncHandler(async (req, res) => {
    const key = req.params.key ?? "";
    if (!isAccountDataKey(key)) throw new HttpError(400, "Unknown storage key");
    await UserData.deleteOne({ userId: req.userId, key });
    res.status(204).send();
  })
);

// DELETE /api/account/data - wipes every saved key (used by "Reset all" in Settings)
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    await UserData.deleteMany({ userId: req.userId, key: { $in: ACCOUNT_DATA_KEYS } });
    res.status(204).send();
  })
);

export default router;