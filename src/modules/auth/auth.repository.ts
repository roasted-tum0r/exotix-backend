import { PrismaService } from 'src/prisma/prisma.service';
import { ImageOwnerType, Prisma, User } from '@prisma/client';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthUserDto } from './dto/create-auth.dto';
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) { }
  async findByUserId(userId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId, isActive: true },
        select: {
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
          password: true,
          images: { select: { ownerType: true, id: true, imageUrl: true, publicId: true }, where: { ownerType: ImageOwnerType.USER } },
        },
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
  ) {
    try {
      return this.prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          firstname: true,
          lastname: true,
          phone: true,
          email: true,
          role: true, // include only what you want to expose
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
    // updateData: Partial<Prisma.UserUpdateInput>,
  ) {
    try {
      return this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        select: {
          id: true,
          firstname: true,
          lastname: true,
          phone: true,
          email: true,
          role: true, // include only what you want to expose
          isActive: true,
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
}
