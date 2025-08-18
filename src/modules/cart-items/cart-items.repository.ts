import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class CartItemsRepository{
    constructor(private readonly prismaService:PrismaService){}
}