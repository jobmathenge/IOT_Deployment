// backend/src/auth/auth.service.ts

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Still imported, but its compare function is bypassed
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    
    if (user) {
        // DEBUG BYPASS: Replaced bcrypt.compare with simple plaintext comparison
 
        const isMatch = (pass === user.password); 
        // Original secure line: const isMatch = await bcrypt.compare(pass, user.password); 

        if (isMatch) {
            console.log(`[AUTH SUCCESS] User ${email} authenticated using PLAINTEXT BYPASS.`); 
            const { password, ...result } = user as any; 
            return result; 
        } else {
            console.log(`[AUTH FAIL] Plaintext password mismatch for ${email}.`); 
        }
    } else {
        console.log(`[AUTH FAIL] User ${email} not found.`); 
    }
    return null;
  }

  // MODIFIED: Include the role in the JWT payload
  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role }; 
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}