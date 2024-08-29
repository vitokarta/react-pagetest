import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import { storeImage, uploadImage, deleteImage, storeFormData } from '../services/offlineService';
import MeterHistoryModal from './MeterHistoryModal';

function ReaderView({ user }) {
    const [campuses, setCampuses] = useState([]);
    const [selectedCampus, setSelectedCampus] = useState('');
    const [selectedMeterType, setSelectedMeterType] = useState('');
    const [meters, setMeters] = useState([]);
    const [selectedMeter, setSelectedMeter] = useState(null);
    const [reading, setReading] = useState('');
    const [photo, setPhoto] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [fileInputKey, setFileInputKey] = useState(Date.now()); // 用于强制重新渲染文件输入框

    useEffect(() => {
        fetchCampuses();
    }, []);

    const fetchCampuses = async () => {
        try {
            const response = await apiService.get('/campuses');
            setCampuses(response.data);
        } catch (error) {
            console.error('Error fetching campuses:', error);
        }
    };

    const fetchMeters = async () => {
        if (!selectedCampus || !selectedMeterType) return;
        try {
            const response = await apiService.get('/meters');
            const filteredMeters = response.data.filter(meter =>
                meter.campus_id === parseInt(selectedCampus) &&
                meter.meter_type === selectedMeterType
            );
            setMeters(filteredMeters);
        } catch (error) {
            console.error('Error fetching meters:', error);
        }
    };

    useEffect(() => {
        fetchMeters();
    }, [selectedCampus, selectedMeterType]);

    const handleReadingSubmit = async (e) => {
        e.preventDefault();
        if (!selectedMeter || !reading) {
            alert('請選擇電表並輸入度數');
            return;
        }

        let imageUrl = '';
        let imageId = null;

        if (photo) {
            // 生成一個唯一的 ID 來暫存圖片
            imageId = Date.now();
            await storeImage(imageId, photo); // 將圖片存入 IndexedDB

            // 嘗試上傳圖片至 Imgur
            imageUrl = await uploadImage(photo);
            if (!imageUrl) {
                console.log("Image upload failed, storing image locally for later retry.");
                imageUrl = ''; // 如果上傳失敗，保持空值
            } else {
                // 如果上傳成功，從 IndexedDB 刪除圖片並重設 imageId
                await deleteImage(imageId);
                imageId = null;
            }
        }

        const data = {
            meter_id: selectedMeter.meter_number,
            meter_type: selectedMeterType,
            reading_value: reading,
            photo_url: imageUrl || null, // 如果图片 URL 为空，设置为 null
            photoFileId: imageId || null, // 传递本地图片的 ID
        };

        try {
            const response = await apiService.post('/update-meter-reading', data, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            console.log('Server response:', response.data);

            // 如果圖片已成功上傳，且伺服器回傳了圖片 URL
            if (response.data.photo_url) {
                console.log('Uploaded photo URL:', response.data.photo_url);
            }

            alert('讀數更新成功');
            setReading('');
            setPhoto(null);
            setFileInputKey(Date.now()); // 重置文件输入框
            fetchMeters(); // 重新獲取電表列表以更新顯示
        } catch (error) {
            console.error('Error updating reading:', error);

            // 構造離線保存的表單數據
            const offlineFormData = {
                meter_id: selectedMeter.meter_number,
                meter_type: selectedMeterType,
                reading_value: reading,
                photoFileId: imageId || null, // 如果無圖片，則為 null
            };

            // 如果請求失敗，將表單數據暫存至 IndexedDB 以便後續重試
            await storeFormData(offlineFormData);

            alert('更新失敗，但數據已離線保存，稍後重試');
        }
    };

    return (
        <div>
            <h2>更新電表讀數</h2>
            <select onChange={e => setSelectedCampus(e.target.value)} value={selectedCampus}>
                <option value="">選擇校區</option>
                {campuses.map(campus => (
                    <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
            </select>
            <select onChange={e => setSelectedMeterType(e.target.value)} value={selectedMeterType}>
                <option value="">選擇電表類型</option>
                <option value="digital">數位式</option>
                <option value="mechanical">機械式</option>
            </select>
            {selectedCampus && selectedMeterType && (
                <select onChange={e => setSelectedMeter(meters.find(m => m.id === parseInt(e.target.value)))}>
                    <option value="">選擇電表</option>
                    {meters.map(meter => (
                        <option key={meter.id} value={meter.id}>{meter.meter_number}</option>
                    ))}
                </select>
            )}
            {selectedMeter && (
                <form onSubmit={handleReadingSubmit}>
                    <h3>電表號: {selectedMeter.meter_number}</h3>
                    <div>
                        <label>位置: {selectedMeter.location}</label>
                    </div>
                    <div>
                        <label>新讀數: </label>
                        <input 
                            type="number" 
                            value={reading} 
                            onChange={e => setReading(e.target.value)} 
                            placeholder="新電表度數" 
                            required
                        />
                    </div>
                    <div>
                        <label>上傳照片: </label>
                        <input 
                            key={fileInputKey} // 使用 key 强制重新渲染
                            type="file" 
                            onChange={e => setPhoto(e.target.files[0])} 
                            accept="image/*"
                        />
                        {photo && <p>選擇的檔案: {photo.name}</p>} {/* 显示文件名 */}
                    </div>
                    <button type="button" onClick={() => setShowHistory(true)}>查看歷史記錄</button>
                    <button type="submit">更新讀數</button>
                </form>
            )}
            {showHistory && selectedMeter && (
                <MeterHistoryModal 
                    meterId={selectedMeter.meter_number}
                    meterType={selectedMeterType}
                    onClose={() => setShowHistory(false)}
                />
            )}
        </div>
    );
}

export default ReaderView;
