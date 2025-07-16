import { ISlot } from "../models/slotModel";

import { IInstructor } from "../models/instructorModel";

export type PopulatedSlot = ISlot & {
  instructorId: IInstructor;
};