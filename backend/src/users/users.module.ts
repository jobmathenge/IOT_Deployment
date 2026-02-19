// backend/src/users/users.module.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UserEntity } from './user.entity'; 

@Module({
  // Register the User entity for use in this module
  imports: [TypeOrmModule.forFeature([UserEntity])], 
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}