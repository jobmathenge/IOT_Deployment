// frontend/app/lib/actions.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


'use server';
 
import { signInClient } from './auth-client';

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = formData.get('email')?.toString() || '';
  const password = formData.get('password')?.toString() || '';
  
  if (!email || !password) {
    return 'Please enter both email and password.';
  }


  const result = await signInClient(email, password);


  if (result) {
    return result; 
  }

 
 
  return undefined; 
}