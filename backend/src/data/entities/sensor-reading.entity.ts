// src/data/entities/sensor-reading.entity.ts

import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { SensorReading } from '../interfaces/sensor-reading.interface'; // Import interface

@Entity('sensor_readings')
@Index(['topic', 'timestamp']) // Indexing speeds up latest/history queries
export class SensorReadingEntity implements SensorReading {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp with time zone' }) // PostgreSQL type
  timestamp: Date;

  @Column('double precision')
  value: number;

  @Column()
  topic: string;
}