import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async getCartByUserID(userId: number) {
    try {
      return this.prismaService.cart.findFirst({
        where: { userId },
        select: {
          user: true,
          items: {
            select: {
              id: true,
              quantity: true,
              addedAt: true,
              item: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  image: true,
                  price: true,
                  discountPercentage: true,
                  discountStart: true,
                  discountEnd: true,
                },
              },
            },
          },
          id: true,
          createdAt: true,
          name: true,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async addCartRow(userId: number) {
    try {
      return await this.prismaService.cart.create({
        data: {
          name: `New cart for ${userId}`,
          userId: userId,
        },
      });
    } catch (error) {
      AppLogger.error(error);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
}
