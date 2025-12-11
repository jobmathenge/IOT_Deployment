// app/ui/dashboard/data-chart.tsx
'use client'; 

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TableCellsIcon, ChartBarIcon, ArrowDownTrayIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { saveAs } from 'file-saver'; 

// --- CONFIGURATION ---
const NEST_HTTP_URL = 'http://localhost:3001'; 
const WS_PATH = '/ws/data'; 


const ALL_TOPICS = {
    'client1/temperature': { name: "Temperature", color: "#8884d8", unit: "°C" }, 
    'client1/humidity': { name: "Humidity", color: "#1e90ff", unit: "%" },      // NEW TOPIC
    'client1/flowrate': { name: "Water Flowrate", color: "#00bfa5", unit: "L/s" }, // UPDATED TOPIC/UNIT
    'client1/power': { name: "Power Consumption", color: "#ffc658", unit: "kW" }, // UPDATED TOPIC
    'client1/cumulative': { name: "Cumulative Energy", color: "#ff7300", unit: "kWh" }, // NEW TOPIC
    'client1/current': { name: "Current Draw", color: "#ff0000", unit: "A" },      // NEW TOPIC
};

// Define the specific type for all valid topic keys
type TopicKey = keyof typeof ALL_TOPICS; 

const MAX_CACHE_SIZE = 500; 

// --- INTERFACES ---
interface SensorReading { topic: string; value: number; timestamp: string; }
// Ensure HistoryResponse can be indexed by string keys
interface HistoryResponse { [topic: string]: SensorReading[] | undefined; }

// Redefine ChartDataPoint using an intersection type.
type ChartDataPoint = { 
    time: string; 
} & {
    [K in TopicKey]: string | number | undefined;
};


// Helper functions
const formatDateTimeForInput = (date: Date) => {
    const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
};

