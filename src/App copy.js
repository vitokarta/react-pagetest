import "./App.css";
import { useState } from "react";
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

  const addEmployee = () => {
    Axios.post("http://localhost:3001/create", {
      name: name,
      age: age,
      country: country,
      position: position,
      wage: wage,
    }).then(() => {
      setEmployeeList([
        ...employeeList,
        {
          name: name,
          age: age,
          country: country,
          position: position,
          wage: wage,
        },
      ]);
    });
  };

  const getEmployees = () => {
    Axios.get("http://localhost:3001/employees").then((response) => {
      console.log(response.data); // 打印数据到控制台
      setEmployeeList(response.data);
    });
  };

  const updateEmployeeWage = (id) => {
    Axios.put("http://localhost:3001/update", { wage: newWage, id: id }).then(
      (response) => {
        setEmployeeList(
          employeeList.map((val) => {
            return val.id == id
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
      }
    );
  };

  const deleteEmployee = (id) => {
    Axios.delete(`http://localhost:3001/delete/${id}`).then((response) => {
      setEmployeeList(
        employeeList.filter((val) => {
          return val.id != id;
        })
      );
    });
  };

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
            const employee = employeeList.find((emp) => emp.id == event.target.value);
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
              <button onClick={updateEmployeeWage}>Update</button>
              <button onClick={deleteEmployee}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
