import "./App.css";
import { useState, useEffect } from "react";
import Axios from "axios";

// 將文件轉換為 Base64 格式
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [wage, setWage] = useState(0);
  const [photo, setPhoto] = useState(null); // 照片文件狀態
  const [newWage, setNewWage] = useState(0);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const baseURL = "https://servertest1-e5f153f6ef40.herokuapp.com"; // 後端 API 的基礎 URL

  // 上傳圖片到 Imgur 並返回圖片的 URL
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await Axios.post("https://api.imgur.com/3/image", formData, {
        headers: {
          Authorization: "Bearer 85f1906ae12283d2daa9e5d96472ae4274ae7374", // 使用私人 Access Token 上傳
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Image URL:", response.data.data.link);
      return response.data.data.link;
    } catch (error) {
      console.error("Error uploading image:", error);

      // 將未成功上傳的圖片存儲在本地
      const base64Image = await fileToBase64(file);
      const pendingImages = JSON.parse(localStorage.getItem("pendingImages")) || [];
      pendingImages.push({ fileName: file.name, fileData: base64Image });
      localStorage.setItem("pendingImages", JSON.stringify(pendingImages));

      return ""; // 返回空字符串表示上傳失敗
    }
  };

  // 添加員工信息並將照片上傳到 Imgur（照片可選）
  const addEmployee = async () => {
    let imageUrl = "";
    if (photo) {
      imageUrl = await uploadImage(photo); // 如果有照片則上傳圖片並獲取 URL
    }

    const employeeData = { name, age, country, position, wage, photo: imageUrl };
    console.log(employeeData);
    let pendingCreates = JSON.parse(localStorage.getItem("pendingCreates")) || [];
    pendingCreates.push(employeeData);
    localStorage.setItem("pendingCreates", JSON.stringify(pendingCreates));

    Axios.post(`${baseURL}/create`, employeeData)
      .then(() => {
        setEmployeeList([...employeeList, employeeData]);
        pendingCreates = pendingCreates.filter((emp) => emp !== employeeData);
        localStorage.setItem("pendingCreates", JSON.stringify(pendingCreates));
      })
      .catch(() => {
        console.log("Failed to add employee. Will retry later.");
      });
  };

  const getEmployees = () => {
    Axios.get(`${baseURL}/employees`).then((response) => {
      setEmployeeList(response.data);
    });
  };

  const updateEmployeeWage = (id) => {
    const updatedEmployeeData = { wage: newWage, id };

    let pendingUpdates = JSON.parse(localStorage.getItem("pendingUpdates")) || [];
    pendingUpdates.push(updatedEmployeeData);
    localStorage.setItem("pendingUpdates", JSON.stringify(pendingUpdates));

    Axios.put(`${baseURL}/update`, updatedEmployeeData)
      .then(() => {
        setEmployeeList(
          employeeList.map((val) =>
            val.id === id ? { ...val, wage: newWage } : val
          )
        );
        pendingUpdates = pendingUpdates.filter(
          (emp) => emp !== updatedEmployeeData
        );
        localStorage.setItem(
          "pendingUpdates",
          JSON.stringify(pendingUpdates)
        );
      })
      .catch(() => {
        console.log("Failed to update employee wage. Will retry later.");
      });
  };

  const deleteEmployee = (id) => {
    Axios.delete(`${baseURL}/delete/${id}`).then(() => {
      setEmployeeList(
        employeeList.filter((val) => val.id !== id)
      );
    });
  };

  useEffect(() => {
    syncPendingRequests();
  }, []);

  // 同步本地存儲的待處理請求
  const syncPendingRequests = async () => {
    console.log("sync run");
    let pendingCreates = JSON.parse(localStorage.getItem("pendingCreates")) || [];
    let pendingUpdates = JSON.parse(localStorage.getItem("pendingUpdates")) || [];
    let pendingImages = JSON.parse(localStorage.getItem("pendingImages")) || [];

    // 同步圖片上傳請求
    for (const image of pendingImages) {
      try {
        const blob = await (await fetch(image.fileData)).blob(); // 轉換 Base64 為 Blob
        const file = new File([blob], image.fileName); // 創建 File 對象
        const imageUrl = await uploadImage(file); // 重新上傳圖片

        if (imageUrl) {
          pendingImages = pendingImages.filter((img) => img !== image); // 上傳成功後移除本地暫存
          pendingCreates = pendingCreates.map((emp) =>
            emp.photo === "" ? { ...emp, photo: imageUrl } : emp
          );
        }
      } catch (error) {
        console.log("Failed to re-upload image. Will retry later.");
      }
    }

    localStorage.setItem("pendingImages", JSON.stringify(pendingImages));
    localStorage.setItem("pendingCreates", JSON.stringify(pendingCreates));

    const syncData = async (data, endpoint, type) => {
      for (const item of data) {
        try {
          await Axios.post(`${baseURL}/${endpoint}`, item);
          data = data.filter((emp) => emp !== item);
        } catch (error) {
          console.log(`Failed to sync ${type} request. Will retry later.`);
        }
      }
      localStorage.setItem(`pending${type === "create" ? "Creates" : "Updates"}`, JSON.stringify(data));
    };

    await syncData(pendingCreates, "create", "create");
    await syncData(pendingUpdates, "update", "update");
  };

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
        <label>Photo (optional):</label>
        <input type="file" onChange={(event) => setPhoto(event.target.files[0])} />
        <button onClick={addEmployee}>Add Employee</button>
      </div>
      <div className="employees">
        <button onClick={getEmployees}>Show Employees</button>
        <select onChange={(event) => {
          const employee = employeeList.find((emp) => emp.id == parseInt(event.target.value));
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
              {selectedEmployee.photo && (
                <img src={selectedEmployee.photo} alt={`${selectedEmployee.name}'s photo`} style={{ width: "100px", height: "100px" }} />
              )}
            </div>
            <div>
              <input type="number" placeholder="New Wage..." onChange={(event) => setNewWage(event.target.value)} />
              <button onClick={() => updateEmployeeWage(selectedEmployee.id)}>Update Wage</button>
              <button onClick={() => deleteEmployee(selectedEmployee.id)}>Delete Employee</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
