import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

function MeterHistoryModal({ meterId, meterType, onClose, onEditReading, userRole }) {
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1); // 总页数
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await apiService.get(`/meter-history/${meterType}/${meterId}?page=${page}`);
        setHistory(response.data.records); // 假设 API 返回的数据包含 records 和 totalPages
        setTotalPages(response.data.totalPages || 1); // 设置总页数
      } catch (error) {
        console.error('Error fetching meter history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [meterId, meterType, page]);

  const canEdit = (readingTime) => {
    if (userRole === 'data_manager') return true;
    const now = new Date();
    const readingDate = new Date(readingTime);
    const hoursSinceReading = (now - readingDate) / (1000 * 60 * 60);
    return hoursSinceReading <= 24;
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="modal" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
      <h2>電表歷史記錄</h2>
      {loading ? (
        <p>加載中...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>讀數時間</th>
                <th>讀數</th>
                <th>用電量</th>
                <th>照片</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id}>
                  <td>{new Date(record.reading_time).toLocaleString()}</td>
                  <td>{record.reading_value}</td>
                  <td>{record.difference}</td>
                  <td>
                    {record.photo_url && (
                      <a href={record.photo_url} target="_blank" rel="noopener noreferrer">
                        查看照片
                      </a>
                    )}
                  </td>
                  <td>
                    {canEdit(record.reading_time) && (
                      <button onClick={() => onEditReading(record)}>修改</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="pagination">
            <button 
              disabled={page === 1} 
              onClick={() => handlePageChange(page - 1)}
            >
              上一頁
            </button>
            <span>
              第 {page} 頁 / 共 {totalPages} 頁
            </span>
            <button 
              disabled={page === totalPages} 
              onClick={() => handlePageChange(page + 1)}
            >
              下一頁
            </button>
          </div>
        </>
      )}
      <button onClick={onClose}>關閉</button>
    </div>
  );
}

export default MeterHistoryModal;
