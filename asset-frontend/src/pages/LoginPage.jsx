import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Lock, User, LogIn, Eye, EyeOff, Shield, Package, AlertTriangle } from 'lucide-react';
import logoImage from './logoFITM.png';

// ==================== Security: Client-side rate limiting ====================
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in ms
const STORAGE_KEY = 'login_attempts';

function getLoginAttempts() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    // Clear expired lockout
    if (data.lockUntil && Date.now() > data.lockUntil) {
      localStorage.removeItem(STORAGE_KEY);
      return { count: 0, lockUntil: null };
    }
    return { count: data.count || 0, lockUntil: data.lockUntil || null };
  } catch { return { count: 0, lockUntil: null }; }
}

function recordFailedAttempt() {
  const data = getLoginAttempts();
  const newCount = data.count + 1;
  const lockUntil = newCount >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : null;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ count: newCount, lockUntil }));
  return { count: newCount, lockUntil };
}

function resetLoginAttempts() {
  localStorage.removeItem(STORAGE_KEY);
}

// ==================== Input sanitization ====================
function sanitizeInput(input) {
  return input.replace(/[<>"'/\\]/g, '').trim();
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();
  const lockTimerRef = useRef(null);

  // Check lockout on mount
  useEffect(() => {
    checkLockout();
    return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current); };
  }, []);

  const checkLockout = useCallback(() => {
    const { lockUntil } = getLoginAttempts();
    if (lockUntil && Date.now() < lockUntil) {
      setIsLocked(true);
      startCountdown(lockUntil);
    } else {
      setIsLocked(false);
      setLockCountdown(0);
    }
  }, []);

  const startCountdown = (lockUntil) => {
    if (lockTimerRef.current) clearInterval(lockTimerRef.current);
    const update = () => {
      const remaining = Math.max(0, lockUntil - Date.now());
      if (remaining <= 0) {
        setIsLocked(false);
        setLockCountdown(0);
        resetLoginAttempts();
        clearInterval(lockTimerRef.current);
      } else {
        setLockCountdown(Math.ceil(remaining / 1000));
      }
    };
    update();
    lockTimerRef.current = setInterval(update, 1000);
  };

  const formatCountdown = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Check lockout
    const { lockUntil } = getLoginAttempts();
    if (lockUntil && Date.now() < lockUntil) {
      setIsLocked(true);
      startCountdown(lockUntil);
      return;
    }

    const cleanUsername = sanitizeInput(username);
    if (!cleanUsername) { setLoginError('กรุณากรอกชื่อผู้ใช้'); return; }
    if (!password) { setLoginError('กรุณากรอกรหัสผ่าน'); return; }
    if (password.length < 6) { setLoginError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }

    setLoading(true);
    try {
      await login({ username: cleanUsername, password });
      resetLoginAttempts();
      toast.success('เข้าสู่ระบบสำเร็จ');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
      const status = error.response?.status;

      if (status === 429) {
        // Rate limited by server
        setLoginError('คุณลองเข้าสู่ระบบมากเกินไป กรุณารอสักครู่');
        const serverData = recordFailedAttempt();
        if (serverData.lockUntil) { setIsLocked(true); startCountdown(serverData.lockUntil); }
      } else {
        const attempt = recordFailedAttempt();
        const remaining = MAX_ATTEMPTS - attempt.count;
        if (attempt.lockUntil) {
          setIsLocked(true);
          startCountdown(attempt.lockUntil);
          setLoginError(`ถูกล็อก! ลองเข้าสู่ระบบมากเกินไป กรุณารอ ${Math.ceil(LOCKOUT_DURATION / 60000)} นาที`);
        } else if (remaining <= 2) {
          setLoginError(`${msg} (เหลืออีก ${remaining} ครั้ง)`);
        } else {
          setLoginError(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-primary-600/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-primary-500/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/20">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <img src={logoImage} alt="Asset Management Logo" className="w-20 h-20 object-contain mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการครุภัณฑ์</h1>
            <p className="text-gray-600 mt-2 text-sm">ภาควิชาเทคโนโลยีสารสนเทศ</p>
          </div>

          {/* Lockout Warning */}
          {isLocked && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="text-sm font-semibold text-red-700">บัญชีถูกล็อกชั่วคราว</p>
                <p className="text-xs text-red-600 mt-1">
                  เข้าสู่ระบบผิดเกินจำนวนที่กำหนด<br />
                  กรุณารอ <span className="font-mono font-bold">{formatCountdown(lockCountdown)}</span> แล้วลองอีกครั้ง
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {loginError && !isLocked && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              {loginError}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผู้ใช้</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input type="text" value={username}
                  onChange={(e) => { setUsername(e.target.value); setLoginError(''); }}
                  disabled={isLocked}
                  className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 disabled:opacity-50"
                  placeholder="กรอกชื่อผู้ใช้" autoComplete="username" maxLength={50} />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รหัสผ่าน</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => { setPassword(e.target.value); setLoginError(''); }}
                  disabled={isLocked}
                  className="block w-full pl-12 pr-12 py-3.5 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-gray-900 placeholder-gray-400 disabled:opacity-50"
                  placeholder="กรอกรหัสผ่าน" autoComplete="current-password" maxLength={128} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
                <span className="text-sm text-gray-600">จดจำฉัน</span>
              </label>
            </div>

            {/* Submit Button */}
            <button type="submit" disabled={loading || isLocked}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white py-4 px-6 rounded-xl font-semibold shadow-lg shadow-primary-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>กำลังเข้าสู่ระบบ...</span>
                </div>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Shield size={16} className="text-success-500" />
              <span>การเชื่อมต่อมีความปลอดภัย</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          © {new Date().getFullYear()} Asset Management System
        </p>
      </div>
    </div>
  );
}