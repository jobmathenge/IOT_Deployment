// app/dashboard/(overview)/page.tsx
'use client'; 

import { useState, useEffect } from 'react';
import StatusTile from '@/app/ui/dashboard/status-tile';
import DataChart from '@/app/ui/dashboard/data-chart'; 
import { FaSun, FaBolt, FaTemperatureHigh, FaWater, FaChargingStation } from 'react-icons/fa'; 
import { MdWaterDrop } from 'react-icons/md'; 
import { io, Socket } from 'socket.io-client';

// --- CONFIGURATION ---
const WIDGET_CONFIG = [
    { topic: 'client1/temperature', title: "Temperature", unit: "°C", Icon: FaTemperatureHigh, type: "numeric" as const },
    { topic: 'client1/humidity', title: "Humidity", unit: "%", Icon: MdWaterDrop, type: "numeric" as const }, 
    { topic: 'client1/flowrate', title: "Water Flowrate", unit: "L/s", Icon: FaWater, type: "numeric" as const }, 
    { topic: 'client1/power', title: "Power Consumption", unit: "kW", Icon: FaBolt, type: "numeric" as const }, 
    { topic: 'client1/cumulative', title: "Cumulative Energy", unit: "kWh", Icon: FaSun, type: "numeric" as const }, 
    { topic: 'client1/current', title: "Current Draw", unit: "A", Icon: FaChargingStation, type: "numeric" as const }, 
];

// --- INTERFACES ---
interface LatestReading { topic: string; value: number | boolean | string; timestamp: string; }
interface FlatLatestResponse { [topic: string]: LatestReading; }

interface TileData { 
    topic: string; 
    title: string; 
    unit: string; 
    Icon: React.ElementType; 
    value: number | string; 
    type: "numeric" | "boolean"; 
}

// NestJS Gateway Connection details
const NEST_WS_URL = 'http://localhost:3001'; 
const WS_PATH = '/ws/data'; 

let socket: Socket | null = null; 

// --- OverviewPage Component ---

export default function OverviewPage() {
    const [latestData, setLatestData] = useState<Record<string, LatestReading>>({});
    const [loading, setLoading] = useState(true);

  
    const fetchInitialData = async () => {
        try {
           
            const response = await fetch(`${NEST_WS_URL}/data/latest`); 
            if (!response.ok) throw new Error('Network response was not ok');
            const rawData: FlatLatestResponse = await response.json(); 
            
            setLatestData(rawData); 
        } catch (error) {
            console.error("Failed to fetch initial sensor data:", error);
        } finally {
            setLoading(false);
        }
    };

   
    useEffect(() => {
        fetchInitialData(); 
        
        socket = io(NEST_WS_URL, {
            path: WS_PATH, 
            transports: ['websocket']
        }); 

        socket.on('new_reading', (reading: LatestReading) => {
            console.log('Received real-time update:', reading.topic, reading.value);
            
            setLatestData(prevData => ({
                ...prevData,
                [reading.topic]: reading, 
            }));
        });

        socket.on('connect_error', (err) => {
            console.error(`WebSocket connection failed: ${err.message}`);
        });
        
        return () => {
            socket?.disconnect();
        };
    }, []); 

  

    // Prepare tile data by combining config with live data
    const tileData: TileData[] = WIDGET_CONFIG.map(config => {
        const reading = latestData[config.topic];
        
        if (!reading) {
            return { ...config, value: "---" };
        }
        
        // Default handling for numeric types
        // The value is guaranteed to be number or string here, but for numeric topics, we prefer number.
        // We ensure it is a number before calling toFixed().
        const numericValue = typeof reading.value === 'string' ? parseFloat(reading.value) : (reading.value as number);
        
        return {
            ...config,
            // Check if the parsed value is a valid number before fixing decimals
            value: isNaN(numericValue) ? "---" : numericValue.toFixed(2), 
        };
    });

    return (
        <main className="p-6">
            
            <h1 className="text-3xl font-bold mb-6 text-gray-800">System Dashboard</h1>
            
            <p className="text-sm text-gray-500 mb-4">
                {loading && Object.keys(latestData).length === 0 
                 ? 'Connecting to real-time data...' 
                 : 'Live feed established.'}
            </p>

            {/* REAL-TIME STATUS TILES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                {tileData.map((data) => (
                    <StatusTile 
                        key={data.topic}
                        title={data.title}
                        value={data.value}
                        unit={data.unit}
                        Icon={data.Icon}
                    />
                ))}
            </div>

            {/* HISTORICAL DATA CHART/TABLE */}
            <div className="mt-8">
                <DataChart/> 
            </div>

        </main>
    );
}