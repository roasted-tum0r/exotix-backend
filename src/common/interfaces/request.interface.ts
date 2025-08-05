import { User } from "@prisma/client";
import { Request } from "express";

export interface ReqAuth extends Request{
    user?: User;
}