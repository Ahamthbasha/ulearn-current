import jwt from "jsonwebtoken";

export async function verifyToken(token:string):Promise<any>{

    try {
        const secret = process.env.JWT_SECRET || "MYLIFEMYRULE" ;
        console.log(secret,"secret")
        const data= await jwt.verify(token,secret)
        console.log(data,"verify data")
        return data
    } catch (error) {
        throw error
        
    }
}