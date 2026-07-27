import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bus as BusIcon, AlertTriangle, ArrowLeft, Armchair, HelpCircle, ShieldAlert, CheckCircle } from 'lucide-react';
import busAPI from '../services/busAPI';
import Loading from '../components/Loading';
import { getRole } from '../utils/token';

export const AvailableSeats = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const role = getRole();

  const [bus, setBus] = useState(null);
  const [seatsInfo, setSeatsInfo] = useState({ remaining_seats: 0, available_seats: [] });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSeatsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const busData = await busAPI.getBusById(busId);
      setBus(busData);
      
      const seatsData = await busAPI.getAvailableSeats(busId);
      setSeatsInfo(seatsData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch available seats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeatsData();
  }, [busId]);

  if (loading) return <Loading message="Querying seat inventory..." />;

  if (errorMsg) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4 bg-slate-50 min-h-screen flex flex-col justify-center items-center">
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 flex items-center gap-3 font-semibold text-xs">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 bg-white font-bold text-xs uppercase cursor-pointer transition-all"
        >
          <ArrowLeft className="h-4 w-4 mr-1 inline" /> Go Back
        </button>
      </div>
    );
  }

  const bookedCount = bus.total_seats - seatsInfo.remaining_seats;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-550 hover:text-slate-850 hover:border-slate-355 bg-white font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" /> Back to List
      </button>

      {/* Overview Card */}
      <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-2xl">
            <BusIcon className="h-7 w-7 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-800 uppercase tracking-tight">{bus.bus_number}</h1>
            <p className="text-slate-400 text-xs mt-0.5 capitalize font-semibold">
              Route: {bus.source} &rarr; {bus.destination}
            </p>
          </div>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap gap-2.5 text-[10px] font-extrabold tracking-widest uppercase">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-500 border border-slate-250 rounded-full font-mono">
            Capacity: {bus.total_seats}
          </span>
          <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 rounded-full font-mono">
            Vacant: {seatsInfo.remaining_seats}
          </span>
          <span className="px-3 py-1.5 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-full font-mono">
            Booked: {bookedCount}
          </span>
        </div>
      </div>

      {/* Legend Panel */}
      <div className="flex items-center gap-6 justify-center text-xs text-slate-500 font-bold bg-white py-3 px-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-250 block"></span>
          <span>Vacant Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-rose-50 border border-rose-150 block"></span>
          <span>Booked Seat</span>
        </div>
      </div>

      {/* Bus Interior Design Layout */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-md">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-6 text-slate-400">
          <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4" /> Cabin Dashboard / Steering Column
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Aisle Row Grid</span>
        </div>

        {/* Seats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
          {Array.from({ length: bus.total_seats }, (_, idx) => {
            const seatNum = idx + 1;
            const isAvailable = seatsInfo.available_seats.includes(seatNum);

            return (
              <div
                key={seatNum}
                className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-xs font-bold font-mono transition-all relative select-none ${
                  isAvailable
                    ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600'
                    : 'bg-rose-500/5 border-rose-500/10 text-rose-350 opacity-50'
                }`}
                title={isAvailable ? `Seat ${seatNum} (Vacant)` : `Seat ${seatNum} (Booked)`}
              >
                <Armchair className="h-5 w-5 mb-0.5" />
                <span>{seatNum}</span>
              </div>
            );
          })}
        </div>

      </div>

      {/* Direct Booking CTA */}
      {role === 'user' && seatsInfo.remaining_seats > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={() => navigate(`/book-ticket/${busId}`)}
            className="btn-premium-red py-3.5 px-8 rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer inline-flex items-center gap-2"
          >
            Go to Booking Page &rarr;
          </button>
        </div>
      )}

    </div>
  );
};

export default AvailableSeats;
