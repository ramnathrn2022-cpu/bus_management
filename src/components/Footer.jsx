import React from 'react';
import { Link } from 'react-router-dom';
import { Bus, Mail, Phone, MapPin, Heart, Shield } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 text-xs border-t border-slate-800 pt-12 pb-6 select-none mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Footer Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 text-white">
                <Bus className="h-5 w-5" />
              </div>
              <span className="text-base font-extrabold text-white tracking-wider">
                BUS MANAGEMENT SYSTEM
              </span>
            </div>
            <p className="text-slate-500 font-medium leading-relaxed">
              India's leading transit booking and enterprise fleet tracking platform, enabling seamless travel for millions every day.
            </p>
          </div>

          {/* Quick Links Col */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Book & Manage</h4>
            <div className="flex flex-col gap-2 font-semibold">
              <Link to="/buses" className="hover:text-white transition-colors">Search Active Buses</Link>
              <Link to="/my-tickets" className="hover:text-white transition-colors">My Reservation Passes</Link>
              <Link to="/login" className="hover:text-white transition-colors">Operator Login Gateway</Link>
              <Link to="/register" className="hover:text-white transition-colors">Create Account Profile</Link>
            </div>
          </div>

          {/* Core Services */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Fleet Solutions</h4>
            <div className="flex flex-col gap-2 font-semibold text-slate-500">
              <span className="hover:text-white cursor-pointer transition-colors">Real-Time GPS Tracking</span>
              <span className="hover:text-white cursor-pointer transition-colors">Automated Driver Roster</span>
              <span className="hover:text-white cursor-pointer transition-colors">Fuel & Maintenance Logs</span>
              <span className="hover:text-white cursor-pointer transition-colors">Command Analytics Portal</span>
            </div>
          </div>

          {/* Contact Col */}
          <div className="space-y-3.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Help Desk & Hubs</h4>
            <div className="space-y-2 font-semibold">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-rose-500" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-rose-500" />
                <span>support@busmanagementsystem.com</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span>Transit Command Hub, Bangalore, India</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 font-semibold">
          <p>&copy; {new Date().getFullYear()} Bus Management System. All rights reserved.</p>
          
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-slate-800 text-rose-500">
            <Shield className="h-3.5 w-3.5" />
            <span>Enterprise Security Enabled</span>
          </div>

          <p className="flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-rose-500 fill-rose-500" /> for smart travelers
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
