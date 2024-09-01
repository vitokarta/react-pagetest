import Axios from 'axios';
import apiService from './apiService'; // 导入 apiService

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('imageDB', 2);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('formData')) {
        db.createObjectStore('formData', { keyPath: 'meter_id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};


export const storeFormData = async (formData) => {
  const db = await openDB();
  const transaction = db.transaction('formData', 'readwrite');
  const store = transaction.objectStore('formData');
  store.add(formData);  // Change from `put` to `add`
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};
  

export const getAllOfflineData = async () => {
  const db = await openDB();
  const transaction = db.transaction('formData', 'readonly');
  const store = transaction.objectStore('formData');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};
  


export const deleteFormData = async (meterId) => {
  const db = await openDB();
  const transaction = db.transaction('formData', 'readwrite');
  const store = transaction.objectStore('formData');
  store.delete(meterId);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};

  

export const retryUpload = async (formData) => {
  try {
    // 将更新后的表单数据提交到服务器
    const response = await apiService.post('/update-meter-reading', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    // 如果成功，从 IndexedDB 删除该表单数据
    await deleteFormData(formData.meter_id);

    console.log('Upload successful:', response.data);
  } catch (error) {
    console.error('Retry upload failed:', error);
  }
};
  