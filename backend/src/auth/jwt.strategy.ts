// backend/src/auth/jwt.strategy.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'MY_SUPER_SECRET_KEY_123', 
    });
  }

  // The 'payload' is the decoded token, which now includes the 'role'
  async validate(payload: any) {
    // This object ({ userId, email, role }) is attached to req.user
    return { userId: payload.sub, email: payload.email, role: payload.role }; 
  }
}