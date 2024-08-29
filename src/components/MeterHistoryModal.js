import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
function MeterHistoryModal({ meterId, meterType, onClose }) {
    const [history, setHistory] = useState([]);
  
    useEffect(() => {
      const fetchHistory = async () => {
        try {
          const response = await apiService.get(`/meter-history/${meterType}/${meterId}`);
          setHistory(response.data);
        } catch (error) {
          console.error('Error fetching meter history:', error);
        }
      };
      fetchHistory();
    }, [meterId, meterType]);
  
    return (
      <div className="modal">
        <h2>電表歷史記錄</h2>
        <table>
          <thead>
            <tr>
              <th>讀數時間</th>
              <th>讀數</th>
              <th>用電量</th>
              <th>照片</th>
            </tr>
          </thead>
          <tbody>
            {history.map((record, index) => (
              <tr key={index}>
                <td>{new Date(record.reading_time).toLocaleString()}</td>
                <td>{record.reading_value}</td>
                <td>{record.difference}</td>
                {meterType === 'digital' && (
                  <>
                    <td>{record.brand}</td>
                    <td>{record.display_unit}</td>
                  </>
                )}
                {meterType === 'mechanical' && (
                  <>
                    <td>{record.ct_value}</td>
                    <td>{record.wiring_method}</td>
                  </>
                )}
                <td>
                  {record.photo_url && (
                    <a href={record.photo_url} target="_blank" rel="noopener noreferrer">
                      查看照片
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={onClose}>關閉</button>
      </div>
    );
  }
  export default MeterHistoryModal;