import { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // โหลด theme จาก localStorage
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    // บันทึก theme ลง localStorage
    localStorage.setItem('theme', theme);
    
    // เพิ่ม/ลบ class ที่ html element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setDarkMode = () => setTheme('dark');
  const setLightMode = () => setTheme('light');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setDarkMode, setLightMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};