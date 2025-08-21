
export interface VerificationRequestDTO {
  id: string;
  username: string;
  email: string;
  status: string;
}


export interface VerificationRequestDetailDTO {
  id: string;
  username: string;
  email: string;
  status: string;
  resumeUrl: string;
  degreeCertificateUrl: string;
}
