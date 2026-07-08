export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role?: "TENANT" | "LANDLORD";
}

export interface ILoginUser {
  email: string;
  password: string;
}
