
export interface IQuizReadOnlyRepository {
  countQuestionsByCourse(courseId: string): Promise<number>;
}
