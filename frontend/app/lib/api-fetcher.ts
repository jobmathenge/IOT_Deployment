// frontend/app/lib/api-fetcher.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'AuthError';
  }
}

export async function fetchProtectedData(endpoint: string, method: string = 'GET', body?: any) {

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  const response = await fetch(`${API_URL}/${endpoint}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store', 
  });

  if (response.status === 401) {
    localStorage.removeItem('accessToken');
    window.location.href = '/login';
    throw new AuthError('Session expired, please log in again.', 401);
  }
  
  if (response.status === 403) {
    throw new AuthError('Permission denied', 403);
  }

  if (!response.ok) {
     throw new Error(`API call failed with status: ${response.status}`);
  }

  return response.json();
}