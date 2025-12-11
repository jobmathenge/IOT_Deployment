// src/data/data.controller.ts

import { Controller, Get, Query } from '@nestjs/common'; 
import { DataService, FlatLatestResponse, HistoryResponse } from './data.service';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Get('latest')
  async getLatestReadings(): Promise<FlatLatestResponse> {
    return this.dataService.getLatestReadings();
  }

  @Get('history')
  // CRITICAL CHANGE: Accept an optional 'topic' query parameter
  async getHistory(@Query('topic') topic?: string): Promise<HistoryResponse> {
    // Pass the optional topic filter to the service
    return this.dataService.getHistory(topic);
  }
}