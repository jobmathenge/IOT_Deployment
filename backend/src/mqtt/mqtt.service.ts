import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; 
import * as mqtt from 'mqtt';
import { DataService } from '../data/data.service'; 
import { AlertsService } from 'src/alerts/alerts.service';


@Injectable()
export class MqttService implements OnModuleInit {
  private readonly logger = new Logger(MqttService.name);
  private client: mqtt.MqttClient;

  constructor(
    private readonly dataService: DataService,
    private readonly configService: ConfigService, 
    private readonly alertsService: AlertsService,
  ) {}


  // Implement the NestJS lifecycle hook
  onModuleInit() {
    this.connect();
  }

  private connect() {
    
    const url = 'mqtts://5e86dc6e1d6d4388a5f1845a946c07b8.s1.eu.hivemq.cloud:8883';

    const options: mqtt.IClientOptions = {
        username: 'hivemq.webclient.1765124168226',
        password: 'w8QcE2GF!S$5h3xf#%Hg',
        port: 8883,
        rejectUnauthorized: false  
    };

    this.client = mqtt.connect(url, options);

    this.client.on('connect', () => {
      this.logger.log(`✅ Connected to MQTT broker: ${url}`);
      this.subscribeToTopic();
    });

    this.client.on('error', (error) => {
      this.logger.error(`❌ MQTT connection error: ${error.message}`);
    });

    this.client.on('message', (topic, payload) => {
      this.handleMessage(topic, payload.toString());
    });
  }

  private subscribeToTopic() {
    
    const MQTT_TOPICS = [
      'client1/temperature', 
      'client1/humidity', 
      'client1/flowrate', 
      'client1/power',    
      'client1/cumulative', 
      'client1/current', 
    ];
    this.client.subscribe(MQTT_TOPICS, (err) => {
      if (!err) {
        this.logger.log(`👂 Subscribed to topics: ${MQTT_TOPICS.join(', ')}`);
      } else {
        this.logger.error(`❌ Subscription error on topics: ${err.message}`);
      }
    });
  }

  // Calling the new method on DataService
  private handleMessage(topic: string, message: string) {
    // Passes raw MQTT data to the service layer for processing, saving, and broadcasting
    this.dataService.processMqttData(topic, message);
  }

  publish(topic: string, message: string): void {
    this.client.publish(topic, message);
  }
}