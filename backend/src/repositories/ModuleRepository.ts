import { IModule, ModuleModel } from "../models/moduleModel";
import { GenericRepository } from "./genericRepository";


export class ModuleDetailRepository extends GenericRepository<IModule>{
    constructor(){
        super(ModuleModel)
    }
}