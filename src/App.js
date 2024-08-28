import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="用戶名"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密碼"
      />
      <button type="submit">登入</button>
    </form>
  );
}

function AddMeterForm({ meterType, campuses, onAddMeter }) {
  const [meterData, setMeterData] = useState({
    meter_number: '',
    location: '',
    campus_id: '',
    brand: '',
    display_unit: '',
    ct_value: '',
    wiring_method: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddMeter(meterType, meterData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={meterData.meter_number}
        onChange={(e) => setMeterData({...meterData, meter_number: e.target.value})}
        placeholder="電表號"
        required
      />
      <input
        type="text"
        value={meterData.location}
        onChange={(e) => setMeterData({...meterData, location: e.target.value})}
        placeholder="位置"
        required
      />
      <select
        value={meterData.campus_id}
        onChange={(e) => setMeterData({...meterData, campus_id: e.target.value})}
        required
      >
        <option value="">選擇校區</option>
        {campuses.map(campus => (
          <option key={campus.id} value={campus.id}>{campus.name}</option>
        ))}
      </select>
      {meterType === 'digital' ? (
        <>
          <select
            value={meterData.brand}
            onChange={(e) => setMeterData({...meterData, brand: e.target.value})}
            required
          >
            <option value="">選擇廠牌</option>
            <option value="1">施耐德</option>
            <option value="2">其他</option>
          </select>
          <div>
            顯示單位：
            <label><input type="checkbox" name="Wh" onChange={(e) => handleUnitChange(e, 'Wh')} /> Wh</label>
            <label><input type="checkbox" name="VAh" onChange={(e) => handleUnitChange(e, 'VAh')} /> VAh</label>
            <label><input type="checkbox" name="VARh" onChange={(e) => handleUnitChange(e, 'VARh')} /> VARh</label>
          </div>
        </>
      ) : (
        <>
          <select
            value={meterData.ct_value}
            onChange={(e) => setMeterData({...meterData, ct_value: e.target.value})}
            required
          >
            <option value="">選擇 CT 值</option>
            <option value="1">有裝電比值</option>
            <option value="2">沒有</option>
          </select>
          <input
            type="text"
            value={meterData.wiring_method}
            onChange={(e) => setMeterData({...meterData, wiring_method: e.target.value})}
            placeholder="電壓接線方式"
          />
        </>
      )}
      <button type="submit">添加電表</button>
    </form>
  );

  function handleUnitChange(e, unit) {
    const updatedUnits = e.target.checked
      ? [...meterData.display_unit.split(','), unit].filter(Boolean).join(',')
      : meterData.display_unit.split(',').filter(u => u !== unit).join(',');
    setMeterData({...meterData, display_unit: updatedUnits});
  }
}

function MeterHistoryModal({ meterId, meterType, onClose }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`https://servertest1-e5f153f6ef40.herokuapp.com/meter-history/${meterType}/${meterId}`); // Updated URL
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
            <th>差額</th>
            {meterType === 'digital' && (
              <>
                <th>廠牌</th>
                <th>顯示單位</th>
              </>
            )}
            {meterType === 'mechanical' && (
              <>
                <th>CT值</th>
                <th>電壓接線方式</th>
              </>
            )}
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

function App() {
  const [user, setUser] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState('');
  const [selectedMeterType, setSelectedMeterType] = useState('');
  const [meters, setMeters] = useState([]);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [reading, setReading] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showAddMeterForm, setShowAddMeterForm] = useState(false);
  const [brand, setBrand] = useState('');
  const [displayUnits, setDisplayUnits] = useState({ Wh: false, VAh: false, VARh: false });
  const [ctValue, setCtValue] = useState('');
  const [wiringMethod, setWiringMethod] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 验证 token 并设置用户
      fetchCampuses();
    }
  }, []);

  
  const fetchCampuses = async () => {
    try {
      const response = await axios.get('https://servertest1-e5f153f6ef40.herokuapp.com/campuses'); // Updated URL
      console.log('API response:', response);
      console.log('Campuses data:', response.data);
      setCampuses(response.data);
    } catch (error) {
      console.error('Error fetching campuses:', error);
    }
  };
  useEffect(() => {
    console.log('Campuses state updated:', campuses);
  }, [campuses]); 

  
  const fetchMeters = async () => {
    if (!selectedCampus || !selectedMeterType) return;
    try {
        const response = await axios.get('https://servertest1-e5f153f6ef40.herokuapp.com/meters'); // Updated URL
        console.log('Fetched meters:', response.data);
        const filteredMeters = response.data.filter(meter => 
            meter.campus_id === parseInt(selectedCampus) && 
            meter.meter_type === selectedMeterType
        );
        console.log('Filtered meters:', filteredMeters);
        setMeters(filteredMeters);
    } catch (error) {
        console.error('Error fetching meters:', error);
    }
};
  useEffect(() => {
    fetchMeters();
  }, [selectedCampus, selectedMeterType]);

  const handleLogin = async (username, password) => {
  try {
    const response = await axios.post('https://servertest1-e5f153f6ef40.herokuapp.com/login', { username, password }); // Updated URL
    localStorage.setItem('token', response.data.token);
    setUser({ username });
    fetchCampuses();
  } catch (error) {
    console.error('Login failed:', error);
  }
};

  const handleAddMeter = async (meterType, meterData) => {
    try {
      await axios.post(`https://servertest1-e5f153f6ef40.herokuapp.com/meters`, { ...meterData, meter_type: meterType }); // Updated URL
      setShowAddMeterForm(false);
      fetchMeters(); // Refresh the meter list after adding
    } catch (error) {
      console.error('Error adding meter:', error);
    }
  };

  const handleAddReading = async () => {
    if (!selectedMeter) return;

    const formData = new FormData();
    formData.append('reading_value', reading);
    formData.append('meter_id', selectedMeter.id);
    formData.append('photo', photo);

    try {
      await axios.post(`https://servertest1-e5f153f6ef40.herokuapp.com/meter-readings`, formData, { // Updated URL
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('Reading added successfully!');
      setReading('');
      setPhoto(null);
    } catch (error) {
      console.error('Error adding reading:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <div className="App">
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <>
          <h1>歡迎，{user.username}</h1>
          <button onClick={handleLogout}>登出</button>
          <div>
            <label>
              選擇校區：
              <select value={selectedCampus} onChange={(e) => setSelectedCampus(e.target.value)}>
                <option value="">選擇校區</option>
                {campuses.map(campus => (
                  <option key={campus.id} value={campus.id}>{campus.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              選擇電表類型：
              <select value={selectedMeterType} onChange={(e) => setSelectedMeterType(e.target.value)}>
                <option value="">選擇電表類型</option>
                <option value="digital">數位電表</option>
                <option value="mechanical">機械電表</option>
              </select>
            </label>
          </div>
          <div>
            <label>
              選擇電表：
              <select value={selectedMeter?.id || ''} onChange={(e) => {
                const selectedMeterId = e.target.value;
                const meter = meters.find(m => m.id === parseInt(selectedMeterId));
                setSelectedMeter(meter);
              }}>
                <option value="">選擇電表</option>
                {meters.map(meter => (
                  <option key={meter.id} value={meter.id}>{meter.meter_number}</option>
                ))}
              </select>
            </label>
          </div>
          <div>
            <label>
              讀數值：
              <input type="number" value={reading} onChange={(e) => setReading(e.target.value)} />
            </label>
          </div>
          <div>
            <label>
              照片：
              <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
            </label>
          </div>
          <button onClick={handleAddReading}>添加讀數</button>
          <button onClick={() => setShowHistory(true)}>查看歷史記錄</button>
          {selectedMeter && showHistory && (
            <MeterHistoryModal
              meterId={selectedMeter.id}
              meterType={selectedMeterType}
              onClose={() => setShowHistory(false)}
            />
          )}
          <button onClick={() => setShowAddMeterForm(!showAddMeterForm)}>
            {showAddMeterForm ? '取消添加電表' : '添加新電表'}
          </button>
          {showAddMeterForm && (
            <AddMeterForm
              meterType={selectedMeterType}
              campuses={campuses}
              onAddMeter={handleAddMeter}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;
