import { Schema, model, Document, Types } from "mongoose";

export interface UserDataDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  key: string;
  /** JSON-serialized value — exactly what the browser used to keep in localStorage under this key. */
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserDataSchema = new Schema<UserDataDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

UserDataSchema.index({ userId: 1, key: 1 }, { unique: true });

export const UserData = model<UserDataDocument>("UserData", UserDataSchema);
