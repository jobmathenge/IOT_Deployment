// src/data/data.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataService } from './data.service';
import { DataController } from './data.controller'; 
import { SensorReadingEntity } from './entities/sensor-reading.entity'; // The PostgreSQL entity
import { DataGateway } from './data.gateway'; // The WebSocket gateway
import { AlertsModule } from 'src/alerts/alerts.module';


@Module({
  imports: [
    // Registers the Entity for use by the DataService
    TypeOrmModule.forFeature([SensorReadingEntity]), 
    AlertsModule,
  ],
  controllers: [DataController],
  providers: [
    DataService, 
    DataGateway, 
  ],
  exports: [DataService, DataGateway], 
})
export class DataModule {}