export type Login = {
    email : string,
    password : string,
    role:string
}

export interface DecodedGoogleCredential {
  name: string;
  email: string;
  picture: string;
  role:string;
}