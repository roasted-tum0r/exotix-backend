import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  CreateAuthUserDto,
  LoginOtpVerifyDto,
  LoginWithOtpDto,
  LoginWithPasswordDto,
  UpdatePasswordDto,
} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserRepository } from './auth.repository';
import { User } from '@prisma/client';
import { RegistrationAs, LoginType } from 'src/config/enums/authuser-enums';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MailService } from 'src/services/mail/mailservice.service';
import { RedisService } from 'src/services/redis/redis.service';
import { Templates } from 'src/config/templates/template';
import { AppLogger } from 'src/common/utils/app.logger';
import { UploadRepo } from '../image-upload/upload.repo';
import { CloudinaryService } from 'src/config/cloudinary/cloudinary.service';
import { ImageOwnerType } from '@prisma/client';

@Injectable()
export class AuthService {
  private static retryOtpCount: number = 0;
  private static MAX_RETRY_COUNT: number = 5;
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly uploadRepo: UploadRepo,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  async postNewUser(body: CreateAuthUserDto) {
    try {
      const [emailExists, phoneExists] = await Promise.all([
        this.userRepository.findByEmail(body.email),
        this.userRepository.findByPhone(body.phone),
      ]);
      if (emailExists && phoneExists) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: `User already exists with both email: ${body.email} and phone: ${body.phone}. Try logging in with existing email or phone number`,
        });
      }
      if (emailExists) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: `User already exists with this email: ${body.email}`,
        });
      }

      if (phoneExists) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: `User already exists with this phone number: ${body.phone}`,
        });
      }
      const passHash = await bcrypt.hash(body.password, 10);
      const { registrationPurpose, ...userData } = body;
      const user: User = await this.userRepository.createNewUser({
        ...userData,
        password: passHash,
      });
      if (registrationPurpose != RegistrationAs.CUSTOMER) {
        await this.userRepository.createNewEmployee(user.id, '40e926c6-81df-11f0-8d8c-06dbf3b5cc53', {
          companyEmail: ``,
          isActive: true,
          position: `${registrationPurpose}`,
        });
      }
      // Persist avatar if provided
      if (body.image) {
        await this.uploadRepo.addImages(user.id, [body.image], ImageOwnerType.USER);
      }

      const payload = { sub: user.id, role: user.role, email: user.email };
      const accessToken = this.jwtService.sign(payload);
      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        body.email,
        `🎉 Welcome to Anandini's!`,
        Templates.welcomeEmail(user.firstname),
      );
      const requestLoginOtp = await this.requestLoginOtp({
        loginType: LoginType.EMAIL,
        identifier: body.email,
      });
      return requestLoginOtp;
    } catch (error) {
      AppLogger.error(`Failed create user`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Something went wrong while creating user',
      });
    }
  }
  async loginWithPassword(body: LoginWithPasswordDto) {
    try {
      const { identifier, loginType, password } = body;
      const user =
        loginType == LoginType.EMAIL
          ? await this.userRepository.findByEmail(identifier)
          : await this.userRepository.findByPhone(identifier);
      if (!user) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid credentials: Account with this email or phonenumber doesn't exist.`,
        });
      }
      const isPassMatch = await bcrypt.compare(password, user?.password!);
      if (!isPassMatch) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.CONFLICT,
          error: true,
          message: `Invalid credentials: Incorrect password. Please enter the correct password.`,
        });
      }
      // const jwtPayload = {
      //   sub: user.id,
      //   email: user.email,
      //   role: user.role,
      // };
      // const jwtToken = await this.jwtService.signAsync(jwtPayload);
      const requestLoginOtp = await this.requestLoginOtp({
        loginType,
        identifier,
      });
      return requestLoginOtp;
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to log in. Something went wrong.',
      });
    }
  }
  async requestLoginOtp(body: LoginWithOtpDto) {
    try {
      const { identifier, loginType } = body;
      const user =
        loginType == LoginType.EMAIL
          ? await this.userRepository.findByEmail(identifier)
          : await this.userRepository.findByPhone(identifier);
      if (!user) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid credentials: Account with this email or phonenumber doesn't exist.`,
        });
      }
      const otp = AuthService.generateOtp(6);
      const hash = AuthService.generateHash(4);
      const OTP_EXPIRY_TIME: number = process.env.OTP_EXPIRY_TIME
        ? +process.env.OTP_EXPIRY_TIME
        : 420;
      await this.redisService.setValue(
        `otp:user:${user.id}`,
        otp,
        hash,
        OTP_EXPIRY_TIME ?? 420,
      );
      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        user?.email!,
        'Your One-Time Password (OTP)',
        Templates.loginOtpEmail({
          firstName: user?.firstname!,
          otp,
          hash,
          expirySeconds: OTP_EXPIRY_TIME,
        }),
      );
      // AppLogger.log(otp, hash);
      // await this.checkRedisConnection();
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Your OTP has been sent to your email : ${user.email}`,
        data: {
          hash_key: hash,
        },
      };
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to log in. Something went wrong.',
      });
    }
  }
  async verifyLoginOtp(body: LoginOtpVerifyDto) {
    try {
      const { identifier, loginType, OTP, hash_key } = body;
      const user =
        loginType == LoginType.EMAIL
          ? await this.userRepository.findByEmail(identifier)
          : await this.userRepository.findByPhone(identifier);
      if (!user) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid credentials: Account with this email or phonenumber doesn't exist.`,
        });
      }
      const sessionKey = `otp:user:${user.id}`;
      const session = await this.redisService.getSession<{
        value: string;
        hash: string;
      }>(sessionKey, hash_key);
      if (!session || session.value !== OTP) {
        const retryLimitReached = await this.retryCount();
        if (retryLimitReached) {
          await this.redisService.invalidateSession(`${user.id}`, hash_key);
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            error: true,
            message: `Too many failed attempts. Your OTP session has expired.`,
          });
        }
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid or expired OTP.`,
        });
      } else if (session.value === OTP && session.hash === hash_key) {
        await this.redisService.deleteSession(sessionKey, hash_key);
        const jwtPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          session_id: hash_key,
        };
        if (!user.isVerified) {
          await this.userRepository.updateUserVerified(user.id);
        }
        const jwtToken = await this.jwtService.signAsync(jwtPayload);
        // Fetch user images to include in login response
        const userImages = await this.uploadRepo.getImagesById(user.id, ImageOwnerType.USER);
        return {
          statusCode: HttpStatus.OK,
          error: false,
          message: `Your OTP has been verified! Welcome back ${user.firstname} ${user.lastname}!`,
          data: {
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone: user.phone,
            role: user.role,
            createdat: user.createdAt,
            accesstoken: jwtToken,
            images: userImages,
          },
        };
      }
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to log in. Something went wrong.',
      });
    }
  }
  async updateUserInfo(
    id: string,
    createAuthUserDto: UpdateAuthDto,
    user: User,
  ) {
    try {
      if (id != user.id) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Access denied: A person cannot update info of another.`,
        });
      }
      // ── Image handling (mirrors review update pattern) ──────────────────
      // 1. Delete old avatar first if client requests it
      if (createAuthUserDto.deletedImagePublicId) {
        await this.cloudinaryService.deleteImage(createAuthUserDto.deletedImagePublicId);
        await this.uploadRepo.deleteImages([createAuthUserDto.deletedImagePublicId]);
      }
      // 2. Persist new avatar if supplied
      if (createAuthUserDto.image) {
        await this.uploadRepo.addImages(id, [createAuthUserDto.image], ImageOwnerType.USER);
      }
      // ────────────────────────────────────────────────────────────────────

      // Strip image fields before passing to Prisma (they're not User columns)
      const { image, deletedImagePublicId, ...userFields } = createAuthUserDto;
      const updatedUser = await this.userRepository.updateUserById(id, userFields);

      // Return updated images array alongside the user
      const updatedImages = await this.uploadRepo.getImagesById(id, ImageOwnerType.USER);
      return {
        statusCode: HttpStatus.OK,
        message: 'User info updated successfully',
        data: { ...updatedUser, images: updatedImages },
      };
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Something went wrong while updating user info',
      });
    }
  }
  async deactivateUser(
    id: string,
    // createAuthUserDto: UpdateAuthDto,
    user: User,
  ) {
    try {
      if (id != user.id) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Access denied: A person cannot delete another user.`,
        });
      }
      const deactivateUser = await this.userRepository.deactivateUser(
        id,
        // createAuthUserDto,
      );
      return {
        statusCode: HttpStatus.OK,
        message: 'User deactivated successfully!',
        data: deactivateUser,
      };
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Something went wrong while updating user info',
      });
    }
  }
  /**
   * Step 1 – Request a password-change OTP.
   * Requires a valid JWT (user must be already logged in).
   * Generates an OTP + hash and emails it to the authenticated user.
   */
  async requestPasswordChangeOtp(user: User) {
    try {
      const otp = AuthService.generateOtp(6);
      const hash = AuthService.generateHash(4);
      const OTP_EXPIRY_TIME: number = process.env.OTP_EXPIRY_TIME
        ? +process.env.OTP_EXPIRY_TIME
        : 420;

      // Namespace separately from login OTPs so they can't be cross-used
      await this.redisService.setValue(
        `pwd_otp:user:${user.id}`,
        otp,
        hash,
        OTP_EXPIRY_TIME,
      );

      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        user.email!,
        'Password Change Verification OTP',
        Templates.loginOtpEmail({
          firstName: user.firstname!,
          otp,
          hash,
          expirySeconds: OTP_EXPIRY_TIME,
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `A verification OTP has been sent to ${user.email}`,
        data: { hash_key: hash },
      };
    } catch (error) {
      AppLogger.error(`requestPasswordChangeOtp failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to send OTP. Something went wrong.',
      });
    }
  }

  /**
   * Step 2 – Verify OTP and update the password.
   * Requires a valid JWT AND a matching OTP + hash_key from Step 1.
   */
  async updatePassword(user: User, body: UpdatePasswordDto) {
    try {
      const { OTP, hash_key, newPassword } = body;
      const sessionKey = `pwd_otp:user:${user.id}`;

      const session = await this.redisService.getSession<{
        value: string;
        hash: string;
      }>(sessionKey, hash_key);

      if (!session || session.value !== OTP || session.hash !== hash_key) {
        const retryLimitReached = await this.retryCount();
        if (retryLimitReached) {
          await this.redisService.deleteSession(sessionKey, hash_key);
          throw new UnauthorizedException({
            statusCode: HttpStatus.UNAUTHORIZED,
            error: true,
            message: `Too many failed attempts. Your OTP session has expired.`,
          });
        }
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid or expired OTP.`,
        });
      }

      // Consume the session so it cannot be replayed
      await this.redisService.deleteSession(sessionKey, hash_key);

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updatePassword(user.id, hashedPassword);

      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Password updated successfully.`,
        data: null,
      };
    } catch (error) {
      AppLogger.error(`updatePassword failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to update password. Something went wrong.',
      });
    }
  }

  private async retryCount() {
    if (AuthService.retryOtpCount <= AuthService.MAX_RETRY_COUNT) {
      AuthService.retryOtpCount++;
      return false;
    } else return true;
  }
  async checkRedisConnection() {
    try {
      console.log('Redis Connected:', await this.redisService.ping()); // Should print "PONG"
    } catch (err) {
      console.error('Redis connection failed:', err);
    }
  }
  /**
   * Generate a 6-digit numeric OTP
   */
  static generateOtp(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  /**
   * Generate a 5-character alphanumeric hash
   */
  static generateHash(length = 5): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let hash = '';
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * chars.length);
      hash += chars[index];
    }
    return hash;
  }

  findAll() {
    return `This action returns all auth`;
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findByUserId(id);
      return {
        statusCode: HttpStatus.OK,
        message: 'User found successfully!',
        data: user,
      };
    } catch (error) {
      AppLogger.error(`Failed search items`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Something went wrong while finding user',
      });
    }
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
