// backend/src/alerts/alerts.service.ts

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from '../data/interfaces/sensor-reading.interface'; 
import { AlertEntity } from './entities/alert.entity'; // The DB entity

// --- INTERFACES --- 
export interface Alert {
  id: string;
  topic: string;
  condition: string;
  value: number;
  timestamp: Date;
  status: 'Active' | 'Acknowledged' | 'Cleared';
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  // Inject the repository (Removed DataService to match requested format)
  constructor(
    @InjectRepository(AlertEntity)
    private alertRepository: Repository<AlertEntity>,
  ) {}

 
  private checkTriggeringCondition(reading: SensorReading): [boolean, string | null] {
    const value = reading.value as number;
    let condition: string | null = null;
    let isAlerting = false;

    // --- RULE SET DEFINITION (Triggering) ---
    
    // 1. Temperature Alert: Trigger when temp > 40 deg
    if (reading.topic === 'temperature' && value > 40.0) {
      condition = `Temperature CRITICAL HIGH: ${value.toFixed(1)}°C (Threshold: 40.0°C)`;
      isAlerting = true;
    }
    // 2. Flowrate Alert: Trigger when flow rate is more than 12
    else if (reading.topic === 'flowrate' && value > 12.0) {
      condition = `Flowrate CRITICAL HIGH: ${value.toFixed(2)}L/s (Threshold: 12.0L/s)`;
      isAlerting = true;
    }
    // 3. Power Alert: Trigger when power is 0 (NO POWER AT SITE)
    else if (reading.topic === 'power' && value === 0.0) {
      condition = `Power CRITICAL OUTAGE: ${value.toFixed(2)}kW (NO POWER AT SITE)`;
      isAlerting = true;
    }

    return [isAlerting, condition];
  }

  
  private checkClearingCondition(topic: string, value: number): boolean {
    let isCleared = false;

    // 1. Temperature Alert Cleared (Below 35C - using 5C hysteresis)
    if (topic === 'temperature' && value <= 35.0) { 
      isCleared = true;
    }
    // 2. Flowrate Alert Cleared (Below 10 L/s - using 2 L/s hysteresis)
    else if (topic === 'flowrate' && value <= 10.0) { 
      isCleared = true;
    }
    // 3. Power Alert Cleared (Any value above 0 kW)
    else if (topic === 'power' && value > 0.0) { 
      isCleared = true;
    }
    
    return isCleared;
  }

  // ----------------------------------------------------------------------
  // --- CORE LOGIC METHOD (DB Integrated) ---
  // ----------------------------------------------------------------------

  public async checkReadingForAlerts(reading: SensorReading): Promise<Alert | null> {
    // Ensure the value is numeric before checking alerts
    if (typeof reading.value !== 'number') return null;

    const [isAlerting, condition] = this.checkTriggeringCondition(reading);
    const value = reading.value as number;
    
    this.logger.debug(`Checking alert rules for ${reading.topic}. Value: ${value.toFixed(2)}. IsAlerting: ${isAlerting}`);

    // 💡 FIND ANY ACTIVE ALERT IN THE DB for this topic
    const existingActiveAlert = await this.alertRepository.findOne({
      where: { topic: reading.topic, status: 'Active' },
      order: { timestamp: 'DESC' }
    });
    
    // --- 1. Handle Existing Alert ---
    if (existingActiveAlert) {

      if (!isAlerting && this.checkClearingCondition(existingActiveAlert.topic, value)) {

        existingActiveAlert.status = 'Cleared';
        await this.alertRepository.save(existingActiveAlert);
        this.logger.log(`Alert CLEARED [ID: ${existingActiveAlert.id}] for ${reading.topic}. Value: ${value.toFixed(2)}`);
      }
      return null;
    }

    // --- 2. Handle New Alert ---
    if (isAlerting) {
      const newAlert: AlertEntity = this.alertRepository.create({
        topic: reading.topic,
        condition: condition!, 
        value,
        status: 'Active', 
      });

      // 💡 SAVE NEW ALERT TO DB
      const savedAlert = await this.alertRepository.save(newAlert);

      this.logger.error(`ALERT CREATED [ID: ${savedAlert.id}] - ${savedAlert.condition}`);
      return savedAlert;
    }

    return null;
  }

  // ----------------------------------------------------------------------
  // --- PUBLIC API METHODS (DB Integrated) ---
  // ----------------------------------------------------------------------

  public async getActiveAlertCount(): Promise<number> {
    return this.alertRepository.count({
      where: { status: 'Active' },
    });
  }

  public async getLatestAlerts(limit = 20): Promise<Alert[]> {
    const alerts = await this.alertRepository.find({
      order: { timestamp: 'DESC' },
      take: limit, 
    });
    
    // Perform final sorting to ensure Active alerts bubble to the top of the displayed list.
    return alerts.sort((a, b) => {
      // Primary sort: Active status first
      if (a.status === 'Active' && b.status !== 'Active') return -1;
      if (a.status !== 'Active' && b.status === 'Active') return 1;
      // Secondary sort: Newest first
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  public async acknowledgeAlert(id: string): Promise<Alert | null> {
    const alert = await this.alertRepository.findOne({ where: { id } });

    if (alert && alert.status === 'Active') {
      alert.status = 'Acknowledged';
      const acknowledgedAlert = await this.alertRepository.save(alert);
      this.logger.log(`Alert ACKNOWLEDGED [ID: ${id}]`);
      return acknowledgedAlert;
    }

    return alert; // Return the existing alert if status is not 'Active'
  }
}