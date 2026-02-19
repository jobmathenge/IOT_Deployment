// src/data/data.service.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

import { Injectable, Logger } from '@nestjs/common'; 
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from './interfaces/sensor-reading.interface'; 
import { SensorReadingEntity } from './entities/sensor-reading.entity';
import { DataGateway } from './data.gateway';
import { AlertsService } from '../alerts/alerts.service'; // AlertsService imported


// --- CONSTANTS & INTERFACES (Matching Next.js expectations) ---
const TARGET_TOPICS = [
  'client1/temperature', 
  'client1/humidity',      
  'client1/power',        
  'client1/cumulative',    
  'client1/current',]

export interface FlatLatestResponse {
  [topic: string]: SensorReading; 
}
export interface HistoryResponse {
  [topic: string]: SensorReading[];
}


@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name); 
  // Store the latest reading for each topic in memory (for quick lookup)
  private latestReadings: FlatLatestResponse = {}; 

  constructor(
    @InjectRepository(SensorReadingEntity) 
    private sensorRepository: Repository<SensorReadingEntity>, 
    private dataGateway: DataGateway, 
    private alertsService: AlertsService, 
  ) {}

  /**
   * Handles raw data received from the MqttService.

   * @param topic The MQTT topic the message was received on.
   * @param payload The raw string payload (e.g., JSON string).
   */
  async processMqttData(topic: string, payload: string) { 
    if (!TARGET_TOPICS.includes(topic)) {
        this.logger.warn(`Ignoring message from unsubscribed topic: ${topic}`);
        return;
    }
    
    try {
      // Data format is assumed to be JSON: {"value": 46, "timestamp": "..."}
      const data = JSON.parse(payload); 

      if (typeof data.value !== 'number') {
        throw new Error('Payload does not contain a valid numerical value.');
      }

      // strip the 'client1/' prefix to use the clean topic name in the DB/Alerts logic.
      //Alerts
      const cleanTopic = topic.split('/')[1]; 

      const reading_to_alerts: SensorReading = {
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(), 
        value: data.value,
        topic: cleanTopic, 
      };
        //Readings
           const reading: SensorReading = {
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(), 
        value: data.value,
        topic: topic,
      };
      this.latestReadings[topic] = reading;


      const newAlert = await this.alertsService.checkReadingForAlerts(reading_to_alerts); 

   
      if (newAlert) {
          this.logger.error(`ALERT TRIGGERED: ${newAlert.condition}`);
  
          this.dataGateway.broadcastNewAlert(newAlert);
      }

      // Check the active count and broadcast the update regardless of whether a *new* alert 
      // was created. This ensures the bell count updates immediately when an alert is 
      // CREATED, CLEARED (status changed from Active to Cleared), or ACKNOWLEDGED.
      const activeCount = await this.alertsService.getActiveAlertCount();
      this.dataGateway.broadcastAlertCount(activeCount);
      
     
      await this.saveReading(reading); 

    } catch (e) {
      this.logger.error(`Failed to process MQTT message from ${topic}. Payload: "${payload}"`, e.stack);
    }
  }



  async saveReading(reading: SensorReading): Promise<SensorReading> {
    const newReading = this.sensorRepository.create(reading); 
    const savedReading = await this.sensorRepository.save(newReading);
    
  
    this.dataGateway.broadcastNewReading(savedReading); 
    
    return savedReading;
  }


  async getLatestReadings(): Promise<FlatLatestResponse> {
    const latestData: FlatLatestResponse = {};
    const promises: Promise<void>[] = [];


    for (const topic of TARGET_TOPICS) {
      // NOTE: This assumes 'client1/temperature' is the value stored in the DB topic column.
      const promise = this.sensorRepository
        .createQueryBuilder('reading')
        .where('reading.topic = :topic', { topic })
        .orderBy('reading.timestamp', 'DESC')
        .limit(1)
        .getOne() 
        .then(reading => {
          if (reading) {
            latestData[topic] = reading;
          }
        });
      promises.push(promise);
    }

    await Promise.all(promises);
    return latestData;
  }

  // --- HTTP Endpoint 2: Historical Data Load (30 Days) ---
  async getHistory(filterTopic?: string): Promise<HistoryResponse> {
    const historyData: HistoryResponse = {};
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let query = this.sensorRepository
      .createQueryBuilder('reading')
      .where('reading.timestamp >= :thirtyDaysAgo', { thirtyDaysAgo })
      .orderBy('reading.timestamp', 'ASC');

    // Add topic filtering if the parameter is present
    if (filterTopic) {
      query = query.andWhere('reading.topic = :filterTopic', { filterTopic });
    }

    const readings = await query.getMany(); 

    // Group the results by topic
    readings.forEach(reading => {
      if (!historyData[reading.topic]) {
        historyData[reading.topic] = [];
      }
      historyData[reading.topic].push(reading); 
    });

    return historyData;
  }
  
  /**
   * Fetches the latest N historical readings for a specific topic.
   */
  async getHistoricalData(topic: string, limit: number): Promise<SensorReading[]> {
    this.logger.log(`Querying DB for last ${limit} readings of topic: ${topic}`);

    const readings = await this.sensorRepository
      .createQueryBuilder('reading')
      .where('reading.topic = :topic', { topic })
      .orderBy('reading.timestamp', 'DESC') 
      .limit(limit)
      .getMany();
      
      // Reverse the array to provide chronological order (ASC) for charting/reporting readability
      return readings.reverse(); 
  }

/**
 * Retrieves the last N historical readings for all topics.
 * @param limit The maximum number of readings to return per topic.
 * @returns A Promise resolving to a map of topic -> SensorReading[].
 */
async getAllHistoricalData(limit: number): Promise<{[topic: string]: SensorReading[]}> {
    const allData: {[topic: string]: SensorReading[]} = {};
    const promises: Promise<void>[] = [];
    
    for (const topic of TARGET_TOPICS) {
        const promise = this.getHistoricalData(topic, limit).then(readings => {
            allData[topic] = readings;
        });
        promises.push(promise);
    }
    
    await Promise.all(promises);
    return allData;
}
}