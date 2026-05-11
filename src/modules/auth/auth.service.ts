import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import {
  CreateAuthUserDto,
  LoginOtpVerifyDto,
  LoginWithOtpDto,
  LoginWithPasswordDto,
  UpdatePasswordDto,
} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserRepository } from './auth.repository';
import { User, UserRole } from '@prisma/client';
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
import { CartRepository } from '../cart/cart.repository';
import {
  ForgotPasswordRequestDto,
  ForgotPasswordSubmitResetDto,
} from './dto/forgot-password.dto';

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
    private readonly cartRepository: CartRepository,
    private readonly configService: ConfigService,
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

      // const payload = { sub: user.id, role: user.role, email: user.email };
      // const accessToken = this.jwtService.sign(payload);
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
  /**
   * Issues a short-lived access token (10 m) and stores a
   * long-lived refresh token (15 m) in an HttpOnly cookie.
   */
  async verifyLoginOtp(body: LoginOtpVerifyDto, res: Response) {
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

      if (!session) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: `Invalid or expired OTP session.`,
        });
      }

      let storedOtp: string;
      let pendingHashedPassword: string | null = null;

      // Handle both plain OTP string and JSON object with metadata
      try {
        const parsed = JSON.parse(session.value);
        storedOtp = parsed.otp;
        pendingHashedPassword = parsed.hashedPassword || null;
      } catch (e) {
        // Fallback for plain string OTPs (regular logins)
        storedOtp = session.value;
      }

      if (storedOtp !== OTP) {
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
          message: `Invalid OTP.`,
        });
      } else if (storedOtp === OTP && session.hash === hash_key) {
        await this.redisService.deleteSession(sessionKey, hash_key);

        if (!user.isVerified) {
          await this.userRepository.updateUserVerified(user.id);
        }

        // ── Issue access token (10 min) ─────────────────────────────────────
        const accessPayload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          session_id: hash_key,
        };
        const accessToken = await this.jwtService.signAsync(accessPayload);

        // ── Refresh token (7 days default, 30 days if rememberMe) ──────────
        const isRemembered = !!body.rememberMe;
        const REFRESH_TTL = isRemembered ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
        const refreshPayload = { sub: user.id, type: 'refresh', rememberMe: isRemembered };
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
          secret: process.env.JWT_REFRESH_SECRET ?? 'default_refresh_secret',
          expiresIn: isRemembered ? '30d' : '7d',
        });
        await this.redisService.setRefreshToken(user.id, refreshToken, REFRESH_TTL);
        res.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: REFRESH_TTL * 1000,
          path: '/exotix-api/auth/refresh-token',
        });

        // ── Auto-merge guest cart if guestUserId is provided ───────────────
        if (body.guestUserId) {
          try {
            await this.cartRepository.mergeCart(user.id, body.guestUserId, user.firstname);
            AppLogger.log(`Cart merged automatically for user: ${user.id}`);
          } catch (mergeError) {
            AppLogger.error(`Auto-merge failed during login for user ${user.id}`, mergeError.stack);
          }
        }

        // Fetch user images to include in login response
        const userImages = await this.uploadRepo.getImagesById(user.id, ImageOwnerType.USER);
        return res.status(HttpStatus.OK).json({
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
            branchId: user.branchId,
            createdat: user.createdAt,
            accessToken,
            refreshToken,
            images: userImages,
          },
        });
      }
    } catch (error) {
      AppLogger.error(`verifyLoginOtp failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to log in. Something went wrong.',
      });
    }
  }

  /**
   * Validates the HttpOnly refresh_token cookie and issues a new token pair.
   * Implements rotation: old refresh token is replaced in Redis immediately.
   *
   * NOTE: Refresh-token flow is currently disabled in favour of access-token-only.
   *       The endpoint is kept alive so existing routes don't break;
   *       re-enable by uncommenting the block below.
   */
  async refreshAccessToken(refreshToken: string, res: Response) {
    try {
      // ── Refresh-token rotation logic ────────────────────────────────────────
      // 1. Verify the JWT signature & expiry
      let payload: { sub: string; type: string; rememberMe?: boolean };
      try {
        payload = await this.jwtService.verifyAsync(refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET ?? 'default_refresh_secret',
        });
      } catch {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Refresh token is invalid or expired. Please log in again.',
        });
      }

      // 2. Ensure this is actually a refresh token, not an access token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Invalid token type.',
        });
      }

      // 3. Compare with the token stored in Redis (rotation replay guard)
      const storedToken = await this.redisService.getRefreshToken(payload.sub);
      if (!storedToken || storedToken !== refreshToken) {
        await this.redisService.deleteRefreshToken(payload.sub);
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Refresh token reuse detected. Please log in again.',
        });
      }

      // 4. Load user to ensure account is still active
      const user = await this.userRepository.findByUserId(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'User account not found or deactivated.',
        });
      }

      // 5. Rotate: delete old token from Redis before issuing new one
      await this.redisService.deleteRefreshToken(user.id);

      // 6. Issue new access token (1 min)
      const accessPayload = { sub: user.id, email: user.email, role: user.role };
      const newAccessToken = await this.jwtService.signAsync(accessPayload);

      // 7. Issue new refresh token & persist (carry over rememberMe)
      const isRemembered = !!payload.rememberMe;
      const REFRESH_TTL = isRemembered ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      const newRefreshToken = await this.jwtService.signAsync(
        { sub: user.id, type: 'refresh', rememberMe: isRemembered },
        {
          secret: process.env.JWT_REFRESH_SECRET ?? 'default_refresh_secret',
          expiresIn: isRemembered ? '30d' : '7d',
        },
      );
      await this.redisService.setRefreshToken(user.id, newRefreshToken, REFRESH_TTL);

      res.cookie('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: REFRESH_TTL * 1000,
        path: '/exotix-api/auth/refresh-token',
      });

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Token refreshed successfully.',
        data: { 
          accessToken: newAccessToken,
          refreshToken: newRefreshToken 
        },
      });
    } catch (error) {
      AppLogger.error(`refreshAccessToken failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to refresh token. Something went wrong.',
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
      const updatedUser = await this.userRepository.updateUserById(
        id,
        userFields,
        user.role,
        id === user.id,
      );

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
        user.role,
        id === user.id,
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

  async forgotPasswordRequest(body: ForgotPasswordRequestDto) {
    try {
      const user = await this.userRepository.findByEmail(body.email);
      if (!user) {
        // We don't want to reveal if a user exists or not for security
        return {
          statusCode: HttpStatus.OK,
          message: 'If an account with that email exists, we have sent a reset link.',
        };
      }

      const token = AuthService.generateHash(32); // Long token for URL
      const EXPIRY_TIME = 300; // 5 minutes

      await this.redisService.setValue(
        `forgot_password_token:${user.email}`,
        token,
        'LINK',
        EXPIRY_TIME,
      );

      const frontendUrl = this.configService.get<string>('PUBLIC_UI_FRONTEND') || '';
      const resetLink = `${frontendUrl}/forgotpassword=true&token=${token}&email=${encodeURIComponent(user.email)}`;

      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        user.email,
        'Password Reset Request',
        Templates.forgotPasswordEmail({
          firstName: user.firstname,
          resetLink,
          expiryMinutes: EXPIRY_TIME / 60,
        }),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'If an account with that email exists, we have sent a reset link.',
      };
    } catch (error) {
      AppLogger.error(`forgotPasswordRequest failed`, error.stack);
      throw new InternalServerErrorException('Failed to process password reset request');
    }
  }

  async forgotPasswordSubmitReset(body: ForgotPasswordSubmitResetDto) {
    try {
      const { email, token, newPassword } = body;
      const sessionKey = `forgot_password_token:${email}`;

      const session = await this.redisService.getSession<{
        value: string;
        hash: string;
      }>(sessionKey, 'LINK');

      if (!session || session.value !== token) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'Invalid or expired reset link.',
        });
      }

      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new UnauthorizedException({
          statusCode: HttpStatus.UNAUTHORIZED,
          error: true,
          message: 'User account not found.',
        });
      }

      // 1. Hash the new password and update in DB
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.userRepository.updatePassword(user.id, hashedPassword);

      // 2. Clear ALL redis keys for this user (tokens, OTPs, sessions)
      await this.redisService.clearAllSessions(user.id, email);

      // 3. Send confirmation email
      await this.mailService.sendMail(
        `Anandini <info@anandini.org.in>`,
        email,
        'Password Changed Successfully',
        Templates.passwordResetSuccessEmail({ firstName: user.firstname }),
      );

      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: 'Your password has been changed successfully. All other logins for this account have been cancelled. Please login again to access the app.',
        data: null,
      };
    } catch (error) {
      AppLogger.error(`forgotPasswordSubmitReset failed`, error.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: 'Failed to process password reset submission.',
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

  async findOne(id: string, requestingUserRole?: UserRole, isSelf: boolean = false) {
    try {
      const user = await this.userRepository.findByUserId(
        id,
        requestingUserRole,
        isSelf,
      );
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
