import mongoose, { Schema, Document, Types } from "mongoose";
import { IInstructor } from "./instructorModel";
import { ISlot } from "./slotModel";

export interface IBooking extends Document {
  _id: Types.ObjectId;
  studentId: Types.ObjectId;
  instructorId: Types.ObjectId | IInstructor;
  slotId: Types.ObjectId | ISlot;
  status: "pending" | "confirmed" | "cancelled" | "failed";
  paymentStatus: "paid" | "failed" | "pending";
  txnId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },

    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "initiated"],
      default: "confirmed",
    },

    paymentStatus: {
      type: String,
      enum: ["paid", "failed", "pending"],
      default: "pending",
    },

    txnId: { type: String },
  },
  { timestamps: true },
);

export const BookingModel = mongoose.model<IBooking>("Booking", BookingSchema);
