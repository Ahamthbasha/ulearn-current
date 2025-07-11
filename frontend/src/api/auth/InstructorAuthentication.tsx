import {API} from '../../service/axios'
import type { userData } from '../../types/userData'

import authenticationRoutes from '../../types/endPoints/authEndpoints'
import type { Login } from '../../types/LoginTypes'


export const signup = async (userData:userData) : Promise<any> => {
    try {
        const response = await API.post(authenticationRoutes.instructorSignUp,userData,{withCredentials:true})
        console.log("Signup response in instructor",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const resendOtp = async (email:string) : Promise<any> => {
    try {
        const response = await API.post(authenticationRoutes.instructorResendOtp,{email})

        console.log("instructor resend otp response",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const verifyOtp = async (otp:string) : Promise<any> => {
    try {
        const response = await API.post(authenticationRoutes.instructorVerifyOtp,{otp})

        console.log("instructor verify otp",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const login = async({email,password,role}:Login):Promise<any> => {
    try{
        const response = await API.post(authenticationRoutes.instructorLogin,{email,password,role},{withCredentials:true})

        console.log("instructorLogin response",response.data)

        return response.data
    }
    catch(error){
        throw error
    }
}


export const logout = async():Promise<any> => {
    try {
        const response = await API.post(authenticationRoutes.instructorLogout,{},{withCredentials:true})

        console.log("Instructor logout response",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const instructorVerifyEmail = async(email:string):Promise<any>=>{
    try {
        const response = await API.post(authenticationRoutes.instructorVerifyEmail,{email})

        console.log('instructor response verify email',response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const instructorVerifyResetOtp = async(email:string,otp:string)=>{
    try {
        const response = await API.post(authenticationRoutes.instructorVerifyResetOtp,{email,otp},{withCredentials:true})
        
        console.log("instructor verify otp response",response.data)

        return response.data
    } catch (error) {
        throw error
    }
}

export const instructorForgotResendOtp = async(email:string) => {
    try {
        const response = await API.post(authenticationRoutes.instructorForgotResendOtp,{email})
        console.log('instructor resendotp',response.data)
        return response.data
    } catch (error) {
        throw error
    }
}

export const instructorResetPassword = async(password:string):Promise<any>=>{
    try {
        const response = await API.post(authenticationRoutes.instructorResetPassword,{password},{withCredentials:true})

        console.log('reset password instructor',response.data)
        
        return response.data
    } catch (error) {
        throw error
    }
}

export const googleLogin = async(login:object):Promise<any>=>{
    try {
        const response = await API.post(authenticationRoutes.instructorGoogleLogin,login,{withCredentials:true})
        console.log("google login instructor",response.data)
        return response.data
    } catch (error) {
        throw error
    }
}