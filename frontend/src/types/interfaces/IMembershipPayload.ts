export interface IMembershipPayload {
  name: string;
  price: number;
  durationInDays: number;
  description?: string;
  benefits?: string[];
  isActive?: boolean;
}