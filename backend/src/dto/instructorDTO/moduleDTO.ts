export interface ModuleDTO {
  _id: string;
  moduleTitle: string;
  moduleNumber?: number;
  description: string;
  courseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}