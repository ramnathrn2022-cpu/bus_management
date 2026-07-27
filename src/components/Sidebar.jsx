import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bus as BusIcon, 
  Users as DriversIcon, 
  Ticket as TicketIcon,
  ShieldAlert,
  ChevronLeft,
  Settings,
  HelpCircle,
  BarChart3,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { getRole } from '../utils/token';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const role = getRole();

  if (!role) return null;

  const coreLinks = [];
  const supportLinks = [
    { to: '#', label: 'System Settings', icon: <Settings className="h-4.5 w-4.5" /> },
    { to: '#', label: 'Support Desk', icon: <HelpCircle className="h-4.5 w-4.5" /> }
  ];

  if (role === 'owner') {
    coreLinks.push(
      { to: '/owner', label: 'Command Tower', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { to: '/buses', label: 'Manage Fleet', icon: <BusIcon className="h-4.5 w-4.5" /> },
      { to: '/drivers', label: 'Manage Drivers', icon: <DriversIcon className="h-4.5 w-4.5" /> }
    );
  } else if (role === 'manager') {
    coreLinks.push(
      { to: '/manager', label: 'Operations Panel', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { to: '/buses', label: 'Manage Fleet', icon: <BusIcon className="h-4.5 w-4.5" /> },
      { to: '/drivers', label: 'Drivers Registry', icon: <DriversIcon className="h-4.5 w-4.5" /> }
    );
  } else if (role === 'user') {
    coreLinks.push(
      { to: '/user', label: 'Traveler Dashboard', icon: <LayoutDashboard className="h-4.5 w-4.5" /> },
      { to: '/buses', label: 'Search Buses', icon: <BusIcon className="h-4.5 w-4.5" /> },
      { to: '/my-tickets', label: 'My Bookings', icon: <TicketIcon className="h-4.5 w-4.5" /> }
    );
  } else if (role === 'driver') {
    coreLinks.push(
      { to: '/driver', label: 'My Shift Duty', icon: <BusIcon className="h-4.5 w-4.5" /> }
    );
  }

  const getRoleBadge = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'manager': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'driver': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <aside 
      className={`fixed md:sticky top-[67px] left-0 z-40 h-[calc(100vh-67px)] w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 select-none ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="space-y-7">
        
        {/* Core Links */}
        <div className="space-y-3.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block px-4">
            Navigation Menu
          </span>
          <nav className="flex flex-col gap-1">
            {coreLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/owner' || link.to === '/manager' || link.to === '/user' || link.to === '/driver'}
                onClick={() => { if (window.innerWidth < 768) toggleSidebar(); }}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${
                    isActive
                      ? 'bg-slate-800 border-slate-700 text-white border-l-3 border-l-rose-500'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`
                }
              >
                {React.cloneElement(link.icon, { className: 'h-4 w-4 flex-shrink-0' })}
                <span>{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Mock Support Pages */}
        <div className="space-y-3.5">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block px-4">
            Fleet Operations
          </span>
          <nav className="flex flex-col gap-1">
            {supportLinks.map((link, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold text-slate-600 cursor-not-allowed select-none"
                title="Available in corporate tier"
              >
                {React.cloneElement(link.icon, { className: 'h-4 w-4 flex-shrink-0' })}
                <span>{link.label}</span>
              </div>
            ))}
          </nav>
        </div>

      </div>

      {/* Roster Badge Footer */}
      <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex items-center justify-between text-xs text-slate-400">
        <div className="flex flex-col gap-0.5">
          <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold">Authorized Session</span>
          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 border rounded-full mt-1 ${getRoleBadge(role)}`}>
            {role} Roster
          </span>
        </div>
        <button 
          onClick={toggleSidebar} 
          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

    </aside>
  );
};

export default Sidebar;
