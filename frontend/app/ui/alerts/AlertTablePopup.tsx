// app/ui/alerts/AlertTablePopup.tsx
'use client';

import React from 'react'; 
import { Alert } from '@/app/lib/definitions'

export interface AlertTablePopupProps {
  alerts: Alert[]; // List of alerts (data from parent, top 20)
  onClose: () => void;
  onAcknowledge: (id: string) => Promise<void>; // Handler from parent
}

const AlertTablePopup: React.FC<AlertTablePopupProps> = ({ alerts, onClose, onAcknowledge }) => {
  
  return (
    // Fixed position modal overlay
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-start pt-10">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all duration-300">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Alert History (Top {alerts.length})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 text-3xl leading-none">
            &times;
          </button>
        </div>
        
        {alerts.length === 0 ? (
          <p className="text-gray-500">No recent alerts found.</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {['ID', 'Topic', 'Condition', 'Timestamp', 'Status', 'Action'].map(header => (
                  <th key={header} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {alerts.map((alertItem) => (
                <tr key={alertItem.id} className={alertItem.status === 'Active' ? 'bg-red-50 hover:bg-red-100' : 'bg-white hover:bg-gray-50'}>
                  <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">{alertItem.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{alertItem.topic}</td>
                  <td className="px-3 py-2 text-xs max-w-xs">{alertItem.condition}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {new Date(alertItem.timestamp).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      alertItem.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {alertItem.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                    {alertItem.status === 'Active' ? (
                      <button
                        onClick={() => onAcknowledge(alertItem.id)}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white py-1 px-2 rounded transition-colors"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-gray-400">Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertTablePopup;