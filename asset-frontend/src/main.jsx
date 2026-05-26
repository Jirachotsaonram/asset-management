import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { GoogleOAuthProvider } from '@react-oauth/google';

// ตรวจสอบและ Redirect อัตโนมัติถ้ามีคนเข้าผ่าน IP เปล่าๆ
if (window.location.hostname === '202.44.47.45') {
  window.location.hostname = '202.44.47.45.nip.io';
}

const savedFont = localStorage.getItem('app_font') || 'Prompt';
document.documentElement.style.setProperty('--app-font', `"${savedFont}"`);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="120709720620-5a7p2caf9pihnqimn9oj963odmag9o3k.apps.googleusercontent.com">
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);