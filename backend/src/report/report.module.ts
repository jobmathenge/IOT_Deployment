// src/report/report.module.ts


/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

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