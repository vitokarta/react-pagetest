import "./App.css";
import { useState, useEffect } from "react";
import { openDB } from 'idb';

function App() {
  const [name, setName] = useState("");
  const [age, setAge] = useState(0);
  const [country, setCountry] = useState("");
  const [position, setPosition] = useState("");
  const [wage, setWage] = useState(0);
  const [photo, setPhoto] = useState(null);
  const [photoURL, setPhotoURL] = useState(""); // 用來儲存顯示的圖片 URL

  const [newWage, setNewWage] = useState(0);

  const [employeeList, setEmployeeList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const dbName = 'EmployeeDB';

  // 初始化 IndexedDB
  const initDB = async () => {
    const db = await openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        }
      }
    });
    return db;
  };

  const savePhotoToDB = async (file) => {
    const db = await initDB();
    const transaction = db.transaction('photos', 'readwrite');
    const store = transaction.objectStore('photos');

    const reader = new FileReader();
    reader.onload = async () => {
      const data = { file: reader.result };
      await store.add(data);
    };
    reader.readAsDataURL(file);
  };

  const getPhotosFromDB = async () => {
    const db = await initDB();
    const transaction = db.transaction('photos', 'readonly');
    const store = transaction.objectStore('photos');

    const allPhotos = await store.getAll();
    if (allPhotos.length > 0) {
      setPhotoURL(allPhotos[allPhotos.length - 1].file); // 顯示最後一張上傳的圖片
    }
  };

  const addEmployee = () => {
    const employeeData = { name, age, country, position, wage };
    console.log("add");
    let pendingCreates = JSON.parse(localStorage.getItem('pendingCreates')) || [];
    pendingCreates.push(employeeData);
    localStorage.setItem('pendingCreates', JSON.stringify(pendingCreates));

    setEmployeeList([...employeeList, employeeData]);
  };

  useEffect(() => {
    // Initialize the IndexedDB when the component is mounted
    initDB();
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
        <label>Photo:</label>
        <input type="file" onChange={(event) => {
          const file = event.target.files[0];
          setPhoto(file);
          savePhotoToDB(file); // 將照片存到 IndexedDB
        }} />
        <button onClick={addEmployee}>Add Employee</button>
      </div>
      <div className="employees">
        <button onClick={getPhotosFromDB}>Show Last Photo</button> {/* 新增顯示圖片的按鈕 */}
        {photoURL && (
          <div>
            <h3>Last Uploaded Photo:</h3>
            <img src={photoURL} alt="Uploaded" style={{ width: '150px', height: '150px' }} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
