export interface SlotCreatePayload {
  startTime: string;
  endTime: string;
  price: number;
  recurrenceRule?: {
    daysOfWeek: number[];
    startDate: string;
    endDate: string;
  };
}

export interface SlotUpdatePayload {
  startTime?: string;
  endTime?: string;
  price?: number;
}