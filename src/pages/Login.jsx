import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, CheckCircle, Eye, EyeOff, Loader2, Bus } from 'lucide-react';
import authAPI from '../services/authAPI';
import { setToken, setRole, setUserId, getToken } from '../utils/token';

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (location.state?.message) {
      setErrorMsg(location.state.message);
    }
    
    // Redirect if already logged in
    const token = getToken();
    if (token) {
      const savedRole = localStorage.getItem('role');
      if (savedRole) {
        navigate(`/${savedRole.toLowerCase()}`, { replace: true });
      }
    }
  }, [location, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.login({ email, password });
      setToken(data.access_token);
      setRole(data.role);
      setUserId(data.user_id);
      
      setSuccessMsg('Authentication successful! Dispatching session...');
      
      const normalizedRole = data.role.toLowerCase();
      setTimeout(() => {
        if (normalizedRole === 'owner') {
          navigate('/owner');
        } else if (normalizedRole === 'user') {
          navigate('/user');
        } else if (normalizedRole === 'driver') {
          navigate('/driver');
        } else {
          navigate('/manager');
        }
      }, 800);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Invalid credentials or connection issue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-20 lg:py-[100px] overflow-hidden flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50 bg-grid-mesh select-none">
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-wrap -mx-4">
          <div className="w-full px-4">
            <div className="max-w-[480px] mx-auto bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-xl">
              
              {/* Logo / Title */}
              <div className="mb-8 text-center flex flex-col items-center">
                <Link to="/" className="flex items-center gap-2.5 group">
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-md shadow-rose-600/10">
                    <Bus className="h-5 w-5" />
                  </div>
                  <span className="text-lg font-black tracking-tight text-slate-800 uppercase">
                    BUS MANAGEMENT <span className="text-rose-500">SYSTEM</span>
                  </span>
                </Link>
                <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wider">
                  Secure Portal Login
                </p>
              </div>

              {/* Error Alert Box */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs text-left flex items-start gap-3 animate-shake font-semibold">
                  <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Alert Box */}
              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs text-left flex items-center gap-3 font-semibold">
                  <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div className="relative text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-semibold"
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="relative text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3.5 px-4 pr-12 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-premium-red py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-80"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Verifying Credentials...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </div>
              </form>

              {/* Footer */}
              <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs font-semibold text-slate-400">
                New user?{' '}
                <Link to="/register" className="text-rose-500 hover:text-rose-600 transition-colors">
                  Create a new account
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
