import {
  ConflictException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAuthUserDto, LoginWithPasswordDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UserRepository } from './auth.repository';
import { User } from '@prisma/client';
import { RegistrationAs, LoginType } from 'src/config/enums/authuser-enums';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    // private readonly redisService: RedisService,
    // private readonly mailService: MailService,
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
      if (registrationPurpose === RegistrationAs.EMPLOYEE) {
        await this.userRepository.createNewEmployee(user.id, 0, {
          companyEmail: ``,
          isActive: true,
          position: 'Employee',
        });
      }
      const payload = { sub: user.id, role: user.role, email: user.email };
      const accessToken = this.jwtService.sign(payload);
      // await this.mailService.sendMail(
      //   'Plateful <onboarding@resend.dev>',
      //   user.email,
      //   '🎉 Welcome to Plateful!',
      //   Templates.welcomeEmail(user.first_name),
      // );
      // await this.requestLoginOtp({
      //   loginType: LoginType.EMAIL,
      //   identifier: user.email,
      // });
      return {
        statusCode: HttpStatus.CREATED,
        error: false,
        message: `User ${body.firstname} ${body.lastname} has been created successfully!`,
        data: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdat: user.createdAt,
          accesstoken: accessToken,
        },
      };
    } catch (error) {
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
      const jwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const jwtToken = await this.jwtService.signAsync(jwtPayload);
      return {
        statusCode: HttpStatus.OK,
        error: false,
        message: `Welcome back ${user.firstname} ${user.lastname}!`,
        data: {
          id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
          phone: user.phone,
          role: user.role,
          createdat: user.createdAt,
          accessToken: jwtToken,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: true,
        message: error.message || 'Failed to log in. Something went wrong.',
      });
    }
  }
  create(createAuthUserDto: CreateAuthUserDto) {
    return 'This action adds a new auth';
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
