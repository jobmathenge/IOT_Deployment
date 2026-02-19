
/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export interface Alert {
  id: string;
  topic: string;
  condition: string;
  value: number;
  timestamp: string;
  status: 'Active' | 'Acknowledged' | 'Cleared';
}