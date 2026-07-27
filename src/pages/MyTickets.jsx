import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket as TicketIcon, Calendar, Armchair, MapPin, ShieldAlert, Trash2, Bus as BusIcon, AlertTriangle, ArrowRight, CheckCircle, Shield, Navigation } from 'lucide-react';
import bookingAPI from '../services/bookingAPI';
import busAPI from '../services/busAPI';
import Loading from '../components/Loading';
import TrackBusModal from '../components/TrackBusModal';

export const MyTickets = () => {
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [trackingBus, setTrackingBus] = useState(null);

  const fetchTicketsData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ticketsData, busesData] = await Promise.all([
        bookingAPI.getMyTickets(),
        busAPI.getAllBuses(),
      ]);
      setTickets(ticketsData);
      setBuses(busesData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsData();
  }, []);

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this booking pass? This action cannot be undone.')) return;
    
    setErrorMsg('');
    setSuccessMsg('');
    setCancellingId(ticketId);

    try {
      await bookingAPI.cancelTicket(ticketId);
      setSuccessMsg('Booking cancelled successfully.');
      fetchTicketsData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to cancel the ticket.');
    } finally {
      setCancellingId(null);
    }
  };

  const getBusDetails = (busId) => {
    return buses.find(b => b.id === busId) || {
      bus_number: 'Unknown Bus',
      source: 'Unknown',
      destination: 'Unknown'
    };
  };

  if (loading) return <Loading message="Syncing traveler ticket registry..." />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">My Booked Passes</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage your active itineraries and track bus locations</p>
        </div>
        <Link
          to="/buses"
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-600/10 cursor-pointer"
        >
          Book New Trip
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-3 font-semibold">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-3 font-semibold">
          <CheckCircle className="h-5 w-5 flex-shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tickets List */}
      {tickets.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center gap-4 shadow-xs">
          <TicketIcon className="h-10 w-10 text-slate-350" />
          <div className="space-y-1">
            <p className="text-slate-800 font-bold">No active passes found.</p>
            <p className="text-slate-400 text-xs">You haven't reserved any travel tickets yet.</p>
          </div>
          <Link
            to="/buses"
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs cursor-pointer shadow-md"
          >
            Find Buses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tickets.map((ticket) => {
            const busDetails = getBusDetails(ticket.bus_id);
            const formattedDate = ticket.created_at 
              ? new Date(ticket.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })
              : 'N/A';

            return (
              <div 
                key={ticket.id} 
                className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md flex flex-col relative group"
              >
                {/* Visual strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600"></div>

                <div className="p-6 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-xl">
                        <TicketIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-[9px] font-extrabold text-slate-400 block uppercase tracking-wider">BOARDING TICKET ID</span>
                        <span className="text-xs font-mono text-slate-800 font-black">#BMS-{ticket.id}</span>
                      </div>
                    </div>

                    <span className="inline-flex px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 font-bold uppercase tracking-widest text-[9px]">
                      {ticket.booking_status}
                    </span>
                  </div>

                  {/* Route & Bus Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-slate-800 uppercase">
                      <BusIcon className="h-4 w-4 text-rose-500" />
                      <span>{busDetails.bus_number}</span>
                    </div>

                    {/* From to To Grid */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs font-semibold">
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">DEPARTURE</span>
                        <span className="text-slate-800 capitalize flex items-center gap-1 font-bold">
                          <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" /> {busDetails.source}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 font-extrabold block mb-1 uppercase tracking-wider">ARRIVAL</span>
                        <span className="text-slate-800 capitalize flex items-center gap-1 font-bold">
                          <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" /> {busDetails.destination}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Boarding pass barcode block */}
                  <div className="border-t-2 border-dashed border-slate-200 pt-4 flex flex-col items-center justify-center gap-1 bg-slate-50/50 p-3 rounded-2xl border border-slate-200">
                    <div className="flex items-center gap-0.5 opacity-60">
                      {Array.from({ length: 48 }, (_, i) => (
                        <div 
                          key={i} 
                          className="h-6 bg-slate-800" 
                          style={{ width: `${(i % 3 === 0 ? 3 : i % 5 === 0 ? 1 : 2)}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 font-bold tracking-widest mt-1">
                      * BOARDING PASS GATEWAY SECURITY VALIDATED *
                    </span>
                  </div>

                  {/* Footer Row */}
                  <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-4 font-bold text-xs">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Armchair className="h-4 w-4 text-rose-500 animate-pulse" />
                        <span>Seat: <strong className="text-slate-900 font-extrabold">{ticket.seat_number}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Calendar className="h-4 w-4" />
                        <span>{formattedDate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackingBus(busDetails)}
                        className="inline-flex items-center gap-1.5 text-xs text-white bg-rose-600 hover:bg-rose-500 hover:shadow-md transition-all cursor-pointer px-4 py-2 rounded-xl font-bold uppercase tracking-wider"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        <span>Track Bus</span>
                      </button>

                      <button
                        onClick={() => handleCancelTicket(ticket.id)}
                        disabled={cancellingId === ticket.id}
                        className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:bg-rose-50 px-3 py-1.5 rounded-xl font-bold"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{cancellingId === ticket.id ? 'Cancelling...' : 'Cancel'}</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {trackingBus && (
        <TrackBusModal bus={trackingBus} onClose={() => setTrackingBus(null)} />
      )}

    </div>
  );
};

export default MyTickets;
