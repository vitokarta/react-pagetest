import "./App.css";
import { useState, useEffect } from "react";
import Axios from "axios";

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [wage, setWage] = useState(0);

  const [newWage, setNewWage] = useState(0);

  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const baseURL = "https://servertest1-e5f153f6ef40.herokuapp.com";

  // 添加員工函數
  const addEmployee = () => {
    const employeeData = {
      name: name,
      age: age,
      country: country,
      position: position,
      wage: wage,
    };

    // 將資料儲存到本地儲存
    let pendingRequests = JSON.parse(localStorage.getItem('pendingRequests')) || [];
    pendingRequests.push(employeeData);
    localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

    // 嘗試發送請求到伺服器
    Axios.post(`${baseURL}/create`, employeeData)
      .then(() => {
        setEmployeeList([
          ...employeeList,
          employeeData,
        ]);
        // 清除本地儲存中的已成功發送的資料
        pendingRequests = pendingRequests.filter(emp => emp !== employeeData);
        localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
      })
      .catch(() => {
        // 若請求失敗，則保持資料在本地儲存中
        console.log('Failed to add employee. Will retry later.');
      });
  };

  // 獲取員工函數
  const getEmployees = () => {
    Axios.get(`${baseURL}/employees`).then((response) => {
      console.log(response.data);
      setEmployeeList(response.data);
    });
  };

  // 更新員工薪資函數
  const updateEmployeeWage = (id) => {
    const updatedEmployeeData = { wage: newWage, id: id };

    // 將更新請求儲存到本地儲存
    let pendingRequests = JSON.parse(localStorage.getItem('pendingRequests')) || [];
    pendingRequests.push(updatedEmployeeData);
    localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));

    // 嘗試發送更新請求到伺服器
    Axios.put(`${baseURL}/update`, updatedEmployeeData).then(
      (response) => {
        setEmployeeList(
          employeeList.map((val) => {
            return val.id === id
              ? {
                  id: val.id,
                  name: val.name,
                  country: val.country,
                  age: val.age,
                  position: val.position,
                  wage: newWage,
                }
              : val;
          })
        );
        // 清除本地儲存中的已成功發送的資料
        pendingRequests = pendingRequests.filter(emp => emp !== updatedEmployeeData);
        localStorage.setItem('pendingRequests', JSON.stringify(pendingRequests));
      }
    ).catch(() => {
      // 若請求失敗，則保持資料在本地儲存中
      console.log('Failed to update employee wage. Will retry later.');
    });
  };

  // 刪除員工函數
  const deleteEmployee = (id) => {
    Axios.delete(`${baseURL}/delete/${id}`).then((response) => {
      setEmployeeList(
        employeeList.filter((val) => {
          return val.id !== id;
        })
      );
    });
  };

  // 同步待處理的請求
  const syncPendingRequests = () => {
    let pendingRequests = JSON.parse(localStorage.getItem('pendingRequests')) || [];
    
    pendingRequests.forEach(employeeData => {
      if (employeeData.wage) {
        Axios.put(`${baseURL}/update`, employeeData)
          .then(() => {
            let updatedPendingRequests = pendingRequests.filter(emp => emp !== employeeData);
            localStorage.setItem('pendingRequests', JSON.stringify(updatedPendingRequests));
          })
          .catch(() => {
            console.log('Retrying failed sync.');
          });
      } else {
        Axios.post(`${baseURL}/create`, employeeData)
          .then(() => {
            let updatedPendingRequests = pendingRequests.filter(emp => emp !== employeeData);
            localStorage.setItem('pendingRequests', JSON.stringify(updatedPendingRequests));
          })
          .catch(() => {
            console.log('Retrying failed sync.');
          });
      }
    });
  };

  // 在應用程式啟動時同步資料
  useEffect(() => {
    syncPendingRequests();
  }, []);

  return (
    <div className="App">
      <div className="information">
        <label>Name:</label>
        <input
          type="text"
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <label>Age:</label>
        <input
          type="number"
          onChange={(event) => {
            setAge(event.target.value);
          }}
        />
        <label>Country:</label>
        <input
          type="text"
          onChange={(event) => {
            setCountry(event.target.value);
          }}
        />
        <label>Position:</label>
        <input
          type="text"
          onChange={(event) => {
            setPosition(event.target.value);
          }}
        />
        <label>Wage (year):</label>
        <input
          type="number"
          onChange={(event) => {
            setWage(event.target.value);
          }}
        />
        <button onClick={addEmployee}>Add Employee</button>
      </div>
      <div className="employees">
        <button onClick={getEmployees}>Show Employees</button>

        <select
          onChange={(event) => {
            const employee = employeeList.find((emp) => emp.id === event.target.value);
            setSelectedEmployee(employee);
            setNewWage(employee?.wage || 0); // Set the initial value for wage
          }}
        >
          <option value="">Select an Employee</option>
          {employeeList.map((val) => {
            return (
              <option key={val.id} value={val.id}>
                {val.name} - {val.position}
              </option>
            );
          })}
        </select>

        {selectedEmployee && (
          <div className="employee">
            <div>
              <h3>Name: {selectedEmployee.name}</h3>
              <h3>Age: {selectedEmployee.age}</h3>
              <h3>Country: {selectedEmployee.country}</h3>
              <h3>Position: {selectedEmployee.position}</h3>
              <h3>Wage: {selectedEmployee.wage}</h3>
            </div>
            <div>
              <input
                type="text"
                placeholder="2000..."
                value={newWage}
                onChange={(event) => {
                  setNewWage(event.target.value);
                }}
              />
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
