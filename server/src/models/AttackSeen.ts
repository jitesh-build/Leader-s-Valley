import { Schema, model } from "mongoose";

/**
 * When the server FIRST saw a given attack in a war. The Clash of Clans API has no attack
 * timestamps, so this is what time-based clan rules (e.g. "mirror in the first 12h") use.
 */
const attackSeenSchema = new Schema(
  {
    /** "<our clan tag>|<war preparationStartTime>" — unique per war (and per CWL round). */
    warKey: { type: String, required: true },
    /** Attack order within the war (1 = very first attack). Unique within a war. */
    order: { type: Number, required: true },
    firstSeenAt: { type: Date, required: true },
  },
  { versionKey: false }
);

attackSeenSchema.index({ warKey: 1, order: 1 }, { unique: true });
// Old wars are not needed: Mongo deletes these automatically after 30 days.
attackSeenSchema.index({ firstSeenAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export const AttackSeen = model("AttackSeen", attackSeenSchema);