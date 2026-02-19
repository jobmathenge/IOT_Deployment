// src/app.module.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config'; 
import { DataModule } from './data/data.module';
import { MqttModule } from './mqtt/mqtt.module';
import { SensorReadingEntity } from './data/entities/sensor-reading.entity';
import { ReportModule } from './report/report.module';
import { AlertsModule } from './alerts/alerts.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module'
import { AlertEntity } from './alerts/entities/alert.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'postgres',
      port: 5432,
      username: 'user', 
      password: 'L', 
      database: 'nextjs-v1-db',
      entities: [SensorReadingEntity, AlertEntity], 
      synchronize: true, 
      logging: ['error'], 
      
    }),
    
   
    AlertsModule,
    DataModule,
    MqttModule, 
    ReportModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [], 
  providers: [],
})
export class AppModule {}