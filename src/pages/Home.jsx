import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bus, ArrowRight, ArrowLeftRight, MapPin, Percent, Star, ShieldCheck, 
  Heart, Navigation, Activity, Clock, Ticket, ClipboardList, BarChart3, Mail, Phone, Users
} from 'lucide-react';
import { getToken, getRole } from '../utils/token';
import busAPI from '../services/busAPI';

export const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const role = getRole();

  const [buses, setBuses] = useState([]);
  const [busesCount, setBusesCount] = useState(0);
  const [routesCount, setRoutesCount] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await busAPI.getAllBuses();
        setBuses(data);
        setBusesCount(data.length);
        const uniqueRoutes = new Set(data.map(b => `${b.source.toLowerCase()}-${b.destination.toLowerCase()}`));
        setRoutesCount(uniqueRoutes.size);
      } catch (err) {
        console.error('Failed to fetch home page statistics:', err);
      }
    };
    fetchStats();
  }, []);

  // Booking Card States
  const [leavingFrom, setLeavingFrom] = useState('');
  const [goingTo, setGoingTo] = useState('');
  const [journeyDate, setJourneyDate] = useState('');
  const [passengers, setPassengers] = useState('1 Passenger');
  const [searchAnimation, setSearchAnimation] = useState(false);

  // Promo Slider State
  const [activeSlide, setActiveSlide] = useState(0);
  const promoBanners = [
    { title: "FIRST BOOKING OFFER", discount: "15% OFF", code: "FIRSTBUS", desc: "Save big on your first travel booking pass. Maximum discount ₹150.", color: "from-rose-500 to-red-650" },
    { title: "WEEKEND GETAWAY PASS", discount: "₹100 FLAT OFF", code: "WEEKEND100", desc: "Travel to your favorite cities during weekends. Validity: Friday to Sunday.", color: "from-blue-600 to-indigo-700" },
    { title: "FESTIVAL SPECIAL RUNS", discount: "20% SAVINGS", code: "FESTIVAL20", desc: "Book seats early for upcoming seasonal holidays. Live catering onboard.", color: "from-emerald-500 to-teal-600" }
  ];

  // Tracking Simulator State
  const [trackingBusId, setTrackingBusId] = useState('KA-01-F-1234');
  const [trackingLogs, setTrackingLogs] = useState([
    { time: "18:50", msg: "Bus departed Bangalore Kempegowda Hub." },
    { time: "18:55", msg: "Passed Electronic City Toll Plaza. Current Speed: 78 km/h." },
    { time: "19:00", msg: "Enroute to Hosur bypass corridor." }
  ]);
  const [trackingStatus, setTrackingStatus] = useState('ON TIME');
  const [mapMessage, setMapMessage] = useState('Displaying Live Fleet Location...');

  useEffect(() => {
    // Scroll to section if triggered from Navbar
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo;
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Rotate Promotional Banners automatically
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % promoBanners.length);
    }, 4500);
    return () => clearInterval(slideInterval);
  }, []);

  const getDashboardPath = () => {
    if (!role) return '/login';
    return `/${role.toLowerCase()}`;
  };

  const handleSourceSwap = () => {
    const temp = leavingFrom;
    setLeavingFrom(goingTo);
    setGoingTo(temp);
  };

  const handleSearchBuses = (e) => {
    e.preventDefault();
    setSearchAnimation(true);
    setTimeout(() => {
      setSearchAnimation(false);
      navigate('/buses', { 
        state: { 
          source: leavingFrom.toLowerCase().trim(), 
          destination: goingTo.toLowerCase().trim() 
        } 
      });
    }, 900);
  };

  // Derive unique routes dynamically from registered buses
  const uniqueRouteMap = {};
  buses.forEach(bus => {
    if (bus.source && bus.destination) {
      const key = `${bus.source.toLowerCase().trim()}->${bus.destination.toLowerCase().trim()}`;
      if (!uniqueRouteMap[key]) {
        uniqueRouteMap[key] = {
          from: bus.source,
          to: bus.destination,
          seats: bus.total_seats,
          busNumber: bus.bus_number,
          id: bus.id
        };
      }
    }
  });
  const derivedRoutes = Object.values(uniqueRouteMap);

  const handleRouteClick = (from, to) => {
    setLeavingFrom(from);
    setGoingTo(to);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const handleSimulateTracking = (busNumber) => {
    const selectedBus = buses.find(b => b.bus_number === busNumber);
    if (!selectedBus) return;

    setTrackingBusId(busNumber);
    setMapMessage(`Connecting GPS to Bus ${busNumber}...`);
    setTimeout(() => {
      setTrackingLogs([
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), msg: `GPS Link established for ${busNumber}.` },
        { time: "Route", msg: `Transit Line: ${selectedBus.source} to ${selectedBus.destination} is active.` },
        { time: "Status", msg: `Vehicle capacity: ${selectedBus.total_seats} passenger seats. Speed: 76 km/h.` }
      ]);
      setTrackingStatus('ACTIVE');
      setMapMessage(`Active GPS Map Link: ${busNumber} (Transit)`);
    }, 600);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 bg-grid-mesh">
      
      {/* Absolute background color blocks */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-slate-900 via-slate-900/90 to-transparent z-0"></div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24 relative z-10 space-y-20">
        
        {/* HERO HEADER SECTION */}
        <header className="text-center space-y-5 max-w-4xl mx-auto pt-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-600 text-xs font-bold uppercase tracking-wider select-none animate-pulse">
            <Bus className="h-4 w-4" />
            INDIA'S LARGEST BUS MANAGEMENT PLATFORM
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Seamless Journeys, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-rose-400 via-red-300 to-white">
              Smart Fleet Control
            </span>
          </h1>
          <p className="text-slate-300 text-xs sm:text-base max-w-xl mx-auto leading-relaxed font-semibold">
            Book buses, manage fleets, track vehicles, and manage drivers efficiently with real-time scheduling and analytics.
          </p>
        </header>

        {/* INTERACTIVE BOOKING CARD SECTION */}
        <section className="max-w-5xl mx-auto">
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl p-5 md:p-8">
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Percent className="h-4.5 w-4.5 text-rose-500 animate-pulse" /> Book Travel Passes
              </h2>
            </div>

            <form onSubmit={handleSearchBuses} className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
              
              {/* Departure hub */}
              <div className="relative">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Leaving From</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter city (e.g. Bangalore)"
                    value={leavingFrom}
                    onChange={(e) => setLeavingFrom(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold capitalize"
                  />
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Interchange swap */}
              <div className="flex items-center justify-center -my-1 lg:my-0 pb-1.5">
                <button
                  type="button"
                  onClick={handleSourceSwap}
                  className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-all cursor-pointer shadow-xs"
                  title="Swap Cities"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </button>
              </div>

              {/* Destination hub */}
              <div className="relative">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Going To</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Enter city (e.g. Pune)"
                    value={goingTo}
                    onChange={(e) => setGoingTo(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-2xl py-3 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold capitalize"
                  />
                  <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Search triggers */}
              <div>
                <button
                  type="submit"
                  disabled={searchAnimation}
                  className="w-full btn-premium-red py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Navigation className="h-4 w-4" />
                  {searchAnimation ? 'Searching Available Fleets...' : 'Find Available Seats'}
                </button>
              </div>

            </form>
          </div>
        </section>

        {/* PROMOTION OVERVIEW SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Promos Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Percent className="h-4.5 w-4.5 text-rose-500" /> Promos & Active Discount Offers
            </h3>
            
            <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 shadow-lg p-6 md:p-8 min-h-60 flex flex-col justify-between">
              {/* Dynamic Banner Slider */}
              <div className={`p-6 rounded-2xl text-white bg-gradient-to-br ${promoBanners[activeSlide].color} transition-all duration-500 flex flex-col justify-between h-44`}>
                <div>
                  <span className="text-[9px] bg-white/20 text-white font-extrabold px-2 py-0.5 rounded tracking-widest uppercase">{promoBanners[activeSlide].title}</span>
                  <h4 className="text-xl font-black mt-2 leading-tight">{promoBanners[activeSlide].discount}</h4>
                  <p className="text-slate-100 text-[11px] font-semibold leading-relaxed mt-1 max-w-md">{promoBanners[activeSlide].desc}</p>
                </div>
                <div className="flex justify-between items-center border-t border-white/10 pt-2 text-[10px]">
                  <span>CODE: <strong className="font-mono text-white tracking-widest font-black uppercase bg-white/20 px-2 py-0.5 rounded ml-1">{promoBanners[activeSlide].code}</strong></span>
                  <span className="underline cursor-pointer font-bold">Copy code</span>
                </div>
              </div>

              {/* Slider indicators */}
              <div className="flex justify-center gap-1.5 mt-4">
                {promoBanners.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setActiveSlide(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      activeSlide === i ? 'w-5 bg-rose-500' : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Stats Panel (1/3 width) */}
          <div className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <Star className="h-4.5 w-4.5 text-rose-500" /> System Operations Registry
            </h3>

            <div className="bg-white border border-slate-200 shadow-lg rounded-3xl p-6 space-y-6 h-60 flex flex-col justify-center font-bold text-xs">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-3">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/15">
                  <Bus className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-extrabold">Active Buses Count</span>
                  <span className="text-xl font-black text-slate-800">{busesCount} registered</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/15">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block uppercase tracking-widest font-extrabold">Active Service corridors</span>
                  <span className="text-xl font-black text-slate-800">{routesCount} unique routes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ACTIVE ROUTES LIST */}
        <section className="max-w-5xl mx-auto space-y-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">
            Explore Active Routes
          </h3>
          {derivedRoutes.length === 0 ? (
            <div className="text-center py-10 bg-white border border-slate-200 border-dashed rounded-3xl text-slate-400 text-xs font-semibold">
              No routes registered. Inactive fleet waiting for provisioning.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {derivedRoutes.map((route, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleRouteClick(route.from, route.to)}
                  className="bg-white border border-slate-200 hover:border-rose-500 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:-translate-y-0.5 hover:shadow-md transition-all shadow-xs"
                >
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-extrabold">Route Run</span>
                    <strong className="text-slate-800 capitalize text-sm block font-black leading-tight">{route.from} &rarr; {route.to}</strong>
                  </div>
                  <ArrowRight className="h-4.5 w-4.5 text-slate-400" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* VERIFIED SERVICE HIGHLIGHTS */}
        <section id="why-us" className="max-w-5xl mx-auto space-y-6">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest text-center">
            Verified Transit Benefits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all text-center space-y-3">
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">100% Verified Telemetry</h4>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Zero simulated coordinate logs or mocked speed updates. All bus telemetry feeds stream from physical driver GPS units.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all text-center space-y-3">
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <Clock className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">Dynamic Schedule Tracking</h4>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                Our transponders ping backend logs every 5 seconds. If a vehicle halts or pauses, delay flags register on dispatches instantly.
              </p>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs hover:shadow-md transition-all text-center space-y-3">
              <div className="p-3 bg-rose-500/10 text-rose-500 border border-rose-500/15 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6" />
              </div>
              <h4 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">Calculated ETA & Speeds</h4>
              <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
                We geocode pickup stations and run Haversine distance equations against GPS reports to estimate arrivals with real speeds.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Home;
