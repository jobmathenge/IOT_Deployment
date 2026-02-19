// backend/src/users/users.service.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { Injectable } from '@nestjs/common';
import { Role } from '../common/roles.enum'; 


// Password: 'testpass' (hashed)
const CORRECT_HASH = 'testpass'; 

const DUMMY_USERS = [
  {
    id: 1,
    email: 'admin@user.com', 
    password: CORRECT_HASH,  
    name: 'Admin User',
    role: Role.Admin, 
  },
  {
    id: 2,
    email: 'nonadmin@user.com', 
    password: CORRECT_HASH,      
    name: 'Non-Admin User',
    role: Role.User, 
  },
];

@Injectable()
export class UsersService {
  async findOneByEmail(email: string): Promise<any | undefined> {
    return DUMMY_USERS.find(user => user.email === email);
  }
}