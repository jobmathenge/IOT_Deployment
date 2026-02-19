// app/ui/alerts/AlertBell.tsx

/**
 * Copyright 2026 Job Mathenge
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * http://www.apache.org/licenses/LICENSE-2.0
 */

'use client'; 

import React, { useState, useEffect, useCallback } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import AlertTablePopup from './AlertTablePopup'; 
import { Alert } from '@/app/lib/definitions';
import io from 'socket.io-client'; 

// --- API & Helper Constants ---
const API_BASE_URL = 'http://localhost:3001'; 
const ALERT_COUNT_ENDPOINT = `${API_BASE_URL}/alerts/count`;
const ALERT_ALL_ENDPOINT = `${API_BASE_URL}/alerts/all`;
const ALERT_ACKNOWLEDGE_ENDPOINT = `${API_BASE_URL}/alerts/acknowledge`;

const AlertBell: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alerts, setAlerts] = useState<Alert[]>([]); 
  const [activeAlertCount, setActiveAlertCount] = useState(0); 
  const [isLoading, setIsLoading] = useState(false);


  // --- Data Fetching Functions (Stabilized with useCallback) ---

  const fetchActiveAlertCount = useCallback(async () => {
    try {
      const response = await fetch(ALERT_COUNT_ENDPOINT);
      if (response.ok) {
        const { count } = await response.json() as { count: number };
        setActiveAlertCount(count);
      }
    } catch (error) {
      console.error("Error fetching active alert count:", error);
    }
  }, []); 

  const fetchLatestAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ALERT_ALL_ENDPOINT); 
      if (response.ok) {
        const data: Alert[] = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); 

  // --- Handlers ---
  
  const handleAcknowledge = async (id: string) => {
    
    // Authentication check remains removed.

    try {
      const response = await fetch(`${ALERT_ACKNOWLEDGE_ENDPOINT}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Successful acknowledgment (Server returned 200/204)
        console.log(`Alert ${id} acknowledged successfully.`);
      
        
        // UI updates happen automatically via these fetches:
        await fetchLatestAlerts(); 
        await fetchActiveAlertCount();
      } else {
         // Handle Server-Side Errors (404 Not Found, 500 Internal Error, etc.)
         const errorText = await response.text();
         console.error('Failed to acknowledge alert:', errorText);

         let errorMessage = 'The alert could not be acknowledged.';
         
         if (response.status === 404) {
             errorMessage = `Alert with ID ${id} not found.`;
         } else {
             try {
                 const errorJson = JSON.parse(errorText);
                 errorMessage = errorJson.message || errorMessage;
             } catch (e) {
                 errorMessage = `Server Error (${response.status}): ${errorText.substring(0, 50)}...`; 
             }
         }

         // Keep the failure alert to notify the user of an issue
         alert(`Failed to acknowledge alert: ${errorMessage}`);
      }
    } catch (error) {
      // Handle Network Errors
      console.error("Error acknowledging alert:", error);
      alert("A network error occurred while attempting to reach the server.");
    }
  };

  const handleOpenModal = () => {
    fetchLatestAlerts(); 
    setIsModalOpen(true);
  };

  // --- WebSocket Subscription for Real-Time Updates ---
  useEffect(() => {
    fetchActiveAlertCount(); 
    
    const socket = io(API_BASE_URL, {
        path: '/ws/data', 
        transports: ['websocket']
    });

    socket.on('alertCount', (count: number) => {
      setActiveAlertCount(count);
      if (isModalOpen) {
         fetchLatestAlerts();
      }
    });

    socket.on('newAlert', () => {
        if (isModalOpen) {
            fetchLatestAlerts(); 
        }
    });

    return () => {
      socket.close();
    };
  }, [fetchActiveAlertCount, fetchLatestAlerts, isModalOpen]); 


  const bellBaseClass = activeAlertCount > 0 
    ? "text-red-500 hover:text-red-600" 
    : "text-gray-500 hover:text-gray-700";

  const bellAnimationClass = activeAlertCount > 0 
    ? "animate-shake-once" 
    : "";

  const badgeBaseClass = "absolute top-0 right-0 inline-flex items-center justify-center h-5 w-5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full ring-2 ring-white shadow-md";
    
  return (
    <>
      <div className="fixed top-4 right-4 z-[100]"> 
        <button
          onClick={handleOpenModal}
          className={`relative p-3 bg-white rounded-full ring-1 ring-gray-200 shadow-lg transition-colors duration-200 ${bellBaseClass}`}
          aria-label="View Alerts"
          disabled={isLoading} 
        >
          <BellIcon className={`w-6 h-6 ${bellAnimationClass}`} />
          
          {/* Notification Badge */}
          {activeAlertCount > 0 && (
            <span className={badgeBaseClass}>
              {activeAlertCount > 9 ? '9+' : activeAlertCount}
            </span>
          )}
        </button>
      </div>
        
      {isModalOpen && (
        <AlertTablePopup
          alerts={alerts}
          onClose={() => setIsModalOpen(false)}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </>
  );
};

export default AlertBell;