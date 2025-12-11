// src/report/report.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; 
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { DataModule } from '../data/data.module';
import { AlertEntity } from '../alerts/entities/alert.entity'; 

@Module({
  imports: [
    DataModule, 
    TypeOrmModule.forFeature([AlertEntity]), 
  ], 
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}