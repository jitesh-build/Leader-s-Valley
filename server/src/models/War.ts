import { Schema, model, Document, Types } from "mongoose";
import { WAR_MODES, WarMode } from "../types/warModes";

export interface WarDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  mode: WarMode;
  size: number;
  leagueTier: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WarSchema = new Schema<WarDocument>(
  {
    name: { type: String, required: true, trim: true },
    mode: { type: String, required: true, enum: WAR_MODES },
    size: { type: Number, required: true, min: 1, max: 50 },
    leagueTier: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const War = model<WarDocument>("War", WarSchema);
