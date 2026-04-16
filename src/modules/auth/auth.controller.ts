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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateAuthUserDto,
  LoginOtpVerifyDto,
  LoginWithOtpDto,
  LoginWithPasswordDto,
} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { AppLogger } from 'src/common/utils/app.logger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { DecryptIdPipe } from 'src/common/pipes/decrypt-id.pipe';
import { EncryptIdInterceptor } from 'src/common/intercptors/encrypt-id.interceptor';
import { Roles } from 'src/common/decorators/user-role.decorator';

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
  async verifyLoginOtp(@Body() body: LoginOtpVerifyDto) {
    try {
      return await this.authUserService.verifyLoginOtp(body);
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
  // @Get()
  // findAll() {
  //   return this.authUserService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.authUserService.findOne(+id);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.authUserService.remove(+id);
  // }
}
