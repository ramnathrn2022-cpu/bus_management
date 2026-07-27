import React from 'react';
import { ShieldCheck, Phone, Key, Bus, Trash } from 'lucide-react';
import { getRole } from '../utils/token';

export const DriverCard = ({ driver, busNumber, onRemove, onAssignClick }) => {
  const role = getRole();

  return (
    <div className="premium-card p-6 flex flex-col justify-between gap-5 bg-white border border-slate-200">
      
      {/* Card Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/15">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">Operator ID: {driver.id}</h3>
            <span className="text-[9px] font-bold text-slate-400 block mt-1 uppercase tracking-wider">
              System Ref: #{driver.user_id}
            </span>
          </div>
        </div>

        {role === 'owner' && onRemove && (
          <button
            onClick={() => onRemove(driver.id)}
            className="p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-rose-100"
            title="Remove Driver"
          >
            <Trash className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Roster Details */}
      <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 text-xs font-semibold space-y-3">
        <div className="flex items-center gap-2.5">
          <Key className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
          <span className="text-slate-400 w-16">License ID:</span>
          <span className="text-slate-800 font-mono font-extrabold">{driver.license_number}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Phone className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
          <span className="text-slate-400 w-16">Contact No:</span>
          <span className="text-slate-800 font-extrabold">{driver.phone}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Bus className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-slate-400 w-16">Duty Vehicle:</span>
          {driver.assigned_bus_id ? (
            <span className="inline-block text-[9px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded uppercase">
              Bus {busNumber || `#${driver.assigned_bus_id}`}
            </span>
          ) : (
            <span className="inline-block text-[9px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded uppercase">
              Standby Status
            </span>
          )}
        </div>
      </div>

      {/* Roster Actions */}
      {role === 'owner' && onAssignClick && (
        <div className="border-t border-slate-100 pt-4 mt-1">
          <button
            onClick={() => onAssignClick(driver)}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 hover:border-slate-350 font-bold text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <Bus className="h-3.5 w-3.5" />
            {driver.assigned_bus_id ? 'Reassign Bus' : 'Assign Bus'}
          </button>
        </div>
      )}

    </div>
  );
};

export default DriverCard;
