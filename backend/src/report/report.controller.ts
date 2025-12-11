// src/report/report.controller.ts

import { Controller, Get, Res, Query, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { ReportService, AlertSummaryReport } from './report.service'; 

@Controller('report')
export class ReportController {
  private readonly logger = new Logger(ReportController.name);

  constructor(private readonly reportService: ReportService) {}

  @Get('data') 
  async getReportData(): Promise<any> {
    this.logger.log('Fetching sensor data for report viewer.');
    // Fetches all sensor data ONCE
    const allData = await this.reportService.getFullReportData();
    
    // Returns the sensor data map directly, maintaining the old contract
    return allData;
  }


  @Get('alert-data')
  async getAlertData(
    @Query('alertDays') alertDays: string = '7'
  ): Promise<AlertSummaryReport> {
    const days = parseInt(alertDays, 10);
    this.logger.log(`Fetching alert summary data for the last ${days} days.`);
    return this.reportService.getAlertSummaryReport(days);
  }
  
  
  @Get('pdf')
  async getPdfReport(
    @Res() res: Response,
    @Query('alertDays') alertDays: string = '7'
  ): Promise<void> {
    const days = parseInt(alertDays, 10);
    this.logger.log(`Generating PDF report (Sensor + Alerts for ${days} days).`);

    // 1. Fetch sensor data
    const allSensorData = await this.reportService.getFullReportData();
    
    // 2. Fetch alert data
    const alertReport = await this.reportService.getAlertSummaryReport(days);

    // 3. Generates the PDF buffer using BOTH data sets
    const pdfBuffer = await this.reportService.generatePdfBuffer(allSensorData, alertReport); 

    // Set HTTP headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Sensor_Alert_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    res.end(pdfBuffer);
  }
}