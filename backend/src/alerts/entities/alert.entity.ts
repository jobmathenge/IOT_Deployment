// backend/src/alerts/entities/alert.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('alert')
export class AlertEntity {
  // Primary key, automatically generated as UUID
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column()
  topic: string;

  @Column()
  condition: string;

  @Column('float')
  value: number;

  // Timestamp of when the alert was created
  @CreateDateColumn({ type: 'timestamp with time zone' })
  timestamp: Date;

  // Status can be 'Active', 'Acknowledged', or 'Cleared'
  @Column({ default: 'Active' })
  status: 'Active' | 'Acknowledged' | 'Cleared';
}