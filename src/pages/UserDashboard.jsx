import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Ticket, Bus, ArrowRight, ShieldAlert, MapPin, Calendar, CheckCircle, Navigation } from 'lucide-react';
import bookingAPI from '../services/bookingAPI';
import busAPI from '../services/busAPI';
import Loading from '../components/Loading';
import { getUserId } from '../utils/token';
import TrackBusModal from '../components/TrackBusModal';

export const UserDashboard = () => {
  const navigate = useNavigate();
  const userId = getUserId();

  const [tickets, setTickets] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [trackingBus, setTrackingBus] = useState(null);

  const fetchUserData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [ticketsRes, busesRes] = await Promise.all([
        bookingAPI.getMyTickets(),
        busAPI.getAllBuses()
      ]);
      setTickets(ticketsRes);
      setBuses(busesRes);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to populate user dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to cancel this ticket booking?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await bookingAPI.cancelTicket(ticketId);
      setSuccessMsg('Ticket cancelled successfully.');
      setTickets(tickets.filter(t => t.id !== ticketId));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to cancel ticket.');
    }
  };

  const getBusDetails = (busId) => {
    return buses.find(b => b.id === busId) || {
      bus_number: `Bus #${busId}`,
      source: 'Unknown',
      destination: 'Unknown'
    };
  };

  if (loading) return <Loading message="Syncing traveler dashboard..." />;

  const ticketPreview = tickets.slice(0, 2);

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 relative overflow-hidden shadow-xs">
        <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-5 pointer-events-none hidden md:block">
          <Bus className="h-32 w-32 text-slate-800" />
        </div>
        <div className="space-y-2 relative z-10 font-semibold">
          <span className="text-[9px] font-extrabold tracking-widest text-rose-500 uppercase block">Traveler Workspace</span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800">Welcome Back, Traveler #{userId}</h1>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg font-semibold leading-relaxed">
            Quickly query available departures, manage your reservation schedules and review printable digital travel passes.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-3 font-semibold">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-3 font-semibold">
          <CheckCircle className="h-5 w-5 flex-shrink-0 animate-bounce text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Statistics and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Passes Count Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between h-44 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">My Active Passes</span>
            <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-2xl">
              <Ticket className="h-5 w-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">{tickets.length} Bookings</h2>
            <Link to="/my-tickets" className="text-xs text-rose-500 hover:text-rose-600 font-bold block mt-1 transition-all">
              Manage Tickets &rarr;
            </Link>
          </div>
        </div>

        {/* Quick Booking card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 lg:col-span-2 flex flex-col justify-between items-start h-44 shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Reservation Dispatch</span>
            <h3 className="text-base font-bold text-slate-850">Book Your Next Route</h3>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Find buses, check seat vacancies, and secure boarding passes in one click.
            </p>
          </div>
          <Link
            to="/buses"
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-rose-600/10 inline-flex items-center gap-1.5 cursor-pointer group"
          >
            Find Buses
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Recents active passes */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <h3 className="text-xs font-extrabold text-slate-850 uppercase tracking-wider">Active Pass Summaries</h3>
          {tickets.length > 2 && (
            <Link to="/my-tickets" className="text-xs font-extrabold text-rose-500 hover:underline uppercase tracking-wider">
              View All &rarr;
            </Link>
          )}
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-10 text-slate-450 text-xs font-semibold">
            You don't have any active travel passes.{' '}
            <Link to="/buses" className="text-rose-500 hover:underline font-bold">
              Book a ticket
            </Link>{' '}
            to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ticketPreview.map((ticket) => {
              const busDetails = getBusDetails(ticket.bus_id);
              return (
                <div key={ticket.id} className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between gap-4 font-semibold">
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-mono text-slate-450 font-bold tracking-widest">TICKET #BMS-{ticket.id}</span>
                    <span className="text-[9px] font-extrabold px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full uppercase tracking-wider">
                      {ticket.booking_status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-800 uppercase mb-1">{busDetails.bus_number}</h4>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 capitalize">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      <span>{busDetails.source}</span>
                      <span className="text-slate-350 font-bold">&rarr;</span>
                      <MapPin className="h-3.5 w-3.5 text-rose-500 flex-shrink-0" />
                      <span>{busDetails.destination}</span>
                    </div>
                  </div>

                   <div className="border-t border-slate-150 pt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-650">Seat: <strong className="text-slate-800 font-extrabold">Seat {ticket.seat_number}</strong></span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTrackingBus(busDetails)}
                        className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-colors cursor-pointer px-3 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-1"
                      >
                        <Navigation className="h-3 w-3" />
                        <span>Track</span>
                      </button>
                      <button
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer border border-transparent hover:bg-rose-55 px-2 py-1 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {trackingBus && (
        <TrackBusModal bus={trackingBus} onClose={() => setTrackingBus(null)} />
      )}

    </div>
  );
};

export default UserDashboard;
