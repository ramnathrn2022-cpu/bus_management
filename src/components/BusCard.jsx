import React from 'react';
import { Bus, MapPin, Ticket, Trash, ShieldCheck } from 'lucide-react';
import { getRole } from '../utils/token';

export const BusCard = ({ bus, onBook, onDelete, onAvailableSeats, bookingCount }) => {
  const role = getRole();

  return (
    <div className="premium-card p-6 flex flex-col justify-between gap-5 bg-white border border-slate-200">
      
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/15">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">{bus.bus_number}</h3>
            <span className="inline-block text-[9px] font-bold text-slate-400 border border-slate-200 bg-slate-50 px-2 py-0.5 rounded uppercase mt-1">
              {bus.total_seats} Total Seats
            </span>
          </div>
        </div>

        {role === 'owner' && onDelete && (
          <button
            onClick={() => onDelete(bus.id)}
            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-rose-100"
            title="Delete Bus"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Card Body - Route info */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold space-y-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-slate-400 mr-1 w-8">From:</span>
          <span className="text-slate-800 capitalize font-extrabold">{bus.source}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
          <span className="text-slate-400 mr-1 w-8">To:</span>
          <span className="text-slate-800 capitalize font-extrabold">{bus.destination}</span>
        </div>
      </div>

      {/* Roster/Issue Stats */}
      {(role === 'owner' || role === 'manager') && bookingCount !== undefined && (
        <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1.5 border-t border-slate-100 pt-3">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-rose-500" /> Issued Passes:</span>
          <span className="font-extrabold text-slate-800">
            {bookingCount} Reserved
          </span>
        </div>
      )}

      {/* Card Actions */}
      <div className="flex gap-2.5 border-t border-slate-100 pt-4">
        {onAvailableSeats && (
          <button
            onClick={() => onAvailableSeats(bus.id)}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-300 bg-white font-bold text-xs uppercase cursor-pointer text-center transition-all"
          >
            Seats Grid
          </button>
        )}

        {role === 'user' && onBook && (
          <button
            onClick={() => onBook(bus.id)}
            className="flex-1 btn-premium-red py-2.5 px-3 rounded-xl font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
          >
            <Ticket className="h-3.5 w-3.5 animate-pulse" />
            Book Now
          </button>
        )}
      </div>

    </div>
  );
};

export default BusCard;
