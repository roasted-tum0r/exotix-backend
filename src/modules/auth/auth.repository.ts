import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAuthUserDto } from './dto/create-auth.dto';
@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}
  async findByUserId(userId: number) {
    try {
      return await this.prisma.user.findUnique({
        where: { id: userId, isActive:true },
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
      return this.prisma.user.findUnique({ where: { email , isActive:true } });
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
      return this.prisma.user.findUnique({ where: { phone, isActive:true } });
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
    return this.prisma.user.create({
      data,
    });
  }
  async createNewEmployee(
    userId: number,
    branchId: number,
    employeeData: Omit<Prisma.EmployeeCreateInput, 'user' | 'branch'>,
  ) {
    return this.prisma.employee.create({
      data: {
        ...employeeData,
        user: { connect: { id: userId } },
        branch: { connect: { id: branchId ?? 1 } },
      },
    });
  }
  async updateUserVerified(userId: number) {
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
    id: number,
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
  async deactivateUser(
    id: number,
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
          isActive:true,
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
