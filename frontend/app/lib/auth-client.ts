// frontend/app/lib/auth-client.ts

import { redirect } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL; 

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined in the environment.');
}

export async function signInClient(email: string, password: string) {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data: { access_token: string } = await response.json();
      
    
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', data.access_token); 
      }
      
    
      redirect('/dashboard'); 
      
    } else if (response.status === 401) {
      return 'Invalid credentials.';
    } else {
      return 'An unexpected error occurred during authentication.';
    }
  } catch (error) {
    
  

    
    if (error && typeof error === 'object' && 'digest' in error) {
     
        const errorDigest = (error as { digest?: unknown }).digest;

        if (typeof errorDigest === 'string' && errorDigest.startsWith('NEXT_REDIRECT')) {
            throw error; 
        }
    }
    

    console.error('Login network error:', error);
    return 'Failed to connect to authentication server. Check server status.';
  }
}


export function signOutClient() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
  redirect('/');
}