import { IChapter, ChapterModel } from "../models/chapterModel";

import { GenericRepository } from "./genericRepository";

export class ChapterDetailRepository extends GenericRepository<IChapter> {
  constructor() {
    super(ChapterModel);
  }
}
