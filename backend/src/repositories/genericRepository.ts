import { Model, Document, SortOrder, PopulateOptions, PipelineStage } from "mongoose";

type PopulateArg = PopulateOptions | PopulateOptions[] | string[];

export interface IGenericRepository<T extends Document> {
  create(payload: Partial<T>): Promise<T>;
  create(payload: Partial<T>[]): Promise<T[]>;

  findOne(filter: object,populate?:PopulateArg): Promise<T | null>;
  findById(id: string): Promise<T | null>;
  findAll(
    filter?: object,
    populate?: PopulateArg,
    sort?: Record<string, SortOrder>
  ): Promise<T[] | null>;

  update(id: string, data: Partial<T>): Promise<T | null>;
  updateOne(filter: object, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<T | null>;

  findByIdWithPopulate(id: string, populate?: PopulateArg): Promise<T | null>;
  updateOneWithPopulate(
    filter: object,
    data: Partial<T> | Record<string, any>,
    populate?: PopulateArg
  ): Promise<T | null>;

  paginate(
    filter: object,
    page: number,
    limit: number,
    sort?: Record<string, SortOrder>,
    populate?: PopulateArg
  ): Promise<{ data: T[]; total: number }>;

  findOneAndUpdate(filter:object,update:object,options?:object):Promise<T|null>

  aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[]>;

  find(filter: object, populate?: PopulateArg, sort?: Record<string, SortOrder>): Promise<T[]>;

  countDocuments(filter: object): Promise<number>;

}

export class GenericRepository<T extends Document> {
  private model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  // Method Overloads
  async create(payload: Partial<T>): Promise<T>;
  async create(payload: Partial<T>[]): Promise<T[]>;
  async create(payload: Partial<T> | Partial<T>[]): Promise<T | T[]> {
    return await this.model.create(payload);
  }

  async findOne(filter: object, populate?: PopulateArg): Promise<T | null> {
  let query = this.model.findOne(filter);

  if (populate) {
    query = query.populate(populate);
  }

  return await query;
}


  async findAll(
    filter: object = {},
    populate?: PopulateArg,
    sort: Record<string, SortOrder> = {}
  ): Promise<T[]> {
    let query = this.model.find(filter);

    if (populate) {
      query = query.populate(populate);
    }

    if (Object.keys(sort).length > 0) {
      query = query.sort(sort);
    }

    return await query;
  }

  async findById(id: string): Promise<T | null> {
    return await this.model.findById(id);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async updateOne(filter: object, data: Partial<T>): Promise<T | null> {
    const updatedDoc = await this.model.findOneAndUpdate(filter, data, {
      new: true,
      upsert: false,
    });

    if (!updatedDoc) {
      console.warn("No document found to update with filter:", filter);
    }

    return updatedDoc;
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id);
  }

  async paginate(
    filter: object,
    page: number,
    limit: number,
    sort: Record<string, SortOrder> = { createdAt: -1 },
    populate?: PopulateArg
  ): Promise<{ data: T[]; total: number }> {
    const total = await this.model.countDocuments(filter);

    let query = this.model.find(filter).sort(sort);

    if (populate) {
      query = query.populate(populate);
    }

    const data = await query
      .skip((page - 1) * limit)
      .limit(limit);

    return { data, total };
  }

  async findByIdWithPopulate(id: string, populate?: PopulateArg): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) {
      query = query.populate(populate);
    }
    return await query;
  }

  async updateOneWithPopulate(
    filter: object,
    data: Partial<T> | Record<string, any>,
    populate?: PopulateArg
  ): Promise<T | null> {
    let query = this.model.findOneAndUpdate(filter, data, {
      new: true,
      upsert: false,
    });

    if (populate) {
      query = query.populate(populate);
    }

    return await query;
  }

  async findOneAndUpdate(
  filter: object,
  update: object,
  options: object = { new: true }
): Promise<T | null> {
  return this.model.findOneAndUpdate(filter, update, options);
}



async aggregate<R = any>(pipeline: PipelineStage[]): Promise<R[]> {
  return this.model.aggregate<R>(pipeline);
}

async find(
  filter: object = {},
  populate?: PopulateArg,
  sort: Record<string, SortOrder> = {}
): Promise<T[]> {
  let query = this.model.find(filter);

  if (populate) {
    query = query.populate(populate);
  }

  if (Object.keys(sort).length > 0) {
    query = query.sort(sort);
  }

  return await query;
}


async countDocuments(filter: object): Promise<number> {
  return await this.model.countDocuments(filter);
}


}
