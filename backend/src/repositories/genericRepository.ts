import {
  Model,
  Document,
  SortOrder,
  PopulateOptions,
  PipelineStage,
  ClientSession,
  HydratedDocument,
} from "mongoose";

export interface MongooseOptions {
  session?: ClientSession;
  new?: boolean;
  upsert?: boolean;
  [key: string]: any;
}

type PopulateArg = PopulateOptions | PopulateOptions[] | string[];

export interface IGenericRepository<T extends Document> {
  create(payload: Partial<T>, options?: MongooseOptions): Promise<T>;
  create(payload: Partial<T>[], options?: MongooseOptions): Promise<T[]>;
  findOne(
    filter: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  findAll(
    filter?: object,
    populate?: PopulateArg,
    sort?: Record<string, SortOrder>,
  ): Promise<T[] | null>;
  update(
    id: string,
    data: Partial<T>,
    options?: MongooseOptions,
  ): Promise<T | null>;
  updateOne(filter: object, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;
  findByIdWithPopulate(id: string, populate?: PopulateArg): Promise<T | null>;
  updateOneWithPopulate(
    filter: object,
    data: Partial<T> | Record<string, any>,
    populate?: PopulateArg,
  ): Promise<T | null>;
  paginate(
    filter: object,
    page: number,
    limit: number,
    sort?: Record<string, SortOrder>,
    populate?: PopulateArg,
  ): Promise<{ data: T[]; total: number }>;
  findOneAndUpdate(
    filter: object,
    update: object,
    options?: MongooseOptions,
  ): Promise<T | null>;
  aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[]>;
  find(
    filter: object,
    populate?: PopulateArg,
    sort?: Record<string, SortOrder>,
  ): Promise<T[]>;
  countDocuments(filter: object): Promise<number>;
}

export class GenericRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(payload: Partial<T>, options?: MongooseOptions): Promise<T>;
  async create(payload: Partial<T>[], options?: MongooseOptions): Promise<T[]>;
  async create(
    payload: Partial<T> | Partial<T>[],
    options?: MongooseOptions,
  ): Promise<T | T[]> {
    if (!Array.isArray(payload)) {
      const result = await this.model.create([payload], options);
      return result[0] as HydratedDocument<T>;
    }
    return (await this.model.create(payload, options)) as HydratedDocument<T>[];
  }

  async findOne(
    filter: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) {
      query = query.populate(populate);
    }
    if (session) {
      query = query.session(session);
    }
    return await query.exec();
  }

  async findAll(
    filter: object = {},
    populate?: PopulateArg,
    sort: Record<string, SortOrder> = {},
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (populate) {
      query = query.populate(populate);
    }
    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }
    return await query.exec();
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id).exec();
  }

  async update(
    id: string,
    data: Partial<T>,
    options: MongooseOptions = { new: true },
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateOne(filter: object, data: Partial<T>): Promise<T | null> {
    const updatedDoc = await this.model
      .findOneAndUpdate(filter, data, {
        new: true,
        upsert: false,
      })
      .exec();
    if (!updatedDoc) {
      console.warn("No document found to update with filter:", filter);
    }
    return updatedDoc;
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async paginate(
    filter: object,
    page: number,
    limit: number,
    sort: Record<string, SortOrder> = { createdAt: -1 },
    populate?: PopulateArg,
  ): Promise<{ data: T[]; total: number }> {
    const total = await this.model.countDocuments(filter).exec();
    let query = this.model.find(filter).sort(sort);
    if (populate) {
      query = query.populate(populate);
    }
    const data = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { data, total };
  }

  async findByIdWithPopulate(
    id: string,
    populate?: PopulateArg,
  ): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) {
      query = query.populate(populate);
    }
    return await query.exec();
  }

  async updateOneWithPopulate(
    filter: object,
    data: Partial<T> | Record<string, any>,
    populate?: PopulateArg,
  ): Promise<T | null> {
    let query = this.model.findOneAndUpdate(filter, data, {
      new: true,
      upsert: false,
    });
    if (populate) {
      query = query.populate(populate);
    }
    return await query.exec();
  }

  async findOneAndUpdate(
    filter: object,
    update: object,
    options: MongooseOptions = { new: true },
  ): Promise<T | null> {
    return await this.model.findOneAndUpdate(filter, update, options).exec();
  }

  async aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[]> {
    return await this.model.aggregate<R>(pipeline).exec();
  }

  async find(
    filter: object = {},
    populate?: PopulateArg,
    sort: Record<string, SortOrder> = {},
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (populate) {
      query = query.populate(populate);
    }
    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }
    return await query.exec();
  }

  async countDocuments(filter: object): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }
}
