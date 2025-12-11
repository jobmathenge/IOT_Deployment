import { Module } from '@nestjs/common';
import { DataModule } from '../data/data.module';
import { MqttService } from './mqtt.service';
import { ConfigModule } from '@nestjs/config'; 
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    DataModule, 
    ConfigModule, 
    AlertsModule
  ],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}