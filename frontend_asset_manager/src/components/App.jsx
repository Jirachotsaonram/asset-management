// src/App.jsx
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
// อาจจะต้องใช้ React Router สำหรับจัดการเส้นทางจริง

function App() {
  // ตัวอย่างการแสดงผล:
  // หากไม่มี user ใน Local Storage ให้แสดง LoginPage
  // หากมี user อยู่แล้ว ให้แสดง Dashboard
  
  const user = localStorage.getItem('user');

  return (
    <div className="App">
      {user ? <Dashboard /> : <LoginPage />}
    </div>
  )
}

export default App;