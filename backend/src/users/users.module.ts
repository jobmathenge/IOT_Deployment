// backend/src/users/users.module.ts
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