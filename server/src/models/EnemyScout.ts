import { Schema, model, Document, Types } from "mongoose";

export interface EnemyScoutDocument extends Document {
  _id: Types.ObjectId;
  warId: Types.ObjectId;
  baseNumber: number; // 1..war.size
  expectedStars: number; // 1-3, defaults to 3
  createdAt: Date;
  updatedAt: Date;
}

const EnemyScoutSchema = new Schema<EnemyScoutDocument>(
  {
    warId: { type: Schema.Types.ObjectId, ref: "War", required: true, index: true },
    baseNumber: { type: Number, required: true, min: 1 },
    expectedStars: { type: Number, default: 3, min: 1, max: 3 },
  },
  { timestamps: true }
);

EnemyScoutSchema.index({ warId: 1, baseNumber: 1 }, { unique: true });

export const EnemyScout = model<EnemyScoutDocument>("EnemyScout", EnemyScoutSchema);
