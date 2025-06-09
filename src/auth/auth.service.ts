import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { UserDocument } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(usernameOrEmail: string, password: string): Promise<any> {
    let user: UserDocument | null;
    
    // Try finding by username first
    user = await this.usersService.findOne(usernameOrEmail) as UserDocument;
    
    // If not found, try by email
    if (!user) {
      user = await this.usersService.findByEmail(usernameOrEmail) as UserDocument;
    }

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        username: user.username,
        email: user.email,
      }
    };
  }

  async register(username: string, email: string, password: string) {
    // Check if username or email already exists
    const existingUsername = await this.usersService.findOne(username);
    const existingEmail = await this.usersService.findByEmail(email);

    if (existingUsername) {
      throw new UnauthorizedException('Username already exists');
    }
    if (existingEmail) {
      throw new UnauthorizedException('Email already exists');
    }

    const user = await this.usersService.create(username, email, password);
    return {
      message: 'Registration successful! Please login to continue.',
      username: user.username,
      email: user.email
    };
  }
} 