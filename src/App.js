import "./App.css";
import { useState, useEffect } from "react";
import Axios from "axios";

// 打开或创建 IndexedDB 数据库
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('imageDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('images', { keyPath: 'id', autoIncrement: true });
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};

// 将图像文件存储在 IndexedDB 中
const storeImage = async (imageId, imageFile) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readwrite');
  const store = transaction.objectStore('images');
  store.put({ id: imageId, file: imageFile });
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};

// 从 IndexedDB 中获取图像文件
const getImage = async (imageId) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readonly');
  const store = transaction.objectStore('images');
  const request = store.get(imageId);
  return new Promise((resolve, reject) => {
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

// 从 IndexedDB 中删除图像文件
const deleteImage = async (imageId) => {
  const db = await openDB();
  const transaction = db.transaction('images', 'readwrite');
  const store = transaction.objectStore('images');
  store.delete(imageId);
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = (event) => reject(event.target.error);
  });
};

// 上传图片到 Imgur 并返回图片的 URL
const uploadImage = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  try {
    const response = await Axios.post("https://api.imgur.com/3/image", formData, {
      headers: {
        Authorization: "Bearer 85f1906ae12283d2daa9e5d96472ae4274ae7374", // 使用私人Access Token上传
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("Image URL:", response.data.data.link);
    return response.data.data.link;
  } catch (error) {
    console.error("Error uploading image:", error);
    return null; // 返回 null 表示上传失败
  }
};

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [wage, setWage] = useState(0);
  const [photo, setPhoto] = useState(null); // 照片文件状态
  const [newWage, setNewWage] = useState(0);
  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const baseURL = "https://servertest1-e5f153f6ef40.herokuapp.com"; // 后端 API 的基础 URL

  // 添加员工信息并将照片上传到 Imgur（照片可选）
  const addEmployee = async () => {
    let imageUrl = "";
    let imageId = null;

    if (photo) {
      imageId = Date.now(); // 使用时间戳或其他唯一 ID
      await storeImage(imageId, photo); // 将图片文件存储在 IndexedDB
      imageUrl = await uploadImage(photo);
      if (!imageUrl) {
        console.log("Image upload failed, will store locally for later retry.");
      } else {
        await deleteImage(imageId); // 上传成功后删除 IndexedDB 中的图片
        imageId = null; // 上传成功后清除本地存储的图片 ID
      }
    }

    const employeeData = { name, age, country, position, wage, photo: imageUrl, photoFileId: imageId };
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

  // 同步本地存储的待处理请求
  const syncPendingRequests = async () => {
    console.log("sync run");
    let pendingCreates = JSON.parse(localStorage.getItem("pendingCreates")) || [];
    let pendingUpdates = JSON.parse(localStorage.getItem("pendingUpdates")) || [];
  
    const syncData = async (data, endpoint, type) => {
      for (const item of data) {
        try {
          if (type === "create") {
            // 如果没有照片但有本地存储的照片文件，则尝试上传
            if (!item.photo && item.photoFileId) {
              const image = await getImage(item.photoFileId);
              const imageUrl = await uploadImage(image.file);
              if (imageUrl) {
                item.photo = imageUrl;
                item.photoFileId = null; // 上传成功后删除本地存储的照片 ID
                await deleteImage(image.photoFileId); // 删除 IndexedDB 中的图片
              }
            }
            await Axios.post(`${baseURL}/${endpoint}`, item);
          } else {
            await Axios.put(`${baseURL}/${endpoint}`, item);
          }
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
