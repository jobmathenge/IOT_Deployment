// app/dashboard/Reports/page.tsx

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use client'; 

import React, { useState, useEffect, useCallback } from 'react';

interface SensorReading {
  topic: string;
  value: number; 
  timestamp: string | Date; 
}
type AllReportData = {
  [topic: string]: SensorReading[];
};

// --- NEW: Alert Interfaces matching backend's AlertSummaryReport ---
interface TopicAlertSummary {
  topic: string;
  total: number;
  active: number;
  categories: { [category: string]: number; };
}
interface AlertSummaryReport {
  totalAlerts: number;
  activeAlerts: number;
  topics: TopicAlertSummary[];
}
// -----------------------------------------------------------------

const REPORT_DATA_API_URL = 'http://localhost:3001/report/data';
const ALERT_DATA_API_URL = 'http://localhost:3001/report/alert-data'; 
const REPORT_DOWNLOAD_API_URL = 'http://localhost:3001/report/pdf';
const ALERT_DAYS = 7; 

// Helper component for Sensor Summary Table (Unchanged)
const SummaryTable: React.FC<{ data: AllReportData }> = ({ data }) => {
  const topics = Object.keys(data);

  const calculateMetrics = (topic: string, readings: SensorReading[]) => {
    const count = readings.length;
    if (count === 0) return { min: 'N/A', max: 'N/A', avg: 'N/A' };

    const values = readings.map(r => r.value);
    const sum = values.reduce((a, b) => a + b, 0);

    if (topic.includes('Status')) {
      const onCount = sum;
      const offCount = count - onCount;
      return {
        min: `OFF: ${offCount}`,
        max: `ON: ${onCount}`,
        avg: `${((onCount / count) * 100).toFixed(0)}% ON`
      };
    } else {
      const min = Math.min(...values).toFixed(2);
      const max = Math.max(...values).toFixed(2);
      const avg = (sum / count).toFixed(2);
      return { min, max, avg };
    }
  };

  return (
    <div className="shadow-lg overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {['Sensor Topic', 'Count', 'Min Value', 'Max Value', 'Average Value'].map(header => (
              <th key={header} className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {topics.map(topic => {
            const metrics = calculateMetrics(topic, data[topic]);
            return (
              <tr key={topic} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b font-medium text-gray-800">{topic}</td>
                <td className="py-2 px-4 border-b text-gray-600">{data[topic].length}</td>
                <td className="py-2 px-4 border-b text-gray-600">{metrics.min}</td>
                <td className="py-2 px-4 border-b text-gray-600">{metrics.max}</td>
                <td className="py-2 px-4 border-b text-gray-600">{metrics.avg}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};


// Helper component for Alert Summary Table
const AlertSummaryTable: React.FC<{ report: AlertSummaryReport }> = ({ report }) => {
  return (
    <div className="bg-red-50 border border-red-200 shadow-lg rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-red-700">Alert Monitoring Summary ({ALERT_DAYS} Days)</h2>
        
        <div className="grid grid-cols-4 gap-4 mb-6 text-center">
            <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs font-medium text-gray-500">Total Alerts</p>
                <p className="text-2xl font-semibold text-gray-900">{report.totalAlerts}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs font-medium text-gray-500">Active Alerts</p>
                <p className={`text-2xl font-semibold ${report.activeAlerts > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {report.activeAlerts}
                </p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs font-medium text-gray-500">Topics Affected</p>
                <p className="text-2xl font-semibold text-gray-900">{report.topics.length}</p>
            </div>
            <div className="p-3 bg-white rounded-lg border">
                <p className="text-xs font-medium text-gray-500">Alert Period (Days)</p>
                <p className="text-2xl font-semibold text-gray-900">{ALERT_DAYS}</p>
            </div>
        </div>

        <h3 className="text-xl font-semibold mb-3 border-t pt-4">Alert Breakdown by Topic</h3>
        <div className="shadow overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-red-100">
                  <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Topic</th>
                      <th className="py-2 px-4 text-center text-sm font-semibold text-gray-700">Total Alerts</th>
                      <th className="py-2 px-4 text-center text-sm font-semibold text-gray-700">Active Alerts</th>
                      <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700">Top Alert Types</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {report.topics.map((topic, index) => (
                      <tr key={index} className="hover:bg-red-50">
                          <td className="py-2 px-4 font-medium text-gray-800">{topic.topic}</td>
                          <td className="py-2 px-4 text-center">{topic.total}</td>
                          <td className={`py-2 px-4 text-center font-bold ${topic.active > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {topic.active}
                          </td>
                          <td className="py-2 px-4 text-xs">
                              {Object.entries(topic.categories)
                                  .sort(([, countA], [, countB]) => countB - countA)
                                  .map(([category, count]) => `${category} (${count})`)
                                  .join(', ')}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          {report.topics.length === 0 && (
              <p className="text-center text-gray-500 py-4">No alerts found in the last {ALERT_DAYS} days.</p>
          )}
        </div>
    </div>
  );
};
// -----------------------------------------------------------------


export default function ReportsPage() {
  const [reportData, setReportData] = useState<AllReportData | null>(null);
  const [alertReport, setAlertReport] = useState<AlertSummaryReport | null>(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Fetch JSON Data ---
  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Sensor Data
      const sensorResponse = await fetch(REPORT_DATA_API_URL);
      if (!sensorResponse.ok) {
        throw new Error(`HTTP error! Status: ${sensorResponse.status}`);
      }
      const sensorData = await sensorResponse.json();
      setReportData(sensorData);

      // 2. Fetch Alert Data 
      const alertResponse = await fetch(`${ALERT_DATA_API_URL}?alertDays=${ALERT_DAYS}`);
      if (!alertResponse.ok) {
        console.warn("Failed to fetch alert data:", alertResponse.statusText);
        setAlertReport(null);
      } else {
        const alertData = await alertResponse.json();
        setAlertReport(alertData);
      }

    } catch (err: any) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data. Check backend JSON endpoints.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);
  
  // --- Download Handler (Triggers the PDF endpoint) ---
  const handleDownload = () => {

    window.open(`${REPORT_DOWNLOAD_API_URL}?alertDays=${ALERT_DAYS}`, '_blank');
  };

  return (
    <main className="relative p-6">
      <h1 className={`mb-6 text-3xl font-bold`}>
        System Monitoring Report (HTML)
      </h1>
      
      {/* Loading & Error States */}
      {loading && !reportData && <p className="text-xl text-blue-500">Generating report data, please wait...</p>}
      {error && <p className="text-xl text-red-500">Error: {error}</p>}

      {/* --- Report Content --- */}
      {!loading && (reportData || alertReport) && (
        <div className="space-y-10">
          
          {/* ALERT SUMMARY SECTION */}
          {alertReport && (
            <section>
              <AlertSummaryTable report={alertReport} />
            </section>
          )}
          
          <hr className="border-gray-300" />
          
          {/* Sensor Summary Section */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Sensor Data Summary of All Topics</h2>
            {reportData && Object.keys(reportData).length > 0 ? (
                <SummaryTable data={reportData} />
            ) : (
                <p className="text-gray-500">No sensor data available to generate summary.</p>
            )}
          </section>
          
          <hr className="border-gray-300" />

          {/* Detailed Sensor Sections */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Detailed Data Logs (Last 50 Readings)</h2>
            {reportData && Object.keys(reportData).length > 0 ? (
                Object.keys(reportData).map(topic => (
                <div key={topic} className="mb-8 p-4 border rounded-lg bg-gray-50">
                    <h3 className="text-xl font-semibold mb-3">{topic}</h3>
                    
                    <div className="shadow overflow-x-auto">
                        <table className="min-w-full bg-white">
                            <thead>
                                <tr className="bg-gray-200">
                                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Timestamp</th>
                                    <th className="py-2 px-4 border-b text-left text-sm font-semibold text-gray-700">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData[topic].slice(0, 50).map((reading, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        {/* Use toLocaleString for date formatting */}
                                        <td className="py-1 px-4 border-b text-sm">{new Date(reading.timestamp).toLocaleString()}</td>
                                        {/* Format value */}
                                        <td className="py-1 px-4 border-b text-sm">{typeof reading.value === 'number' ? reading.value.toFixed(2) : reading.value}</td>
                                    </tr>
                                ))}
                                {reportData[topic].length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-center py-4 text-gray-500">No detailed data log available.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))
            ) : (
                <p className="text-gray-500">No sensor data logs to display.</p>
            )}
          </section>

        </div>
      )}

      {/* Floating Download Button (Triggers PDF) */}
      {(reportData || alertReport) && (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50">
          <button 
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-base font-semibold text-white shadow-md transition-colors hover:bg-blue-500"
          >
            ⬇️ Export PDF Report
          </button>
        </div>
      )}
    </main>
  );
}