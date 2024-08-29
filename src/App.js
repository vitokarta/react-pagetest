import React, { useState, useEffect } from 'react';
import apiService from './services/apiService';
import LoginForm from './components/LoginForm';
import ReaderView from './components/ReaderView';
import DataManagerView from './components/DataManagerView';
import AdminView from './components/AdminView';
import { getAllOfflineData, retryUpload } from './services/offlineService'; // Import offline functions

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Add an event listener to handle the app going online
    window.addEventListener('online', handleOnline);

    // Check if we're online on initial load
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Removed token verification logic

  const handleLogin = async (username, password) => {
    try {
      const response = await apiService.post('/login', { username, password });
      // Assuming login sets some user data
      setUser(response.data.user);
    } catch (error) {
      console.error('Login error:', error);
      alert('登錄失敗：' + (error.response?.data || error.message));
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  // Function to handle online status
  const handleOnline = async () => {
    try {
      const offlineData = await getAllOfflineData(); // Get all offline data from IndexedDB

      if (offlineData.length > 0) { // Check if there is any offline data
        for (const data of offlineData) {
          await retryUpload(data); // Retry uploading each data entry
        }

        alert('All offline data successfully uploaded'); // Alert if all data is uploaded
      }

    } catch (error) {
      console.error('Error uploading offline data:', error);
    }
  };

  return (
    <div>
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div>
          <h1>電表管理系統</h1>
          <button onClick={handleLogout}>登出</button>
          {user.role === 'reader' && <ReaderView user={user} />}
          {user.role === 'data_manager' && <DataManagerView user={user} />}
          {user.role === 'admin' && <AdminView user={user} />}
        </div>
      )}
    </div>
  );
}

export default App;
