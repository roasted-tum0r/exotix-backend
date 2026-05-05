import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpException,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  CreateAuthUserDto,
  LoginOtpVerifyDto,
  LoginWithOtpDto,
  LoginWithPasswordDto,
  UpdatePasswordDto,
} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AppLogger } from 'src/common/utils/app.logger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { Roles } from 'src/common/decorators/user-role.decorator';
import { RolesGuard } from 'src/auth/guards/role-auth.guard';

// @UseInterceptors(EncryptIdInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private readonly authUserService: AuthService) { }

  @Public('registerNewUser')
  @Post('/register-new-user')
  async registerNewUser(@Body() body: CreateAuthUserDto) {
    try {
      return await this.authUserService.postNewUser(body);
    } catch (error) {
      AppLogger.error('Error in registerNewUser:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message:
          error?.message || 'Something went wrong while registering user.',
        data: null,
      };
    }
  }
  @Public('loginWithPassword')
  @Post('/login-with-password')
  async loginWithPassword(@Body() body: LoginWithPasswordDto) {
    try {
      return {
        ...(await this.authUserService.loginWithPassword(body)),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      AppLogger.error('Error in loginWithPassword:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }
  @Public('requestLoginOtp')
  @Post('/request-otp')
  async requestLoginOtp(@Body() body: LoginWithOtpDto) {
    try {
      return await this.authUserService.requestLoginOtp(body);
    } catch (error) {
      AppLogger.error('Error in requestLoginOtp:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }
  @Public('verifyLoginOtp')
  @Post('/verify-otp')
  async verifyLoginOtp(@Body() body: LoginOtpVerifyDto, @Res() res: Response) {
    try {
      return await this.authUserService.verifyLoginOtp(body, res);
    } catch (error) {
      AppLogger.error('Error in verifyLoginOtp:', error);
      if (error instanceof HttpException) throw error;
      return res.status(error?.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      });
    }
  }

  /**
   * Silent token refresh.
   * The browser sends the HttpOnly `refresh_token` cookie automatically.
   * No body is required from the client.
   * POST /auth/refresh-token
   */
  @Public('refreshToken')
  @Post('/refresh-token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const refreshToken: string | undefined = req.cookies?.['refresh_token'];
      if (!refreshToken) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'No refresh token found. Please log in again.',
          data: null,
        });
      }
      return await this.authUserService.refreshAccessToken(refreshToken, res);
    } catch (error) {
      AppLogger.error('Error in refreshToken:', error);
      if (error instanceof HttpException) throw error;
      return res.status(error?.status || HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to refresh token. Something went wrong.',
        data: null,
      });
    }
  }
  @Patch('/update-user/:id')
  async updateUserInfo(
    @Param('id') id: string,
    @Body() updateAuthDto: UpdateAuthDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.authUserService.updateUserInfo(id, updateAuthDto, user);
    } catch (error) {
      AppLogger.error('Error in verifyLoginOtp:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }
  @Delete('/deactivate-user/:id')
  async deactivateUser(
    @Param('id') id: string,
    // @Body() updateAuthDto: UpdateAuthDto,
    @CurrentUser() user: User,
  ) {
    try {
      return await this.authUserService.deactivateUser(id, user);
    } catch (error) {
      AppLogger.error('Error in deactivateUser:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }
  @Get('/user-details')
  async findSelf(
    @CurrentUser() user: User,
  ) {
    try {
      return await this.authUserService.findOne(user.id);
    } catch (error) {
      AppLogger.error('Error in findUser:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }
  @Roles('ADMIN', 'SUPER_ADMIN')
  @UseGuards(RolesGuard)
  @Get('/user-details/:id')
  async findUser(
    @Param('id') id: string,
  ) {
    try {
      return await this.authUserService.findOne(id);
    } catch (error) {
      AppLogger.error('Error in findUser:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }

  /**
   * Step 1 – Authenticated user requests an OTP to authorise a password change.
   * POST /auth/request-password-otp
   */
  @Post('/request-password-otp')
  async requestPasswordChangeOtp(@CurrentUser() user: User) {
    try {
      return await this.authUserService.requestPasswordChangeOtp(user);
    } catch (error) {
      AppLogger.error('Error in requestPasswordChangeOtp:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to send OTP. Something went wrong.',
        data: null,
      };
    }
  }

  /**
   * Step 2 – Submit OTP + hash_key + newPassword to finalise the change.
   * PATCH /auth/update-password
   * Body: { OTP, hash_key, newPassword }
   */
  @Patch('/update-password')
  async updatePassword(
    @CurrentUser() user: User,
    @Body() body: UpdatePasswordDto,
  ) {
    try {
      return await this.authUserService.updatePassword(user, body);
    } catch (error) {
      AppLogger.error('Error in updatePassword:', error);
      if (error instanceof HttpException) throw error;
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to update password. Something went wrong.',
        data: null,
      };
    }
  }
}
