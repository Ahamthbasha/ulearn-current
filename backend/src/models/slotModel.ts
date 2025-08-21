import { Schema, model, Types, Document } from "mongoose";

export interface ISlot extends Document {
  _id: Types.ObjectId;
  instructorId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  price: number;
  isBooked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const SlotSchema = new Schema<ISlot>(
  {
    instructorId: {
      type: Schema.Types.ObjectId,
      ref: "Instructor",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ISlot, value: Date) {
          return value > this.startTime;
        },
        message: "endTime must be after startTime",
      },
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Price must be a non-negative number"],
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model<ISlot>("Slot", SlotSchema);