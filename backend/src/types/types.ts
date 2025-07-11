export interface IOtpGenerate {
  createOtpDigit(length?: number): Promise<string>;
}

export type updateRequestType = {
  username : string,
  degreeCertificateUrl : string,
  resumeUrl : string,
  status : string
}
