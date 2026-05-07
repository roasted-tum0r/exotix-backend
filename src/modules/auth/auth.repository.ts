import { PrismaService } from 'src/prisma/prisma.service';
import { ImageOwnerType, Prisma, User, UserRole } from '@prisma/client';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthUserDto } from './dto/create-auth.dto';
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) { }

  // ─── Shared select projection ────────────────────────────────────────────────
  userSelectFields(requestingUserRole?: UserRole, isSelf: boolean = false): Prisma.UserSelect {
    return {
      id: true,
      firstname: true,
      lastname: true,
      phone: true,
      email: true,
      role: true,
      isActive: true,
      addresses: true,
      orders: true,
      createdAt: true,
      updatedAt: true,
      isPremium: true,
      isVerified: true,
      branchId: true,
      images: {
        select: {
          ownerType: true,
          id: true,
          imageUrl: true,
          publicId: true,
        },
        where: {
          ownerType: ImageOwnerType.USER,
        },
      },
      // Secret fields logic
      ...((requestingUserRole === UserRole.ADMIN || isSelf)
        ? {
          employee: true,
          cartItems: true,
          favourites: true,
          wishlists: true,
        }
        : {}),
    };
  }
  // ─────────────────────────────────────────────────────────────────────────────

  async findByUserId(userId: string, requestingUserRole?: UserRole, isSelf: boolean = false) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: this.userSelectFields(requestingUserRole, isSelf),
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `User not found!`,
      });
    }
  }
  async findByEmail(email: string) {
    try {
      return this.prisma.user.findUnique({ where: { email, isActive: true } });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async findByPhone(phone: string) {
    try {
      return this.prisma.user.findUnique({ where: { phone, isActive: true } });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async createNewUser(
    data: Omit<CreateAuthUserDto, 'registrationPurpose'> & { password: string },
  ): Promise<User> {
    try {
      await this.prisma.newsletterSubscriber.updateMany({
        where: { email: data.email },
        data: { isUser: true },
      });
      return this.prisma.user.create({
        data,
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async createNewEmployee(
    userId: string,
    branchId: string,
    employeeData: Omit<Prisma.EmployeeCreateInput, 'user' | 'branch'>,
  ) {
    try {
      return this.prisma.employee.create({
        data: {
          ...employeeData,
          user: { connect: { id: userId } },
          branch: { connect: { id: branchId ?? 1 } },
        },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async updateUserVerified(userId: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { isVerified: true },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async updateUserById(
    id: string,
    updateData: Partial<Prisma.UserUpdateInput>,
    requestingUserRole?: UserRole,
    isSelf: boolean = false,
  ) {
    try {
      return this.prisma.user.update({
        where: { id },
        data: updateData,
        select: this.userSelectFields(requestingUserRole, isSelf),
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
  async updatePassword(id: string, hashedPassword: string) {
    try {
      return this.prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
        select: { id: true, email: true },
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong while updating password.`,
      });
    }
  }
  async deactivateUser(
    id: string,
    requestingUserRole?: UserRole,
    isSelf: boolean = false,
  ) {
    try {
      return this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: this.userSelectFields(requestingUserRole, isSelf),
      });
    } catch (error) {
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        error: true,
        message: `Something went wrong.`,
      });
    }
  }
}
