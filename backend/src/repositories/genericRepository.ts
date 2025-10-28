import {
  Model,
  Document,
  SortOrder,
  PopulateOptions,
  PipelineStage,
  ClientSession,
  HydratedDocument,
} from "mongoose";
import { appLogger } from "../utils/logger";

export interface MongooseOptions {
  session?: ClientSession;
  new?: boolean;
  upsert?: boolean;
  ordered?: boolean;
  [key: string]: any;
}

type PopulateArg = PopulateOptions | PopulateOptions[] | string[];

export interface IGenericRepository<T extends Document> {
  create(payload: Partial<T>, options?: MongooseOptions): Promise<T>;
  create(payload: Partial<T>[], options?: MongooseOptions): Promise<T[]>;
  createWithSession(data: Partial<T>, session: ClientSession): Promise<T>;
  createManyWithSession(
    data: Partial<T>[],
    session: ClientSession,
  ): Promise<T[]>;

  findOne(
    filter: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null>;
  findById(id: string, session?: ClientSession): Promise<T | null>;
  findByIdWithLock(id: string, session: ClientSession): Promise<T | null>;

  findAll(
    filter?: object,
    populate?: PopulateArg,
    sort?: Record<string, SortOrder>,
  ): Promise<T[] | null>;
  findAllWithSession(filter: any, session: ClientSession): Promise<T[] | null>;

  update(
    id: string,
    data: Partial<T>,
    options?: MongooseOptions,
  ): Promise<T | null>;
  updateWithSession(
    id: string,
    data: Partial<T>,
    session: ClientSession,
  ): Promise<T | null>;

  updateOne(
    filter: object,
    data: Partial<T> | Record<string, any>,
    options?: MongooseOptions,
  ): Promise<T | null>;
  updateMany(
    filter: object,
    data: Partial<T> | Record<string, any>,
    options?: MongooseOptions,
  ): Promise<void>;

  delete(id: string): Promise<T | null>;
  deleteWithSession(id: string, session: ClientSession): Promise<T | null>;

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
  paginateWithAggregation(
    pipeline: PipelineStage[],
    page: number,
    limit: number,
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

  findWithProjection(
    filter: object,
    projection: object,
    populate?: PopulateArg,
    sort?: Record<string, SortOrder>,
  ): Promise<T[]>;

  findOneWithProjection(
    filter: object,
    projection: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null>;

  findOneAndDelete(
    filter: object,
    options?: MongooseOptions,
  ): Promise<T | null>;
  deleteMany(filter: object, options?: MongooseOptions): Promise<void>;
}

export class GenericRepository<T extends Document>
  implements IGenericRepository<T>
{
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

  async createWithSession(
    data: Partial<T>,
    session: ClientSession,
  ): Promise<T> {
    const result = await this.model.create([data], { session });
    return result[0] as HydratedDocument<T>;
  }

  async createManyWithSession(
    data: Partial<T>[],
    session: ClientSession,
  ): Promise<T[]> {
    return (await this.model.create(data, {
      session,
      ordered: true,
    })) as HydratedDocument<T>[];
  }

  async findOne(
    filter: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) query = query.populate(populate);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async findAll(
    filter: object = {},
    populate?: PopulateArg,
    sort: Record<string, SortOrder> = {},
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (populate) query = query.populate(populate);
    if (Object.keys(sort).length > 0) query = query.sort(sort);
    return await query.exec();
  }

  async findAllWithSession(filter: any, session: ClientSession): Promise<T[]> {
    return await this.model.find(filter).session(session).exec();
  }

  async findById(id: string, session?: ClientSession): Promise<T | null> {
    let query = this.model.findById(id);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async findByIdWithLock(
    id: string,
    session: ClientSession,
  ): Promise<T | null> {
    return await this.model
      .findOneAndUpdate(
        { _id: id },
        {},
        { session, new: true, runValidators: false },
      )
      .exec();
  }

  async update(
    id: string,
    data: Partial<T>,
    options: MongooseOptions = { new: true },
  ): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, options).exec();
  }

  async updateWithSession(
    id: string,
    data: Partial<T>,
    session: ClientSession,
  ): Promise<T | null> {
    return await this.model
      .findByIdAndUpdate(id, data, { new: true, session })
      .exec();
  }

  async updateOne(
    filter: object,
    data: Partial<T> | Record<string, any>,
    options?: MongooseOptions,
  ): Promise<T | null> {
    const updatedDoc = await this.model
      .findOneAndUpdate(filter, data, { new: true, upsert: false, ...options })
      .exec();
    if (!updatedDoc) {
      appLogger.warn("No document found to update with filter:", filter);
    }
    return updatedDoc;
  }

  async updateMany(
    filter: object,
    data: Partial<T>,
    options?: MongooseOptions,
  ): Promise<void> {
    await this.model.updateMany(filter, data, options).exec();
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async deleteWithSession(
    id: string,
    session: ClientSession,
  ): Promise<T | null> {
    return await this.model.findByIdAndDelete(id, { session }).exec();
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
    if (populate) query = query.populate(populate);
    const data = await query
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    return { data, total };
  }

  async paginateWithAggregation(
    pipeline: PipelineStage[],
    page: number,
    limit: number,
  ): Promise<{ data: T[]; total: number }> {
    // Create a pipeline to count total documents
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await this.model.aggregate(countPipeline).exec();
    const total = countResult.length > 0 ? countResult[0].total : 0;

    // Add pagination stages to the original pipeline
    const paginatedPipeline = [
      ...pipeline,
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const data = await this.model.aggregate<T>(paginatedPipeline).exec();
    return { data, total };
  }

  async findByIdWithPopulate(
    id: string,
    populate?: PopulateArg,
  ): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) query = query.populate(populate);
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
    if (populate) query = query.populate(populate);
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
    if (populate) query = query.populate(populate);
    if (Object.keys(sort).length > 0) query = query.sort(sort);
    return await query.exec();
  }

  async countDocuments(filter: object): Promise<number> {
    return await this.model.countDocuments(filter).exec();
  }

  async findWithProjection(
    filter: object = {},
    projection: object = {},
    populate?: PopulateArg,
    sort: Record<string, SortOrder> = {},
  ): Promise<T[]> {
    let query = this.model.find(filter, projection);
    if (populate) query = query.populate(populate);
    if (Object.keys(sort).length > 0) query = query.sort(sort);
    return await query.exec();
  }

  async findOneWithProjection(
    filter: object,
    projection: object,
    populate?: PopulateArg,
    session?: ClientSession,
  ): Promise<T | null> {
    let query = this.model.findOne(filter, projection);
    if (populate) query = query.populate(populate);
    if (session) query = query.session(session);
    return await query.exec();
  }

  async findOneAndDelete(
    filter: object,
    options?: MongooseOptions,
  ): Promise<T | null> {
    return await this.model.findOneAndDelete(filter, options).exec();
  }

  async deleteMany(filter: object, options?: MongooseOptions): Promise<void> {
    await this.model.deleteMany(filter, options).exec();
  }
}
