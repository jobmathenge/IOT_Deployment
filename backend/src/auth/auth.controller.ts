// src/auth/auth.controller.ts

import { Controller, Post, Body, UnauthorizedException, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

// DTO for login request body validation
class LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200) // Ensure 200 OK is returned on success
  async login(@Body() loginDto: LoginDto) {
    // Validate credentials using the service
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }
    
    // Generate and return the JWT token
    return this.authService.login(user); 
  }
}