import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bus as BusIcon, ArrowLeft, Armchair, ShieldCheck, CheckCircle, ShieldAlert, Loader2, Info } from 'lucide-react';
import busAPI from '../services/busAPI';
import bookingAPI from '../services/bookingAPI';
import Loading from '../components/Loading';
import { getUserId } from '../utils/token';

export const BookTicket = () => {
  const { busId } = useParams();
  const navigate = useNavigate();
  const userId = getUserId();

  const [bus, setBus] = useState(null);
  const [seatsInfo, setSeatsInfo] = useState({ remaining_seats: 0, available_seats: [] });
  const [selectedSeat, setSelectedSeat] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const busData = await busAPI.getBusById(busId);
      setBus(busData);

      const seatsData = await busAPI.getAvailableSeats(busId);
      setSeatsInfo(seatsData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve booking information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [busId]);

  const handleSeatClick = (seatNum) => {
    if (!seatsInfo.available_seats.includes(seatNum)) return;
    setSelectedSeat(selectedSeat === seatNum ? null : seatNum);
  };

  const handleBookingSubmit = async () => {
    if (!selectedSeat) {
      setErrorMsg('Please select a seat first.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await bookingAPI.bookTicket({
        user_id: parseInt(userId, 10),
        bus_id: parseInt(busId, 10),
        seat_number: selectedSeat,
      });

      setSuccessMsg(`Ticket booked successfully! Seat Number: ${selectedSeat}`);
      setSelectedSeat(null);
      
      const seatsData = await busAPI.getAvailableSeats(busId);
      setSeatsInfo(seatsData);

      setTimeout(() => {
        navigate('/my-tickets');
      }, 1500);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Booking failed. Seat might have been booked recently.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loading message="Preparing booking cabin..." />;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-550 hover:text-slate-850 hover:border-slate-355 bg-white font-bold text-xs uppercase cursor-pointer transition-all flex items-center gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" /> Cancel & Go Back
      </button>

      {/* Grid: Seat Select (left), Panel Details (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left: Seat selector */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md">
            <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <Armchair className="h-5 w-5 text-rose-500 animate-pulse" />
              Select Your Seat
            </h2>
            <p className="text-slate-400 text-xs mb-6 font-semibold">Click on any vacant seat to select it. Click again to clear selection.</p>

            {/* Grid map */}
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {Array.from({ length: bus.total_seats }, (_, idx) => {
                const seatNum = idx + 1;
                const isAvailable = seatsInfo.available_seats.includes(seatNum);
                const isSelected = selectedSeat === seatNum;

                return (
                  <button
                    key={seatNum}
                    type="button"
                    onClick={() => handleSeatClick(seatNum)}
                    disabled={!isAvailable}
                    className={`p-3 rounded-xl border text-xs font-black font-mono cursor-pointer flex flex-col justify-center items-center h-16 transition-all select-none ${
                      isSelected
                        ? 'bg-rose-500 border-rose-450 text-white shadow-md'
                        : isAvailable
                        ? 'bg-emerald-500/5 border-emerald-500/15 text-emerald-600 hover:bg-emerald-500/15'
                        : 'bg-rose-500/5 border-rose-500/10 text-rose-350 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Armchair className="h-4.5 w-4.5 mb-0.5" />
                    <span>{seatNum}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* Right: Confirmation side box */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md gap-4 flex flex-col">
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="p-2 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-xl">
                <BusIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-slate-800 uppercase">Reservation Pass</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase block mt-0.5">Vehicle: {bus.bus_number}</span>
              </div>
            </div>

            {/* Details table */}
            <div className="space-y-3.5 text-xs font-bold text-slate-655">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Departure Station:</span>
                <span className="text-slate-850 capitalize">{bus.source}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Arrival Station:</span>
                <span className="text-slate-850 capitalize">{bus.destination}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-1">
                <span className="text-slate-400 font-semibold">Vacant Seats:</span>
                <span className="text-emerald-600">{seatsInfo.remaining_seats} remaining</span>
              </div>
            </div>

            {/* Selected badge */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
              <span className="text-[9px] font-extrabold text-slate-400 tracking-wider block uppercase mb-1">Selected Seat Identifier</span>
              {selectedSeat ? (
                <span className="text-2xl font-black text-rose-500 block animate-pulse">Seat {selectedSeat}</span>
              ) : (
                <span className="text-xs text-slate-400 font-bold italic">No seat selected</span>
              )}
            </div>

            {/* Error messages */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Confirm button */}
            <button
              onClick={handleBookingSubmit}
              disabled={submitting || !selectedSeat || successMsg.length > 0}
              className="w-full btn-premium-red py-3.5 rounded-2xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg mt-1 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Locking Ticket...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4.5 w-4.5" />
                  CONFIRM BOOKING
                </>
              )}
            </button>

          </div>
        </div>

      </div>

    </div>
  );
};

export default BookTicket;
