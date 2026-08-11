import { IRequestUser } from "./requestUser.interface";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      role: any;
    }

    interface Request {
      user: IRequestUser;
    }
  }
}
