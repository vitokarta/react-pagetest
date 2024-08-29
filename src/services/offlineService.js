import Axios from 'axios';
import apiService from './apiService'; // 导入 apiService

// IndexedDB helper functions
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('imageDB', 2);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
      }
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


// Store image in IndexedDB
export const storeImage = async (imageId, imageFile) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readwrite');
  const store = transaction.objectStore('images');
  store.put({ id: imageId, file: imageFile });
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};

export const storeFormData = async (formData) => {
    const db = await openDB();
    const transaction = db.transaction('formData', 'readwrite');
    const store = transaction.objectStore('formData');
    store.put(formData);
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => reject(event.target.error);
    });
  };
  

// Get image from IndexedDB
export const getImage = async (imageId) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readonly');
  const store = transaction.objectStore('images');
  const request = store.get(imageId);
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
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
  

// Delete image from IndexedDB
export const deleteImage = async (imageId) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readwrite');
  const store = transaction.objectStore('images');
  store.delete(imageId);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
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

  

// Upload image to Imgur and return the image URL
export const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await Axios.post("https://api.imgur.com/3/image", formData, {
      headers: {
        Authorization: "Bearer 85f1906ae12283d2daa9e5d96472ae4274ae7374",
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Image URL:", response.data.data.link);
    return response.data.data.link;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null; // Return null if the upload fails
  }
};

export const retryUpload = async (formData) => {
  try {
      // 如果有 photoFileId，則需要首先上傳圖片
      if (formData.photoFileId) {
          const photo = await getImage(formData.photoFileId); // 從 IndexedDB 中獲取圖片
          if (photo) {
              const imageUrl = await uploadImage(photo.file);
              if (imageUrl) {
                  formData.photo_url = imageUrl; // 更新圖片 URL
                  await deleteImage(formData.photoFileId); // 刪除已上傳的圖片
                  formData.photoFileId = null; // 重置 ID
              }
          }
      }

      // 將更新後的表單數據提交到伺服器
      const response = await apiService.post('/update-meter-reading', formData, {
          headers: {
              'Content-Type': 'application/json'
          }
      });

      // 如果成功，從 IndexedDB 刪除該表單數據
      await deleteFormData(formData.meter_id);

      console.log('Upload successful:', response.data);
  } catch (error) {
      console.error('Retry upload failed:', error);
  }
};