const exportAlignedDataToCSV = (alignedData: ChartDataPoint[], filename: string = 'sensor_data.csv') => {
    if (alignedData.length === 0) return;

    const topicKeys = Object.keys(ALL_TOPICS) as TopicKey[];
    const headers = ['Timestamp', ...topicKeys.map(key => `${ALL_TOPICS[key].name} (${ALL_TOPICS[key].unit})`)];
    const csvHeader = headers.join(',') + '\n';
    
    const csvRows = alignedData.map(row => 
        [
            `"${row.time}"`,
            ...topicKeys.map(key => `"${row[key] !== null && row[key] !== undefined ? row[key] : '-'}"`)
        ].join(',')
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
};


export default function DataChart() {
    const [history, setHistory] = useState<HistoryResponse>({});
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart'); 
    // Initialize selected topics to include ALL new topics
    const [selectedTopics, setSelectedTopics] = useState<string[]>(Object.keys(ALL_TOPICS)); 
    
    // Time range management
    const [startDate, setStartDate] = useState(formatDateTimeForInput(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
    const [endDate, setEndDate] = useState(formatDateTimeForInput(new Date()));

    // --- 1. Data Fetching Logic (Initial Load and Long-Term Queries) ---
    const fetchHistoryRange = useCallback(async (start?: string, end?: string) => {
        let endpoint = `${NEST_HTTP_URL}/data/history`;
        if (start && end) {
            endpoint += `?startTime=${encodeURIComponent(start)}&endTime=${encodeURIComponent(end)}`;
        }
        try {
            const response = await fetch(endpoint);
            const data: HistoryResponse = await response.json();
            
            const newHistory: HistoryResponse = {}; 
            
            Object.keys(ALL_TOPICS).forEach(topic => {
                const topicKey = topic as TopicKey;
                newHistory[topicKey] = data[topicKey] || [];
            });
            setHistory(newHistory);
        } catch (error) {
            console.error('Failed to fetch sensor data:', error);
        } finally {
            if (!start) { 
                setLoading(false);
            }
        }
    }, []); 

    // --- 2. WebSocket Setup and Initial Load (Efficient Seed + Real-time Push) ---
    useEffect(() => {
        fetchHistoryRange(); 
        const socket: Socket = io(NEST_HTTP_URL, {
            path: WS_PATH,
            transports: ['websocket']
        }); 

        socket.on('new_reading', (reading: SensorReading) => {
            // Only process readings for the new set of topics
            if (Object.keys(ALL_TOPICS).includes(reading.topic)) {
                
                const topicKey = reading.topic as TopicKey;

                setHistory(prevHistory => {
                    const newHistory = { ...prevHistory };
                    
                    if (!newHistory[topicKey]) {
                        newHistory[topicKey] = [];
                    }
                    
                    newHistory[topicKey] = [...(newHistory[topicKey] as SensorReading[]), reading];
                    
                    if ((newHistory[topicKey] as SensorReading[]).length > MAX_CACHE_SIZE) {
                        (newHistory[topicKey] as SensorReading[]).shift();
                    }
                    return newHistory;
                });

                // Sync the endDate to the current time for live viewing
                setEndDate(formatDateTimeForInput(new Date()));
            }
        });
        
        return () => {
            socket.disconnect();
        };
    }, [fetchHistoryRange]); 

    // Function to trigger a long-term DB query when the user changes dates
    const handleTimeRangeChange = (start: string, end: string) => {
        setStartDate(start);
        setEndDate(end);
        fetchHistoryRange(start, end); 
    };
    
    // --- 3. Filtered Data (Applies Time range to the current state) ---
    const filteredDataByTime = useMemo(() => {
        const start = new Date(startDate).getTime();
        

        const selectedEndDate = new Date(endDate);

        selectedEndDate.setHours(0, 0, 0, 0); 
        
        selectedEndDate.setDate(selectedEndDate.getDate() + 1);
        const endExclusive = selectedEndDate.getTime(); 

        let filteredGroupedData: HistoryResponse = {};

        (Object.keys(history) as TopicKey[]).forEach((topicKey) => {
            const readings = history[topicKey];
            if (!readings) return;
            
            const timeFilteredReadings = (readings as SensorReading[]).filter(reading => {
                const timestamp = new Date(reading.timestamp).getTime();
                // Check is now: timestamp >= start AND timestamp < endExclusive (next day midnight)
                return timestamp >= start && timestamp < endExclusive; 
            });
            if (timeFilteredReadings.length > 0) {
                filteredGroupedData[topicKey] = timeFilteredReadings;
            }
        });
        return filteredGroupedData;
    }, [history, startDate, endDate]);


    const chartData = useMemo(() => {
        if (Object.keys(filteredDataByTime).length === 0) return [];
        
        const topicsToAlign = (Object.keys(filteredDataByTime) as TopicKey[]).filter(topic => selectedTopics.includes(topic));
        if (topicsToAlign.length === 0) return [];

        const allTimestamps = new Set<string>();
        topicsToAlign.forEach(topicKey => {
            filteredDataByTime[topicKey]?.forEach(d => allTimestamps.add(d.timestamp));
        });

        const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );

        const topicReadingMap = topicsToAlign.reduce((acc, topicKey) => {
            acc[topicKey] = filteredDataByTime[topicKey]?.reduce((tAcc, reading) => {
                tAcc[reading.timestamp] = reading;
                return tAcc;
            }, {} as Record<string, SensorReading>);
            return acc;
        }, {} as Record<TopicKey, Record<string, SensorReading> | undefined>);

        const lastKnownValue: Record<TopicKey, number | null> = topicsToAlign.reduce((acc, topicKey) => ({ ...acc, [topicKey]: null }), {} as Record<TopicKey, number | null>);
        
        const aggregatedData: ChartDataPoint[] = [];

        sortedTimestamps.forEach(timeKey => {
            const chartPoint: ChartDataPoint = {
                time: new Date(timeKey).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit' }), 
            } as ChartDataPoint;
            
            let hasNewOrCarriedData = false;

            topicsToAlign.forEach(topicKey => {
                const reading = topicReadingMap[topicKey]?.[timeKey];
                
                if (reading) {
                    lastKnownValue[topicKey] = parseFloat(String(reading.value)); 
                }
                
                if (lastKnownValue[topicKey] !== null) {
                    chartPoint[topicKey] = lastKnownValue[topicKey]!.toFixed(2);
                    hasNewOrCarriedData = true;
                }
            });

            if (hasNewOrCarriedData) {
                 aggregatedData.push(chartPoint);
            }
        });

        return aggregatedData;
    }, [filteredDataByTime, selectedTopics]);


 
    const displayedTableData = useMemo(() => {
        if (chartData.length === 0) return [];
        return [...chartData].reverse().slice(0, 50); 
    }, [chartData]);


    const renderTable = () => {
        const tableRows = displayedTableData; 

        return (
            <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                                Timestamp
                            </th>
                            {selectedTopics.map(topic => {
                                const topicKey = topic as TopicKey;
                                return (
                                    <th key={topic} className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                                        {ALL_TOPICS[topicKey].name} ({ALL_TOPICS[topicKey].unit})
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tableRows.map((row, index) => ( 
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'hover:bg-sky-50 transition-colors'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium sticky left-0 bg-white z-10 border-r border-gray-200">
                                    {row.time}
                                </td>
                                {selectedTopics.map(topic => {
                                    const topicKey = topic as TopicKey;
                                    return (
                                        <td key={topic} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {row[topicKey] !== undefined ? row[topicKey] : '-'}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {chartData.length > 50 && <p className="text-sm text-center text-gray-500 mt-4">Displaying the latest 50 aligned readings...</p>}
            </div>
        );
    };


    if (loading) return <p className="text-center p-8">Loading real-time data...</p>;
    if (Object.keys(history).length === 0) return <p className="text-center p-8">No sensor data received yet. Waiting for MQTT messages...</p>;


    return (
        <div className="bg-white p-6 rounded-lg shadow-xl">
            {/* CONTROL PANEL */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
                {/* 1. TIME RANGE EDITOR */}
                <div className="flex flex-wrap items-center space-x-4">
                    <AdjustmentsHorizontalIcon className="w-5 h-5 text-gray-500"/>
                    <div className="flex items-center space-x-2">
                        <label htmlFor="start-date" className="text-sm text-gray-700 font-medium">From:</label>
                        <input
                            id="start-date"
                            type="datetime-local" 
                            value={startDate}
                            onChange={(e) => handleTimeRangeChange(e.target.value, endDate)} 
                            className="p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <label htmlFor="end-date" className="text-sm text-gray-700 font-medium">To:</label>
                        <input
                            id="end-date"
                            type="datetime-local" 
                            value={endDate}
                            onChange={(e) => handleTimeRangeChange(startDate, e.target.value)} 
                            className="p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>

                {/*  ICON BUTTONS (View Toggle and CSV) */}
                <div className="flex space-x-2">
                    {/* View Toggle */}
                    <button
                        onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}
                        className="flex h-[48px] w-[48px] items-center justify-center p-3 text-sm font-medium rounded-md transition-colors bg-sky-100 text-blue-600 hover:bg-sky-200"
                        title={viewMode === 'chart' ? 'Switch to Table View' : 'Switch to Chart View'}
                    >
                        {viewMode === 'chart' ? <TableCellsIcon className="w-6 h-6" /> : <ChartBarIcon className="w-6 h-6" />}
                    </button>
                    
                    {/* CSV Download (Uses the full chartData) */}
                    <button
                        onClick={() => exportAlignedDataToCSV(chartData, `sensor_data_export_${Date.now()}.csv`)}
                        disabled={chartData.length === 0}
                        className={`flex h-[48px] w-[48px] items-center justify-center p-3 text-sm font-medium rounded-md transition-colors ${chartData.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        title="Export Data to CSV"
                    >
                        <ArrowDownTrayIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>
            
            {/* TOPIC FILTER CHECKBOXES */}
            <div className="flex flex-wrap space-x-4 mb-4 text-sm">
                {Object.keys(ALL_TOPICS).map(topic => (
                    <label key={topic} className="flex items-center space-x-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedTopics.includes(topic)}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setSelectedTopics(prev => 
                                    checked ? [...prev, topic] : prev.filter(t => t !== topic)
                                );
                            }}
                            className="form-checkbox h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
                        />
                        <span className="text-gray-700">{ALL_TOPICS[topic as TopicKey].name}</span>
                    </label>
                ))}
            </div>

            {/* VISUALIZATION AREA */}
            <div style={{ height: viewMode === 'chart' ? '400px' : 'auto' }}>
                {viewMode === 'chart' ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart 
                            key={chartData.length} 
                            data={chartData} 
                            margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="time" 
                                angle={-45} 
                                textAnchor="end" 
                                interval="preserveStartEnd" 
                                height={60}
                                style={{ fontSize: '10px' }}
                            />
                            <YAxis /> 
                            <Tooltip 
                                labelFormatter={(label) => `Time: ${label}`}
                                formatter={(value, name) => [value, ALL_TOPICS[name as TopicKey]?.name || name]}
                            />
                            <Legend verticalAlign="top" height={36} />
                            
                            {selectedTopics.map(topic => (
                                <Line 
                                    key={topic}
                                    type="monotone" 
                                    dataKey={topic}
                                    name={ALL_TOPICS[topic as TopicKey].name} 
                                    stroke={ALL_TOPICS[topic as TopicKey].color} 
                                    dot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    renderTable()
                )}
            </div>
        </div>
    );
}