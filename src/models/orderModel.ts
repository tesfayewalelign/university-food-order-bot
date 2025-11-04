import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: Number, required: true },
    username: { type: String },
    mealType: {
      type: String,
      enum: ["Contract", "Non-Contract"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    assignedDriver: { type: String },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
