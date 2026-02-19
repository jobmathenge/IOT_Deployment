// backend/src/common/roles.decorator.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { SetMetadata } from '@nestjs/common';
import { Role } from './roles.enum';

// The key used by the RolesGuard to retrieve required roles
export const ROLES_KEY = 'roles'; 

// Custom decorator: usage is @Roles(Role.Admin, Role.User)
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);