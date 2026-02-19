// backend/src/users/user.entity.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users') // Map to your actual table name
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({ select: false }) 
  password: string;

  @Column({ nullable: true })
  name: string;

}