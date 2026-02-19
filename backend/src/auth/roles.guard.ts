// backend/src/auth/roles.guard.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../common/roles.enum';
import { ROLES_KEY } from '../common/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from the route metadata (via @Roles() decorator)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // No role required, access granted
    }

    // 2. Get the authenticated user object (from JwtStrategy.validate)
    const { user } = context.switchToHttp().getRequest();

    // 3. Check if the user's role is included in the required roles list
    return requiredRoles.some((role) => user.role === role);
  }
}