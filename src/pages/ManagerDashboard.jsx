import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bus, Users, Ticket, ShieldAlert, RefreshCw, MapPin, Calendar, Layers, 
  Search, BarChart3, TrendingUp, PieChart, CheckCircle, Award, Activity, DollarSign, Navigation, Clock, Hammer, Focus
} from 'lucide-react';
import bookingAPI from '../services/bookingAPI';
import busAPI from '../services/busAPI';
import driverAPI from '../services/driverAPI';
import tripAPI from '../services/tripAPI';
import Loading from '../components/Loading';

export const ManagerDashboard = () => {
  const [metrics, setMetrics] = useState({ totalBookings: 0, busesCount: 0, driversCount: 0 });
  const [activeCounts, setActiveCounts] = useState({ activeBuses: 0, activeDrivers: 0, activeTrips: 0 });
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState('bookings');

  // Map & WebSockets Refs
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const wsRef = useRef(null);

  const fetchManagerData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [bookingsCountRes, busesRes, driversRes, allBookingsRes, activeTrips] = await Promise.all([
        bookingAPI.getTotalBookings(),
        busAPI.getAllBuses(),
        driverAPI.getAllDrivers(),
        bookingAPI.getAllTickets(),
        tripAPI.getActiveTrips()
      ]);

      setMetrics({
        totalBookings: bookingsCountRes.total_bookings,
        busesCount: busesRes.length,
        driversCount: driversRes.length
      });

      setBookings(allBookingsRes);
      setBuses(busesRes);
      setDrivers(driversRes);
      setActiveTripsList(activeTrips);

      const activeTripsOnly = activeTrips.filter(t => t.status === 'ACTIVE');
      const uniqueBuses = new Set(activeTripsOnly.map(t => t.bus_id)).size;
      const uniqueDrivers = new Set(activeTripsOnly.map(t => t.driver_id)).size;
      setActiveCounts({
        activeBuses: uniqueBuses,
        activeDrivers: uniqueDrivers,
        activeTrips: activeTripsOnly.length
      });

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync manager oversight workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (loading || !window.L) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map('manager-map', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([20.5937, 78.9629], 5);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapRef.current);
    }

    renderTripMarkers(activeTripsList);

    // Set up WebSockets
    let wsUrl = '';
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    if (envUrl && envUrl.startsWith('http')) {
      const parsed = new URL(envUrl);
      const wsProtocol = parsed.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${parsed.host}/ws/track`;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
      wsUrl = `${wsProtocol}//${host}/ws/track`;
    }

    try {
      wsRef.current = new WebSocket(wsUrl);
      wsRef.current.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          handleLiveTelemetry(payload);
        } catch (e) {
          console.error('Failed to parse WS payload', e);
        }
      };
      wsRef.current.onerror = () => {
        console.warn('WebSocket connection unavailable; continuing without live sockets.');
      };
    } catch (err) {
      console.warn('WebSocket connection failed to initialize', err);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      Object.values(markersRef.current).forEach(marker => {
        if (mapRef.current) mapRef.current.removeLayer(marker);
      });
      markersRef.current = {};
    };
  }, [loading]);

  const createBusIcon = (busNumber) => {
    return window.L.divIcon({
      html: `<div class="flex flex-col items-center">
               <div class="bg-slate-900 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-sm border border-white whitespace-nowrap uppercase tracking-wider">${busNumber}</div>
               <div class="w-2.5 h-2.5 bg-brand-600 rounded-full border border-white shadow -mt-0.5 animate-pulse"></div>
             </div>`,
      className: 'custom-bus-icon',
      iconSize: [50, 35],
      iconAnchor: [25, 17]
    });
  };

  const renderTripMarkers = (trips) => {
    if (!mapRef.current || !window.L) return;

    Object.values(markersRef.current).forEach(marker => {
      mapRef.current.removeLayer(marker);
    });
    markersRef.current = {};

    trips.forEach(trip => {
      if (trip.status === 'ACTIVE' && trip.latitude && trip.longitude) {
        const bus = buses.find(b => b.id === trip.bus_id);
        const busNumber = bus ? bus.bus_number : `Bus #${trip.bus_id}`;
        
        const marker = window.L.marker([parseFloat(trip.latitude), parseFloat(trip.longitude)], {
          icon: createBusIcon(busNumber)
        }).addTo(mapRef.current);

        marker.bindPopup(`
          <div class="p-2 space-y-1 font-sans text-xs font-semibold text-slate-850">
            <div class="font-extrabold uppercase text-slate-900 border-b pb-1 flex justify-between items-center gap-4">
              <span>${busNumber}</span>
              <span class="text-[8px] bg-emerald-50 text-emerald-800 px-1 py-0.5 rounded border border-emerald-200">ACTIVE</span>
            </div>
            <div>Route: <span class="capitalize font-bold">${trip.route || 'N/A'}</span></div>
            <div>Speed: <span class="font-bold text-slate-900">${trip.speed || '0'} km/h</span></div>
          </div>
        `);

        markersRef.current[trip.id] = marker;
      }
    });
  };

  const handleLiveTelemetry = (payload) => {
    const { trip_id, bus_id, bus_number, latitude, longitude, speed, status, route, timestamp } = payload;
    
    setActiveTripsList(prev => {
      const idx = prev.findIndex(t => t.id === trip_id);
      let updatedList = [...prev];
      if (status === 'ACTIVE' || status === 'PAUSED') {
        const item = { id: trip_id, bus_id, latitude, longitude, speed, status, route, timestamp };
        if (idx > -1) updatedList[idx] = item;
        else updatedList.push(item);
      } else {
        updatedList = updatedList.filter(t => t.id !== trip_id);
      }

      // Recalculate metrics
      const activeTripsOnly = updatedList.filter(t => t.status === 'ACTIVE');
      const uniqueBuses = new Set(activeTripsOnly.map(t => t.bus_id)).size;
      const uniqueDrivers = new Set(activeTripsOnly.map(t => t.driver_id || bus_id)).size;
      setActiveCounts({
        activeBuses: uniqueBuses,
        activeDrivers: uniqueDrivers,
        activeTrips: activeTripsOnly.length
      });

      return updatedList;
    });

    if (!mapRef.current || !window.L) return;

    const existingMarker = markersRef.current[trip_id];

    if ((status === 'ACTIVE' || status === 'PAUSED') && latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (existingMarker) {
        existingMarker.setLatLng([lat, lng]);
        existingMarker.getPopup().setContent(`
          <div class="p-2 space-y-1 font-sans text-xs font-semibold text-slate-850">
            <div class="font-extrabold uppercase text-slate-900 border-b pb-1 flex justify-between items-center gap-4">
              <span>${bus_number}</span>
              <span class="text-[8px] ${status === 'ACTIVE' ? 'bg-emerald-55 text-emerald-800 border-emerald-200' : 'bg-amber-55 text-amber-850 border-amber-200'} px-1 py-0.5 rounded border">${status}</span>
            </div>
            <div>Route: <span class="capitalize font-bold">${route || 'N/A'}</span></div>
            <div>Speed: <span class="font-bold text-slate-900">${speed || '0'} km/h</span></div>
          </div>
        `);
      } else {
        const marker = window.L.marker([lat, lng], {
          icon: createBusIcon(bus_number)
        }).addTo(mapRef.current);

        marker.bindPopup(`
          <div class="p-2 space-y-1 font-sans text-xs font-semibold text-slate-850">
            <div class="font-extrabold uppercase text-slate-900 border-b pb-1 flex justify-between items-center gap-4">
              <span>${bus_number}</span>
              <span class="text-[8px] ${status === 'ACTIVE' ? 'bg-emerald-55 text-emerald-800 border-emerald-200' : 'bg-amber-55 text-amber-850 border-amber-200'} px-1 py-0.5 rounded border">${status}</span>
            </div>
            <div>Route: <span class="capitalize font-bold">${route || 'N/A'}</span></div>
            <div>Speed: <span class="font-bold text-slate-900">${speed || '0'} km/h</span></div>
          </div>
        `);
        markersRef.current[trip_id] = marker;
      }
    } else {
      if (existingMarker) {
        mapRef.current.removeLayer(existingMarker);
        delete markersRef.current[trip_id];
      }
    }
  };

  const getBusDetails = (busId) => {
    return buses.find(b => b.id === busId) || {
      bus_number: `Bus #${busId}`,
      source: 'Unknown',
      destination: 'Unknown'
    };
  };

  const focusOnBusMarker = (trip) => {
    if (!mapRef.current || !trip.latitude || !trip.longitude) return;
    mapRef.current.setView([parseFloat(trip.latitude), parseFloat(trip.longitude)], 12);
    const marker = markersRef.current[trip.id];
    if (marker) marker.openPopup();
  };

  const busMap = {};
  buses.forEach(b => {
    busMap[b.id] = b.bus_number;
  });

  if (loading) return <Loading message="Querying operations store..." />;

  // Operational metrics calculations
  const farePerSeat = 500;
  const todayStr = new Date().toISOString().split('T')[0];
  const bookingsToday = bookings.filter(b => b.created_at && b.created_at.startsWith(todayStr));
  const revenueToday = bookingsToday.length * farePerSeat;

  const delayedTrips = activeTripsList.filter(t => t.status === 'PAUSED');
  const standbyDrivers = drivers.filter(d => !activeTripsList.some(t => t.bus_id === d.assigned_bus_id));
  const unassignedBuses = buses.filter(bus => !drivers.some(d => d.assigned_bus_id === bus.id));
  const maintenanceBuses = buses.filter(bus => !activeTripsList.some(t => t.bus_id === bus.id));

  const routeStats = {};
  bookings.forEach(booking => {
    const bus = buses.find(b => b.id === booking.bus_id);
    if (bus) {
      const routeKey = `${bus.source} to ${bus.destination}`;
      routeStats[routeKey] = (routeStats[routeKey] || 0) + farePerSeat;
    }
  });
  const sortedProfitableRoutes = Object.entries(routeStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const upcomingTrips = buses.filter(bus => 
    drivers.some(d => d.assigned_bus_id === bus.id) &&
    !activeTripsList.some(t => t.bus_id === bus.id)
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700 antialiased font-semibold text-xs leading-normal pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5 border-b border-slate-955 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Oversight Console</span>
          <h1 className="text-base font-black uppercase tracking-tight mt-0.5">Manager Dispatch Deck</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            Operational Feed Online
          </span>
          <button
            onClick={fetchManagerData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2 rounded-lg transition-colors cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Today's Overview Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                Today's Overview
              </h3>
              <ul className="space-y-3 text-slate-655">
                <li className="flex items-center justify-between">
                  <span>In-Motion Fleet</span>
                  <strong className="text-slate-900 font-extrabold">{activeCounts.activeBuses} Buses</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Standby Fleet</span>
                  <strong className="text-slate-900 font-extrabold">{unassignedBuses.length} Buses</strong>
                </li>
                <li className="flex items-center justify-between">
                  <span>Standby Operators</span>
                  <strong className="text-slate-900 font-extrabold">{standbyDrivers.length} Drivers</strong>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Gross Revenue Sales</span>
              <span className="text-base font-black text-slate-900 mt-0.5 block">&#8377;{revenueToday}</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" /> Dispatch Alerts
              </h3>
              {delayedTrips.length === 0 && unassignedBuses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1.5">
                  <CheckCircle className="h-7 w-7 text-emerald-500 mx-auto" />
                  <span className="text-[11px] font-bold block">All systems operating smoothly</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {delayedTrips.map(trip => (
                    <div key={trip.id} onClick={() => focusOnBusMarker(trip)} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between text-[11px] cursor-pointer hover:bg-amber-100">
                      <div>
                        <strong className="text-amber-800 uppercase block font-extrabold">Trip Delayed</strong>
                        <span className="text-slate-550 capitalize">{trip.route} shift is paused.</span>
                      </div>
                      <Focus className="h-4 w-4 text-amber-600" />
                    </div>
                  ))}
                  {unassignedBuses.map(bus => (
                    <div key={bus.id} className="p-3 bg-rose-50/50 border border-rose-150 rounded-xl text-[11px]">
                      <strong className="text-rose-800 uppercase block font-extrabold">Operator Needed</strong>
                      <span className="text-slate-550">Bus {bus.bus_number} requires team assignment.</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-slate-400">Contact Owner dispatcher to provision crew assignments.</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                Top Performing Routes
              </h3>
              {sortedProfitableRoutes.length === 0 ? (
                <span className="text-slate-400 py-3 block text-center">No bookings logs registered today.</span>
              ) : (
                <ul className="space-y-2 text-slate-655">
                  {sortedProfitableRoutes.map(([route, profit], i) => (
                    <li key={i} className="flex justify-between items-center">
                      <span className="capitalize">{route}</span>
                      <strong className="text-slate-900 font-extrabold">&#8377;{profit}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block mb-1">Departures Pending ({upcomingTrips.length})</span>
              <div className="flex flex-wrap gap-1">
                {upcomingTrips.map(b => (
                  <span key={b.id} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 uppercase">
                    {b.bus_number}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Live Telemetry Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[480px]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-600 animate-pulse" /> Active Dispatches
            </h3>
            
            {activeTripsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Navigation className="h-7 w-7 text-slate-350" />
                <span className="text-slate-750 font-bold mt-1.5 block">No active dispatches</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Active vehicle tracking feeds will populate here once drivers begin shifts.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeTripsList.map(trip => {
                  const bus = buses.find(b => b.id === trip.bus_id);
                  const busNumber = bus ? bus.bus_number : `#${trip.bus_id}`;
                  const isPaused = trip.status === 'PAUSED';

                  return (
                    <div 
                      key={trip.id} 
                      onClick={() => focusOnBusMarker(trip)}
                      className={`p-3 border rounded-xl cursor-pointer hover:border-slate-350 transition-all ${
                        isPaused ? 'bg-amber-50/50 border-amber-250 hover:bg-amber-100/50' : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                        <strong className="text-slate-800 font-extrabold uppercase">{busNumber}</strong>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                          isPaused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize mt-1.5">{trip.route}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-450 mt-2 font-mono">
                        <span>Speed: <strong className="text-slate-800 font-black">{trip.speed || 0} km/h</strong></span>
                        <span>{trip.timestamp ? new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col h-[480px]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Route Monitor Map
            </h3>
            <div id="manager-map" className="flex-1 rounded-xl border border-slate-200 z-10 animate-fade-in"></div>
          </div>

        </div>

        {/* Crew & Maintenance lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" /> Driver Operational Shifts
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {drivers.map(drv => {
                const isActive = activeTripsList.some(t => t.bus_id === drv.assigned_bus_id && t.status === 'ACTIVE');
                const bus = buses.find(b => b.id === drv.assigned_bus_id);
                const busNumber = bus ? bus.bus_number : 'Standby';

                return (
                  <div key={drv.id} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800">Operator #{drv.id}</strong>
                      <span className="text-[10px] text-slate-400 block font-mono">License: {drv.license_number}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-800 font-bold uppercase block">{busNumber}</span>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black mt-1 ${
                        isActive ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-slate-200 text-slate-655'
                      }`}>
                        {isActive ? 'ON DUTY' : 'STANDBY'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Hammer className="h-4 w-4 text-slate-500" /> Maintenance Status Checks
            </h3>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
              {maintenanceBuses.map(bus => (
                <div key={bus.id} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 uppercase">{bus.bus_number}</strong>
                    <span className="text-[10px] text-slate-400 block capitalize">{bus.source} &rarr; {bus.destination}</span>
                  </div>
                  <span className="bg-slate-200 text-slate-705 px-2 py-0.5 border border-slate-300 rounded text-[8px] font-black uppercase">
                    Inspecting / Standby
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Tabbed Ledgers */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
          <div className="flex border-b border-slate-100 pb-3 gap-2 font-bold">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                activeTab === 'bookings' ? 'bg-slate-900 text-white border-slate-900' : 'border-transparent text-slate-450 hover:text-slate-650'
              }`}
            >
              Bookings Registry ({bookings.length})
            </button>
            <button
              onClick={() => setActiveTab('buses')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer border ${
                activeTab === 'buses' ? 'bg-slate-900 text-white border-slate-900' : 'border-transparent text-slate-455 hover:text-slate-655'
              }`}
            >
              Fleet Inventory ({buses.length})
            </button>
          </div>

          {activeTab === 'bookings' && (
            <div className="font-semibold text-xs text-slate-655 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Booking ID</th>
                    <th className="py-2.5 px-3">Traveler</th>
                    <th className="py-2.5 px-3">Bus Vehicle</th>
                    <th className="py-2.5 px-3">Itinerary</th>
                    <th className="py-2.5 px-3">Seat Assign</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {bookings.map(b => {
                    const bus = buses.find(busItem => busItem.id === b.bus_id);
                    const busNumber = bus ? bus.bus_number : `#${b.bus_id}`;
                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-950">#BMS-{b.id}</td>
                        <td className="py-3 px-3">Traveler #{b.user_id}</td>
                        <td className="py-3 px-3 uppercase font-bold text-slate-800">{busNumber}</td>
                        <td className="py-3 px-3 capitalize text-slate-450">{bus ? `${bus.source} to ${bus.destination}` : 'Unknown'}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">Seat {b.seat_number}</td>
                        <td className="py-3 px-3 text-right">
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-150 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            {b.booking_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'buses' && (
            <div className="font-semibold text-xs text-slate-655 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-450 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                    <th className="py-2.5 px-3">Bus ID</th>
                    <th className="py-2.5 px-3">Registration Number</th>
                    <th className="py-2.5 px-3">Departure hub</th>
                    <th className="py-2.5 px-3">Arrival destination</th>
                    <th className="py-2.5 px-3 text-right">Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {buses.map(bus => (
                    <tr key={bus.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-900 font-mono">#V-{bus.id}</td>
                      <td className="py-3 px-3 font-bold text-slate-800 uppercase">{bus.bus_number}</td>
                      <td className="py-3 px-3 capitalize">{bus.source}</td>
                      <td className="py-3 px-3 capitalize">{bus.destination}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-800">{bus.total_seats} Seats</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ManagerDashboard;
