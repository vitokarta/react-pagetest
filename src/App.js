import "./App.css";
import { useState, useEffect } from "react";
import Axios from "axios";

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [wage, setWage] = useState(0);
  const [photo, setPhoto] = useState(null); // 新增照片狀態
  const [photoURL, setPhotoURL] = useState(""); // 用於顯示的照片URL

  const [newWage, setNewWage] = useState(0);

  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const baseURL = "https://servertest1-e5f153f6ef40.herokuapp.com"; // http://localhost:3001/

  const addEmployee = () => {
    const employeeData = { name, age, country, position, wage, photo }; // 包括照片資料
    console.log("add");
    let pendingCreates = JSON.parse(localStorage.getItem('pendingCreates')) || [];
    pendingCreates.push(employeeData);
    localStorage.setItem('pendingCreates', JSON.stringify(pendingCreates));

    const formData = new FormData();
    for (const key in employeeData) {
      formData.append(key, employeeData[key]);
    }

    Axios.post(`${baseURL}/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(() => {
        setEmployeeList([...employeeList, employeeData]);
        pendingCreates = pendingCreates.filter(emp => emp !== employeeData);
        localStorage.setItem('pendingCreates', JSON.stringify(pendingCreates));
      })
      .catch(() => {
        console.log('Failed to add employee. Will retry later.');
      });
  };

  const getEmployees = () => {
    Axios.get(`${baseURL}/employees`).then((response) => {
      console.log(response.data);
      setEmployeeList(response.data);
    });
  };

  const updateEmployeeWage = (id) => {
    const updatedEmployeeData = { wage: newWage, id };

    let pendingUpdates = JSON.parse(localStorage.getItem('pendingUpdates')) || [];
    pendingUpdates.push(updatedEmployeeData);
    localStorage.setItem('pendingUpdates', JSON.stringify(pendingUpdates));

    Axios.put(`${baseURL}/update`, updatedEmployeeData)
      .then(() => {
        setEmployeeList(employeeList.map(val => val.id === id ? { ...val, wage: newWage } : val));
        pendingUpdates = pendingUpdates.filter(emp => emp !== updatedEmployeeData);
        localStorage.setItem('pendingUpdates', JSON.stringify(pendingUpdates));
      })
      .catch(() => {
        console.log('Failed to update employee wage. Will retry later.');
      });
  };

  const deleteEmployee = (id) => {
    Axios.delete(`${baseURL}/delete/${id}`).then(() => {
      setEmployeeList(employeeList.filter(val => val.id !== id));
    });
  };

  const syncPendingRequests = async () => {
    console.log("sync run");
    let pendingCreates = JSON.parse(localStorage.getItem('pendingCreates')) || [];
    let pendingUpdates = JSON.parse(localStorage.getItem('pendingUpdates')) || [];
    
    const syncData = async (data, endpoint, type) => {
      for (const item of data) {
        try {
          const formData = new FormData();
          for (const key in item) {
            formData.append(key, item[key]);
          }

          if (type === 'create') {
            await Axios.post(`${baseURL}/${endpoint}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          } else {
            await Axios.put(`${baseURL}/${endpoint}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
          }
          data = data.filter(emp => emp !== item);
        } catch (error) {
          console.log(`Failed to sync ${type} request. Will retry later.`);
        }
      }
      localStorage.setItem(`pending${type === 'create' ? 'Creates' : 'Updates'}`, JSON.stringify(data));
    };

    await syncData(pendingCreates, 'create', 'create');
    await syncData(pendingUpdates, 'update', 'update');
  };

  const uploadPhoto = () => {
    if (!photo) {
      alert("Please select a photo first.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoURL(reader.result); // 將照片設置為 base64 編碼的 URL 以便顯示
    };
    reader.readAsDataURL(photo);
  };

  useEffect(() => {
    syncPendingRequests();
  }, []);

  return (
    <div className="App">
      <div className="information">
        <label>Name:</label>
        <input type="text" onChange={(event) => setName(event.target.value)} />
        <label>Age:</label>
        <input type="number" onChange={(event) => setAge(event.target.value)} />
        <label>Country:</label>
        <input type="text" onChange={(event) => setCountry(event.target.value)} />
        <label>Position:</label>
        <input type="text" onChange={(event) => setPosition(event.target.value)} />
        <label>Wage (year):</label>
        <input type="number" onChange={(event) => setWage(event.target.value)} />
        <label>Photo:</label> {/* 新增照片欄位 */}
        <input type="file" onChange={(event) => {
          const file = event.target.files[0];
          setPhoto(file); // 設定照片狀態
        }} />
        <button onClick={uploadPhoto}>Upload Photo</button> {/* 新增上傳照片的按鈕 */}
        <button onClick={addEmployee}>Add Employee</button>
      </div>
      <div className="employees">
        <button onClick={getEmployees}>Show Employees</button>
        <select onChange={(event) => {
          const employee = employeeList.find((emp) => emp.id == event.target.value);
          setSelectedEmployee(employee);
          setNewWage(employee?.wage || 0);
        }}>
          <option value="">Select an Employee</option>
          {employeeList.map((val) => (
            <option key={val.id} value={val.id}>{val.name} - {val.position}</option>
          ))}
        </select>
        {selectedEmployee && (
          <div className="employee">
            <div>
              <h3>Name: {selectedEmployee.name}</h3>
              <h3>Age: {selectedEmployee.age}</h3>
              <h3>Country: {selectedEmployee.country}</h3>
              <h3>Position: {selectedEmployee.position}</h3>
              <h3>Wage: {selectedEmployee.wage}</h3>
              {photoURL && ( // 顯示照片
                <img src={photoURL} alt={`${selectedEmployee.name}'s photo`} />
              )}
            </div>
            <div>
              <input type="number" value={newWage} onChange={(event) => setNewWage(event.target.value)} />
              <button onClick={() => updateEmployeeWage(selectedEmployee.id)}>Update</button>
              <button onClick={() => deleteEmployee(selectedEmployee.id)}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
