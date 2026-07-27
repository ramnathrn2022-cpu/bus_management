import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, X, Search, MapPin, Bus as BusIcon, ShieldAlert, CheckCircle, Ticket, ArrowRight, Trash } from 'lucide-react';
import busAPI from '../services/busAPI';
import BusCard from '../components/BusCard';
import Loading from '../components/Loading';
import { getRole } from '../utils/token';

export const BusList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState(location.state?.source || '');
  const [filterDestination, setFilterDestination] = useState(location.state?.destination || '');

  const [showAddModal, setShowAddModal] = useState(false);
  const [busNumber, setBusNumber] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [totalSeats, setTotalSeats] = useState(40);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [bookingCounts, setBookingCounts] = useState({});

  const fetchBuses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await busAPI.getAllBuses();
      setBuses(data);

      if (role === 'owner' || role === 'manager') {
        const counts = {};
        for (const bus of data) {
          try {
            const countRes = await busAPI.getBusBookingCount(bus.id);
            counts[bus.id] = countRes.total_bookings;
          } catch (e) {
            console.error(`Error fetching booking count for bus ${bus.id}`, e);
          }
        }
        setBookingCounts(counts);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch buses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuses();
  }, [role]);

  // Handle source/destination passed from landing page state on mount or change
  useEffect(() => {
    if (location.state?.source) setFilterSource(location.state.source);
    if (location.state?.destination) setFilterDestination(location.state.destination);
  }, [location.state]);

  const handleAddBus = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSuccess('');
    
    if (!busNumber || !source || !destination || !totalSeats) {
      setModalError('All fields are required.');
      return;
    }

    if (totalSeats <= 0) {
      setModalError('Total seats must be greater than zero.');
      return;
    }

    setSubmitting(true);
    try {
      await busAPI.addBus({
        bus_number: busNumber.trim().toUpperCase(),
        source: source.trim().toLowerCase(),
        destination: destination.trim().toLowerCase(),
        total_seats: parseInt(totalSeats, 10),
      });

      setModalSuccess('Bus added successfully!');
      setBusNumber('');
      setSource('');
      setDestination('');
      setTotalSeats(40);

      fetchBuses();

      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to add bus.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBus = async (busId) => {
    if (!window.confirm('Are you sure you want to delete this bus?')) return;
    setErrorMsg('');
    try {
      await busAPI.deleteBus(busId);
      setBuses(buses.filter(bus => bus.id !== busId));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to delete bus. Note: Buses with booked tickets cannot be deleted.');
    }
  };

  const handleBookRedirect = (busId) => {
    navigate(`/book-ticket/${busId}`);
  };

  const handleSeatsRedirect = (busId) => {
    navigate(`/available-seats/${busId}`);
  };

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bus.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          bus.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource ? bus.source.toLowerCase() === filterSource.toLowerCase() : true;
    const matchesDest = filterDestination ? bus.destination.toLowerCase() === filterDestination.toLowerCase() : true;
    
    return matchesSearch && matchesSource && matchesDest;
  });

  const uniqueSources = [...new Set(buses.map(b => b.source.toLowerCase()))];
  const uniqueDestinations = [...new Set(buses.map(b => b.destination.toLowerCase()))];

  if (loading) return <Loading message="Retrieving active schedules..." />;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Active Bus Schedules</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Browse, query routes and check seat status</p>
        </div>

        {role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-rose-600/10 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Fleet Bus
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-3 font-semibold">
          <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search bus number, cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 text-slate-850 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 pl-10 text-xs font-semibold outline-none focus:border-rose-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
        </div>

        {/* Source Dropdown */}
        <div className="relative">
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold cursor-pointer"
          >
            <option value="">All Sources</option>
            {uniqueSources.map(s => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </div>

        {/* Destination Dropdown */}
        <div className="relative">
          <select
            value={filterDestination}
            onChange={(e) => setFilterDestination(e.target.value)}
            className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold cursor-pointer"
          >
            <option value="">All Destinations</option>
            {uniqueDestinations.map(d => (
              <option key={d} value={d} className="capitalize">{d}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Buses Catalog List */}
      {filteredBuses.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center gap-3 shadow-xs">
          <BusIcon className="h-10 w-10 text-slate-300 animate-bounce" />
          <div className="space-y-1">
            <p className="text-slate-850 font-bold">No active buses found.</p>
            <p className="text-slate-400 text-xs">Try adjustments to your search queries or route drop-downs.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuses.map((bus) => (
            <BusCard
              key={bus.id}
              bus={bus}
              bookingCount={bookingCounts[bus.id]}
              onBook={handleBookRedirect}
              onDelete={handleDeleteBus}
              onAvailableSeats={handleSeatsRedirect}
            />
          ))}
        </div>
      )}

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BusIcon className="h-4.5 w-4.5 text-rose-500" />
                Register Fleet Bus
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            {modalSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddBus} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Bus Registration Number</label>
                <input
                  type="text"
                  required
                  placeholder="EX: MH-12-PQ-9999"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Source City</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Pune"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="EX: Bangalore"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Passenger Seat Capacity</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-premium-red py-3 rounded-xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg mt-2 cursor-pointer"
              >
                {submitting ? 'Registering Bus...' : 'ADD VEHICLE'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default BusList;
