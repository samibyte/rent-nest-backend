import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";
import { catchAsync } from "../shared/catchAsync.js";

export const validateRequest = (schema: ZodType) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    await schema.parseAsync(req.body);
    next();
  });
