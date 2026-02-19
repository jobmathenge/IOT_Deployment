// src/data/data.gateway.ts

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */


import { 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection,
  OnGatewayInit, 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'; 
import { SensorReading } from './interfaces/sensor-reading.interface'; 
import { Alert } from '../alerts/alerts.service';
@WebSocketGateway({ 
    // Host on port 8080 
    cors: { 
        origin: '*',
        methods: ['GET', 'POST'],
    },
    path: '/ws/data', 
})
export class DataGateway implements OnGatewayInit, OnGatewayConnection {
    @WebSocketServer() 
    server: Server;

    afterInit(server: Server) {
        console.log(' Data WebSocket Gateway Initialized');
    }

    handleConnection(client: Socket, ...args: any[]) {
        console.log(` Client connected: ${client.id}`);
    }

    /**
     * Broadcasts a new reading to all connected clients.
     * This is called by the DataService after saving a reading.
     */
    broadcastNewReading(reading: SensorReading) {
        this.server.emit('new_reading', reading); 
        console.log(`Broadcasted new reading for topic: ${reading.topic}`);
    }

    broadcastNewAlert(alert: Alert) {
        
        this.server.emit('newAlert', alert); 
        console.log(`Broadcasted new alert [ID: ${alert.id}] for topic: ${alert.topic}`);
    }
    broadcastAlertCount(count: number) {
        this.server.emit('alertCount', count); 
        console.log(`Broadcasted new active alert count: ${count}`);
    }
}