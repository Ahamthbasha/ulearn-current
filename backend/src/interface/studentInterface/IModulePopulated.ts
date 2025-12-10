import { IChapter } from "../../models/chapterModel";
import { IQuiz } from "../../models/quizModel";
import { IModule } from "../../models/moduleModel";

export interface IModulePopulated extends IModule {
  chapters: IChapter[];
  quiz?: IQuiz;
}
