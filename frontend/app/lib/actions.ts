// frontend/app/lib/actions.ts

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