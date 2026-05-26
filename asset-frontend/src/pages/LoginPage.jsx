import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { Shield, AlertTriangle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import logoImage from '../assets/logo.png';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoginError('');
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      toast.success('เข้าสู่ระบบสำเร็จ');
      navigate('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'การเข้าสู่ระบบด้วย Google ล้มเหลว';
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setLoginError('ไม่สามารถเชื่อมต่อกับ Google ได้');
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
            <div className="inline-block mb-6">
              <img src={logoImage} alt="Asset Management Logo" className="w-40 h-auto object-contain mx-auto drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">ระบบจัดการครุภัณฑ์</h1>
            <p className="text-gray-600 mt-2 text-sm">ภาควิชาเทคโนโลยีสารสนเทศ</p>
          </div>

          {/* Error Message */}
          {loginError && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle size={16} className="flex-shrink-0" />
              {loginError}
            </div>
          )}

          {/* Google Login Button */}
          <div className="flex flex-col gap-3 justify-center mb-4">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                shape="pill"
                size="large"
                text="continue_with"
                locale="th"
              />
            </div>
            
          </div>
          
          {loading && (
            <div className="text-center text-sm text-primary-600 mt-2 flex justify-center items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              กำลังดำเนินการ...
            </div>
          )}

          {/* Security Badge */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <Shield size={16} className="text-success-500" />
              <span>เข้าสู่ระบบอย่างปลอดภัยผ่านบัญชี Google ของคุณ</span>
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