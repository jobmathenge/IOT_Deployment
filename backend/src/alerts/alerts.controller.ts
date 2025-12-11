// backend/src/alerts/alerts.controller.ts

import * as common from '@nestjs/common'; 
import { AlertsService, Alert } from './alerts.service'; 
@common.Controller('alerts')
export class AlertsController {
  
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * GET /alerts/count - Returns the total count of 'Active' alerts.
   */
  @common.Get('count')
  async getActiveAlertCount(): Promise<{ count: number }> {
    const count = await this.alertsService.getActiveAlertCount();
    return { count };
  }

 
  @common.Get('all')
  
  async getLatestAlerts(): Promise<Alert[]> {
    return this.alertsService.getLatestAlerts(10);
  }

  
  @common.Patch('acknowledge/:id')
  
  async acknowledgeAlert(
      @common.Param('id') id: string,
  ): Promise<Alert> {
    
    const acknowledgedAlert = await this.alertsService.acknowledgeAlert(id); 

    if (!acknowledgedAlert) {
      throw new common.NotFoundException(`Alert with ID "${id}" does not exist.`);
    }

    return acknowledgedAlert;
  }
}