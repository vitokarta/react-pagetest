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
    <div className="form-structor">
      <div className="signup">
        <h2 className="form-title" id="signup"><span>or</span>Log in</h2>
        <div className="form-holder">
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Name"
          />
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        <button className="submit-btn" type="submit" onClick={handleSubmit}>Log in</button>
      </div>
    </div>
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
        const response = await axios.get(`https://servertest1-e5f153f6ef40.herokuapp.com/meter-history/${meterType}/${meterId}`);
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
      const response = await axios.get('https://servertest1-e5f153f6ef40.herokuapp.com/campuses');
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
        const response = await axios.get('https://servertest1-e5f153f6ef40.herokuapp.com/meters');
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
    const response = await axios.post('https://servertest1-e5f153f6ef40.herokuapp.com/login', { username, password });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    fetchCampuses(); // 登入成功後立即獲取校區數據
  } catch (error) {
    console.error('Login error:', error);
    alert('登錄失敗：' + (error.response?.data || error.message));
  }
};
const handleReadingSubmit = async (e) => {
  e.preventDefault();
  if (!selectedMeter || !reading) {
    alert('請選擇電表並輸入度數');
    return;
  }

  const formData = new FormData();
  formData.append('meter_id', selectedMeter.meter_number);
  formData.append('meter_type', selectedMeterType);
  formData.append('reading_value', reading);
  if (selectedMeterType === 'digital') {
    formData.append('brand', brand);
    formData.append('display_units', Object.keys(displayUnits).filter(unit => displayUnits[unit]).join(','));
  } else {
    formData.append('ct_value', ctValue);
    formData.append('wiring_method', wiringMethod);
  }
  if (photo) {
    formData.append('photo', photo);
  }

  try {
    const response = await axios.post('https://servertest1-e5f153f6ef40.herokuapp.com/update-meter-reading', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('Server response:', response.data);
    if (response.data.photo_url) {
      console.log('Uploaded photo URL:', response.data.photo_url);
    }
    alert('讀數更新成功');
    setReading('');
    setPhoto(null);
    fetchMeters(); // 重新獲取電表列表以更新顯示
  } catch (error) {
    console.error('Error updating reading:', error);
    alert('更新失敗：' + (error.response?.data?.details || error.message));
  }
};


  const handleAddMeter = async (meterType, meterData) => {
    try {
      const endpoint = meterType === 'digital' ? 'https://servertest1-e5f153f6ef40.herokuapp.com/digital-meters' : 'https://servertest1-e5f153f6ef40.herokuapp.com/mechanical-meters';
      await axios.post(endpoint, meterData);
      alert('電表添加成功');
      setShowAddMeterForm(false);
      fetchMeters();
    } catch (error) {
      console.error('Error adding meter:', error);
      alert('添加電表失敗：' + (error.response?.data || error.message));
    }
  };

  const handleDisplayUnitChange = (unit) => {
    setDisplayUnits(prev => ({ ...prev, [unit]: !prev[unit] }));
  };

  return (
    <div>
      {!user ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <div>
          <h1>電表管理系統</h1>
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
              <h2>電表號: {selectedMeter.meter_number}</h2>
              <div>
                <label>位置: {selectedMeter.location}</label>
              </div>
              {selectedMeterType === 'digital' ? (
                <>
                  <div>
                    <label>廠牌: </label>
                    <select value={brand} onChange={e => setBrand(e.target.value)}>
                      <option value="">選擇廠牌</option>
                      <option value="1">施耐德</option>
                      <option value="2">其他</option>
                    </select>
                  </div>
                  <div>
                    <label>顯示單位: </label>
                    <label><input type="checkbox" checked={displayUnits.Wh} onChange={() => handleDisplayUnitChange('Wh')} /> Wh</label>
                    <label><input type="checkbox" checked={displayUnits.VAh} onChange={() => handleDisplayUnitChange('VAh')} /> VAh</label>
                    <label><input type="checkbox" checked={displayUnits.VARh} onChange={() => handleDisplayUnitChange('VARh')} /> VARh</label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>CT值: </label>
                    <select value={ctValue} onChange={e => setCtValue(e.target.value)}>
                      <option value="">選擇 CT 值</option>
                      <option value="1">有裝電比值</option>
                      <option value="2">沒有</option>
                    </select>
                  </div>
                  <div>
                    <label>電壓接線方式: </label>
                    <input 
                      type="text" 
                      value={wiringMethod} 
                      onChange={e => setWiringMethod(e.target.value)} 
                      placeholder="電壓接線方式"
                    />
                  </div>
                </>
              )}
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
                  type="file" 
                  onChange={e => setPhoto(e.target.files[0])} 
                  accept="image/*"
                />
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
          {user.role === 'admin' && (
              <button onClick={() => {/* 顯示用戶管理界面 */}}>管理用戶</button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
