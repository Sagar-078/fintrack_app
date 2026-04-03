import mongoose, { Document, Schema } from "mongoose";

export interface IFinancialRecord extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const financialRecordSchema: Schema<IFinancialRecord> = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFinancialRecord>(
  "FinancialRecord",
  financialRecordSchema
);
