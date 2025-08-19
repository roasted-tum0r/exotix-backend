import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { AppLogger } from 'src/common/utils/app.logger';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CartRepository {
  constructor(private readonly prismaService: PrismaService) {}
  async getCartByUserID(userId: number) {
    try {
      return this.prismaService.cart.findFirst({
        where: { userId: userId },
        include: {
          items: {
            include: {
              item: true,
            },
          },
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
