import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User as UserIcon, Mail, Lock, Shield, Eye, EyeOff, ShieldAlert, CheckCircle, Loader2, Bus } from 'lucide-react';
import authAPI from '../services/authAPI';

export const Register = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const getPasswordValidation = () => {
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      digit: /[0-9]/.test(password),
    };
  };

  const checks = getPasswordValidation();
  const isPasswordValid = checks.length && checks.upper && checks.lower && checks.digit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password || !role) {
      setErrorMsg('Please fill in all registration fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please verify that the password requirements are fully met.');
      return;
    }

    setLoading(true);

    try {
      await authAPI.register({ name, email, password, role });
      setSuccessMsg('Account registered successfully! Loading login gateway...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Registration failed. Check for details or email duplication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative py-12 lg:py-16 overflow-hidden flex items-center justify-center min-h-[calc(100vh-140px)] bg-slate-50 bg-grid-mesh select-none">
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-wrap -mx-4">
          <div className="w-full px-4">
            <div className="max-w-[480px] mx-auto bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 text-center shadow-xl">
              
              {/* Header branding */}
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
                  Create Gateway Profile
                </p>
              </div>

              {/* Feedback Alerts */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs text-left flex items-start gap-3 animate-shake font-semibold">
                  <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs text-left flex items-center gap-3 font-semibold">
                  <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Registration Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name */}
                <div className="relative text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-semibold"
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="relative text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-semibold"
                    />
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400">
                      <Mail className="h-4 w-4" />
                    </div>
                  </div>
                </div>



                {/* Password */}
                <div className="relative text-left">
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3 px-4 pr-12 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-semibold"
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

                {/* Password checklist visual helper */}
                {password.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-[10px] text-left space-y-2.5">
                    <p className="font-extrabold text-slate-400 tracking-wider uppercase">Complexity Requirements</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className={`flex items-center gap-1.5 font-bold ${checks.length ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${checks.upper ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>Uppercase Letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${checks.lower ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>Lowercase Letter</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-bold ${checks.digit ? 'text-emerald-600' : 'text-slate-400'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span>Digit Number</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Register button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || (password.length > 0 && !isPasswordValid)}
                    className="w-full btn-premium-red py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-80"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4.5 w-4.5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      'Register Profile'
                    )}
                  </button>
                </div>
              </form>

              {/* Toggle to Login */}
              <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs font-semibold text-slate-400">
                Already registered?{' '}
                <Link to="/login" className="text-rose-500 hover:text-rose-600 transition-colors">
                  Sign In here
                </Link>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
