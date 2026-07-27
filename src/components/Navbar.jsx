import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bus, LogOut, User as UserIcon, Menu, X, ChevronDown, Ticket, Users, MapPin, BarChart3, HelpCircle, Mail } from 'lucide-react';
import { getRole, clearAuth, getUserId } from '../utils/token';

export const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();
  const userId = getUserId();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'manager': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'driver': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'user': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default: return 'bg-slate-700/20 text-slate-300 border-slate-600/30';
    }
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 text-white select-none backdrop-blur-md bg-opacity-95 shadow-md">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16.5">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white shadow-lg shadow-rose-600/20 group-hover:scale-105 transition-transform">
                <Bus className="h-5.5 w-5.5" />
              </div>
              <span className="text-lg font-extrabold tracking-tight text-white uppercase sm:block">
                BUS MANAGEMENT <span className="text-rose-500">SYSTEM</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1.5 text-sm font-semibold text-slate-300">
              <Link to="/" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all">
                Home
              </Link>

              {role === 'user' && (
                <>
                  <Link to="/buses" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5">
                    <Ticket className="h-4 w-4 text-rose-400" /> Book Tickets
                  </Link>
                  <Link to="/my-tickets" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all">
                    My Bookings
                  </Link>
                </>
              )}

              {role && role !== 'user' && (
                <>
                  {(role === 'owner' || role === 'manager') && (
                    <>
                      <Link to="/buses" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5">
                        <Bus className="h-4 w-4 text-rose-400" /> Fleet Management
                      </Link>
                      <Link to="/drivers" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-rose-400" /> Driver Management
                      </Link>
                    </>
                  )}
                  {role === 'driver' && (
                    <Link to="/driver" className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all">
                      My Duty
                    </Link>
                  )}
                </>
              )}

              <button onClick={() => scrollToSection('tracking-section')} className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5 cursor-pointer">
                <MapPin className="h-4 w-4 text-rose-400" /> Track Bus
              </button>

              <button onClick={() => scrollToSection('reports-section')} className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all flex items-center gap-1.5 cursor-pointer">
                <BarChart3 className="h-4 w-4 text-rose-400" /> Reports
              </button>

              <button onClick={() => scrollToSection('about-section')} className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer">
                About Us
              </button>
              
              <button onClick={() => scrollToSection('contact-section')} className="px-3.5 py-2 rounded-xl hover:text-white hover:bg-slate-800/50 transition-all cursor-pointer">
                Contact
              </button>
            </div>
          </div>

          {/* Desktop Right Side Controls */}
          <div className="hidden lg:flex items-center gap-4">
            {role ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/80 transition-all text-sm font-semibold cursor-pointer group"
                >
                  <UserIcon className="h-4 w-4 text-slate-400 group-hover:text-white" />
                  <span>ID #{userId}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${getRoleColor(role)}`}>
                    {role}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2.5 text-xs font-semibold animate-fade-in z-50">
                    <div className="px-3.5 py-2.5 border-b border-slate-800 mb-2">
                      <p className="text-slate-500 uppercase tracking-widest text-[9px] font-bold">Authorized Account</p>
                      <p className="text-white text-sm font-bold truncate mt-0.5">User Profile #{userId}</p>
                    </div>
                    
                    <Link
                      to={role === 'owner' ? '/owner' : role === 'manager' ? '/manager' : role === 'driver' ? '/driver' : '/user'}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    >
                      <UserIcon className="h-4 w-4 text-slate-400" />
                      Dashboard Tower
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition-colors mt-1 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out Account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2.5 rounded-xl hover:bg-slate-800 text-sm font-semibold text-slate-300 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20 transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900 px-4 py-4 space-y-3.5 text-sm font-bold animate-fade-in">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800">
            Home
          </Link>

          {role === 'user' && (
            <>
              <Link to="/buses" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800 text-rose-400">
                Book Tickets
              </Link>
              <Link to="/my-tickets" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800">
                My Bookings
              </Link>
            </>
          )}

          {role && role !== 'user' && (
            <>
              {(role === 'owner' || role === 'manager') && (
                <>
                  <Link to="/buses" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800">
                    Fleet Management
                  </Link>
                  <Link to="/drivers" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800">
                    Driver Management
                  </Link>
                </>
              )}
              {role === 'driver' && (
                <Link to="/driver" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 rounded-xl hover:bg-slate-800">
                  My Duty
                </Link>
              )}
            </>
          )}

          <button onClick={() => scrollToSection('tracking-section')} className="w-full text-left block px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            Track Bus
          </button>
          <button onClick={() => scrollToSection('reports-section')} className="w-full text-left block px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            Reports
          </button>
          <button onClick={() => scrollToSection('about-section')} className="w-full text-left block px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            About Us
          </button>
          <button onClick={() => scrollToSection('contact-section')} className="w-full text-left block px-4 py-2.5 rounded-xl hover:bg-slate-800 cursor-pointer">
            Contact
          </button>

          <div className="border-t border-slate-800 pt-3.5 mt-2 flex flex-col gap-2.5">
            {role ? (
              <>
                <div className="px-4 py-2 flex items-center justify-between text-xs text-slate-400">
                  <span>User ID Reference #{userId}</span>
                  <span className={`text-[10px] uppercase font-extrabold tracking-widest px-2 py-0.5 rounded-full border ${getRoleColor(role)}`}>
                    {role}
                  </span>
                </div>
                <Link
                  to={role === 'owner' ? '/owner' : role === 'manager' ? '/manager' : role === 'driver' ? '/driver' : '/user'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-center"
                >
                  Dashboard Tower
                </Link>
                <button
                  onClick={handleLogout}
                  className="block px-4 py-2.5 rounded-xl bg-rose-950/20 border border-rose-900/30 text-rose-400 text-center cursor-pointer"
                >
                  Sign Out Account
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl bg-rose-600 text-white text-center shadow-lg"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
