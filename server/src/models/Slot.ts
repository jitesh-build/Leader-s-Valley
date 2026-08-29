import { Schema, model, Document, Types } from "mongoose";

export interface SlotDocument extends Document {
  _id: Types.ObjectId;
  warId: Types.ObjectId;
  index: number; // fixed slot position, 1..war.size
  teamBaseNumber: number | null;
  enemyBaseNumber: number | null;
  enemyBaseNumbers: number[];
  isMultiSelect: boolean;
  starsNeeded: number; // 1-3, defaults to 3
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<SlotDocument>(
  {
    warId: { type: Schema.Types.ObjectId, ref: "War", required: true, index: true },
    index: { type: Number, required: true, min: 1 },
    teamBaseNumber: { type: Number, default: null, min: 1 },
    enemyBaseNumber: { type: Number, default: null, min: 1 },
    enemyBaseNumbers: { type: [Number], default: [] },
    isMultiSelect: { type: Boolean, default: false },
    starsNeeded: { type: Number, default: 3, min: 1, max: 3 },
  },
  { timestamps: true }
);

SlotSchema.index({ warId: 1, index: 1 }, { unique: true });

// A team-base slot number or enemy-base target can only be used by one slot per war.
SlotSchema.index(
  { warId: 1, teamBaseNumber: 1 },
  { unique: true, partialFilterExpression: { teamBaseNumber: { $type: "number" } } }
);
SlotSchema.index(
  { warId: 1, enemyBaseNumber: 1 },
  { unique: true, partialFilterExpression: { enemyBaseNumber: { $type: "number" } } }
);

export const Slot = model<SlotDocument>("Slot", SlotSchema);
