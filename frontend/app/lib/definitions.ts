
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