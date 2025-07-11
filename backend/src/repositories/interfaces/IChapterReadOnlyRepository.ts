export interface IChapterReadOnlyRepository {
  countChaptersByCourse(courseId: string): Promise<number>;
}
