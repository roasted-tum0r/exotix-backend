import { Controller, Get, Post, Body, Patch, Param, Delete, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {  CreateAuthUserDto, LoginWithPasswordDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authUserService: AuthService) {}

  @Post('/register-new-user')
  async registerNewUser(@Body() body: CreateAuthUserDto) {
    try {
      return await this.authUserService.postNewUser(body);
    } catch (error) {
      console.error('Error in registerNewUser:', error);
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message:
          error?.message || 'Something went wrong while registering user.',
        data: null,
      };
    }
  }
  @Post('/login-with-password')
  async loginWithPassword(@Body() body: LoginWithPasswordDto) {
    try {
      return {
        ...(await this.authUserService.loginWithPassword(body)),
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error('Error in loginWithPassword:', error);
      return {
        statusCode: error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error?.message || 'Failed to log in. Something went wrong.',
        data: null,
      };
    }
  }

  @Get()
  findAll() {
    return this.authUserService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.authUserService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAuthDto: UpdateAuthDto) {
    return this.authUserService.update(+id, updateAuthDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.authUserService.remove(+id);
  }
}
