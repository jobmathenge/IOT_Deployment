// backend/src/common/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

// The key used by the RolesGuard to retrieve required roles
export const ROLES_KEY = 'roles'; 

// Custom decorator: usage is @Roles(Role.Admin, Role.User)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);