import type { userData } from "../../types/userData";
import {API} from '../../service/axios'
import authenticationRoutes from "../../types/endPoints/authEndpoints";

export const adminLogin = async(userData:userData):Promise<any> => {
    try {
        const response = await API.post(authenticationRoutes.adminLogin,userData,{withCredentials:true})
        
        console.log("admin login response",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const adminLogout = async ():Promise<any> => {
    try{
        const response = await API.post(authenticationRoutes.adminLogout,{},{withCredentials:true})
        console.log("admin logout response",response.data)
        return response.data
    }catch(error){
        throw error
    }
}