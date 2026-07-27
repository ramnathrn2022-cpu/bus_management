import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Bus, Users, Ticket, Plus, Trash2, MapPin, Calendar, ShieldAlert, UserPlus, 
  CheckCircle, BarChart3, TrendingUp, DollarSign, PieChart, Activity, UserCheck, ShieldCheck, Navigation, Clock, AlertTriangle, Hammer, PhoneCall, Focus
} from 'lucide-react';
import bookingAPI from '../services/bookingAPI';
import busAPI from '../services/busAPI';
import driverAPI from '../services/driverAPI';
import authAPI from '../services/authAPI';
import tripAPI from '../services/tripAPI';
import Loading from '../components/Loading';

export const OwnerDashboard = () => {
  const navigate = useNavigate();

  // Core Data States
  const [metrics, setMetrics] = useState({ totalBookings: 0, busesCount: 0, driversCount: 0 });
  const [activeCounts, setActiveCounts] = useState({ activeBuses: 0, activeDrivers: 0, activeTrips: 0 });
  const [bookings, setBookings] = useState([]);
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [activeTripsList, setActiveTripsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Action Center Tab State
  const [actionTab, setActionTab] = useState('driver');

  // Create Driver Form States
  const [drvName, setDrvName] = useState('');
  const [drvEmail, setDrvEmail] = useState('');
  const [drvPassword, setDrvPassword] = useState('');
  const [drvLicense, setDrvLicense] = useState('');
  const [drvPhone, setDrvPhone] = useState('');
  const [drvLoading, setDrvLoading] = useState(false);
  const [drvSuccess, setDrvSuccess] = useState('');
  const [drvError, setDrvError] = useState('');

  // Create Manager Form States
  const [mngName, setMngName] = useState('');
  const [mngEmail, setMngEmail] = useState('');
  const [mngPassword, setMngPassword] = useState('');
  const [mngLoading, setMngLoading] = useState(false);
  const [mngSuccess, setMngSuccess] = useState('');
  const [mngError, setMngError] = useState('');

  // Assign Driver Form States
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignBusId, setAssignBusId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  // Map & WebSockets Refs
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const wsRef = useRef(null);

  const fetchOwnerData = async () => {
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

      if (driversRes.length > 0) setAssignDriverId(driversRes[0].id.toString());
      if (busesRes.length > 0) setAssignBusId(busesRes[0].id.toString());

    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync fleet operations database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (loading || !window.L) return;

    if (!mapRef.current) {
      mapRef.current = window.L.map('owner-map', {
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

    // WebSockets setup
    const wsUrl = `ws://${window.location.hostname}:8000/ws/track`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        handleLiveTelemetry(payload);
      } catch (e) {
        console.error('Failed to parse telemetry update', e);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
      Object.values(markersRef.current).forEach(marker => {
        if (mapRef.current) mapRef.current.removeLayer(marker);
      });
      markersRef.current = {};
    };
  }, [loading]);

  const createBusIcon = (busNumber) => {
    return window.L.divIcon({
      html: `<div class="flex flex-col items-center">
               <div class="bg-brand-900 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded shadow-sm border border-white whitespace-nowrap uppercase tracking-wider">${busNumber}</div>
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
              <span class="text-[8px] ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-850 border-amber-200'} px-1 py-0.5 rounded border">${status}</span>
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
              <span class="text-[8px] ${status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-850 border-amber-200'} px-1 py-0.5 rounded border">${status}</span>
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

  const handleCreateDriverSubmit = async (e) => {
    e.preventDefault();
    setDrvError('');
    setDrvSuccess('');
    setDrvLoading(true);

    try {
      const userRes = await authAPI.register({
        name: drvName,
        email: drvEmail,
        password: drvPassword,
        role: 'driver'
      });

      await driverAPI.addDriver({
        user_id: userRes.user_id,
        license_number: drvLicense.trim().toUpperCase(),
        phone: drvPhone.trim()
      });

      setDrvSuccess(`Driver "${drvName}" registered successfully!`);
      setDrvName('');
      setDrvEmail('');
      setDrvPassword('');
      setDrvLicense('');
      setDrvPhone('');
      fetchOwnerData();
    } catch (err) {
      console.error(err);
      setDrvError(err.message || 'Driver registration failed.');
    } finally {
      setDrvLoading(false);
    }
  };

  const handleCreateManagerSubmit = async (e) => {
    e.preventDefault();
    setMngError('');
    setMngSuccess('');
    setMngLoading(true);

    try {
      const userRes = await authAPI.register({
        name: mngName,
        email: mngEmail,
        password: mngPassword,
        role: 'manager'
      });

      setMngSuccess(`Manager "${mngName}" created successfully!`);
      setMngName('');
      setMngEmail('');
      setMngPassword('');
      fetchOwnerData();
    } catch (err) {
      console.error(err);
      setMngError(err.message || 'Manager registration failed.');
    } finally {
      setMngLoading(false);
    }
  };

  const handleAssignDriverSubmit = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');
    if (!assignDriverId || !assignBusId) {
      setAssignError('Select both a driver and a bus.');
      return;
    }
    setAssignLoading(true);
    try {
      await driverAPI.assignDriver({
        driver_id: parseInt(assignDriverId, 10),
        bus_id: parseInt(assignBusId, 10)
      });
      setAssignSuccess('Driver assigned to bus successfully!');
      fetchOwnerData();
    } catch (err) {
      console.error(err);
      setAssignError(err.message || 'Failed to assign driver.');
    } finally {
      setAssignLoading(false);
    }
  };

  const focusOnBusMarker = (trip) => {
    if (!mapRef.current || !trip.latitude || !trip.longitude) return;
    mapRef.current.setView([parseFloat(trip.latitude), parseFloat(trip.longitude)], 12);
    const marker = markersRef.current[trip.id];
    if (marker) marker.openPopup();
  };

  const triggerAssignAction = (busId) => {
    setAssignBusId(busId.toString());
    setActionTab('assign');
    const actionSection = document.getElementById('action-center');
    if (actionSection) {
      actionSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) return <Loading message="Syncing operational dispatches..." />;

  // Operational stats calculations
  const farePerSeat = 500;
  const todayStr = new Date().toISOString().split('T')[0];
  const bookingsToday = bookings.filter(b => b.created_at && b.created_at.startsWith(todayStr));
  const revenueToday = bookingsToday.length * farePerSeat;
  const totalRevenue = bookings.length * farePerSeat;

  const delayedTrips = activeTripsList.filter(t => t.status === 'PAUSED');
  const unassignedBuses = buses.filter(bus => !drivers.some(d => d.assigned_bus_id === bus.id));
  const standbyDrivers = drivers.filter(d => !activeTripsList.some(t => t.bus_id === d.assigned_bus_id));
  const maintenanceBuses = buses.filter(bus => !activeTripsList.some(t => t.bus_id === bus.id));

  // Route load capacities calculated dynamically
  const routeProfits = {};
  const routeBookingCounts = {};
  bookings.forEach(booking => {
    const bus = buses.find(b => b.id === booking.bus_id);
    if (bus) {
      const routeKey = `${bus.source} to ${bus.destination}`;
      routeProfits[routeKey] = (routeProfits[routeKey] || 0) + farePerSeat;
      routeBookingCounts[routeKey] = (routeBookingCounts[routeKey] || 0) + 1;
    }
  });

  const sortedProfitableRoutes = Object.entries(routeProfits)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const upcomingTrips = buses.filter(bus => 
    drivers.some(d => d.assigned_bus_id === bus.id) &&
    !activeTripsList.some(t => t.bus_id === bus.id)
  );

  return (
    <div className="bg-slate-50 min-h-screen font-sans text-slate-700 antialiased font-semibold text-xs leading-normal pb-12">
      
      {/* 1. Header (RedBus/Zoho style top bar) */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-5 sticky top-0 z-30 shadow-xs">
        <div className="max-w-screen-2xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest block">Operational command tower</span>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Welcome back, Dispatcher</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>All Telemetry Pipelines Online</span>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <Link to="/buses" className="bg-white text-slate-800 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-xs">
                Fleet
              </Link>
              <Link to="/drivers" className="text-slate-500 px-3 py-1.5 rounded-md hover:text-slate-800 transition-colors">
                Drivers
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 sm:p-6 space-y-6">

        {/* 2. Today's Pulse Indicators (KPI strip) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Daily Ticket Load</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-900">{bookingsToday.length}</span>
              <span className="text-[10px] text-slate-400 font-bold">passes today</span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-1.5">Total sold: {metrics.totalBookings}</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Vehicles</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-slate-900">{activeCounts.activeBuses}</span>
              <span className="text-[10px] text-slate-400 font-bold">/ {metrics.busesCount} in-service</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-brand-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${(activeCounts.activeBuses / Math.max(metrics.busesCount, 1)) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Revenue Intake</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-brand-600">&#8377;{revenueToday}</span>
              <span className="text-[10px] text-slate-400 font-bold">today</span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-1.5">Total Gross: &#8377;{totalRevenue}</span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5">
            <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">Operational Alerts</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-lg font-black text-rose-600">{delayedTrips.length + unassignedBuses.length}</span>
              <span className="text-[10px] text-slate-400 font-bold">active warnings</span>
            </div>
            <span className="text-[9px] text-slate-400 font-bold block mt-1.5">Requires crew action</span>
          </div>
        </div>

        {/* 3. Daily Operations Workflow Board (Action-oriented Desk) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Workflow Column A: Action Required (Urgent crew alerts) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-rose-500 animate-pulse" /> Action Required
                </h3>
                <span className="text-[9px] bg-rose-50 border border-rose-100 text-rose-600 font-extrabold px-1.5 py-0.5 rounded">
                  {delayedTrips.length + unassignedBuses.length} Alerts
                </span>
              </div>

              {delayedTrips.length === 0 && unassignedBuses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1.5">
                  <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase">All systems clear</h4>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[200px] mx-auto">No static vehicle flags or unassigned routes detected.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                  {delayedTrips.map(trip => (
                    <div key={trip.id} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-amber-800 uppercase block font-extrabold">Bus Static Warning</strong>
                        <span className="text-slate-500 capitalize">{trip.route} trip is paused.</span>
                      </div>
                      <button 
                        onClick={() => focusOnBusMarker(trip)} 
                        className="bg-white border border-amber-300 hover:bg-amber-50 text-amber-800 p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Focus Map"
                      >
                        <Focus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {unassignedBuses.map(bus => (
                    <div key={bus.id} className="p-3 bg-rose-50/50 border border-rose-150 rounded-xl flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-rose-800 uppercase block font-extrabold">Driver Assignment Needed</strong>
                        <span className="text-slate-500">Bus {bus.bus_number} has no active operator.</span>
                      </div>
                      <button 
                        onClick={() => triggerAssignAction(bus.id)}
                        className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-2 py-1 rounded text-[9px] uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="border-t border-slate-100 pt-2.5 text-[9px] text-slate-400 font-bold">
              Tip: Assign standby operators to standby buses to prepare for departures.
            </div>
          </div>

          {/* Workflow Column B: Route Loads & Booking Demands */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                Route Profits & Load Factor
              </h3>
              
              {sortedProfitableRoutes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 font-bold">
                  No ticket bookings recorded yet today.
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[190px] overflow-y-auto pr-1">
                  {sortedProfitableRoutes.map(([route, profit], i) => {
                    const bookingsCount = routeBookingCounts[route] || 0;
                    // Let's assume a route's total potential capacity is 40 seats (standard bus)
                    const loadFactor = Math.min(Math.round((bookingsCount / 40) * 100), 100);

                    return (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span className="capitalize text-slate-800 font-extrabold">{route}</span>
                          <span className="text-slate-900 font-black">&#8377;{profit}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${loadFactor}%` }}></div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-bold whitespace-nowrap">{loadFactor}% Load</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-2.5 text-[9px] text-slate-400 font-bold">
              Calculated dynamically based on active traveler booking files.
            </div>
          </div>

          {/* Workflow Column C: Upcoming Runs Scheduled */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-80">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
                Departures Pending ({upcomingTrips.length})
              </h3>
              
              {upcomingTrips.length === 0 ? (
                <div className="py-8 text-center text-slate-400 space-y-1">
                  <Clock className="h-7 w-7 text-slate-250 mx-auto" />
                  <span className="text-[11px] font-bold block">No departures pending</span>
                  <p className="text-[10px] text-slate-400 leading-normal max-w-[180px] mx-auto">All vehicles with assigned operators are currently in-transit.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                  {upcomingTrips.map(bus => {
                    const driver = drivers.find(d => d.assigned_bus_id === bus.id);
                    return (
                      <div key={bus.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] flex justify-between items-center">
                        <div>
                          <strong className="text-slate-900 uppercase block font-extrabold">{bus.bus_number}</strong>
                          <span className="text-slate-450 block capitalize">{bus.source} &rarr; {bus.destination}</span>
                        </div>
                        <span className="bg-slate-200/80 text-slate-700 font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider border border-slate-300">
                          Standby
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 pt-2.5 text-[9px] text-slate-400 font-bold">
              Scheduled buses will move to active dispatch once drivers hit "Start Trip".
            </div>
          </div>

        </div>

        {/* 4. Live Telemetry Control Room (Map & Dispatch side-by-side) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dispatch HUD selector list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-[500px]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-brand-600 animate-pulse" /> Live Dispatch HUD
            </h3>

            {activeTripsList.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                <Navigation className="h-7 w-7 text-slate-300" />
                <span className="text-slate-800 font-bold mt-2 block text-xs">No active runs</span>
                <p className="text-[10px] text-slate-400 max-w-[200px] leading-relaxed mt-1">
                  Active vehicle tracking feeds will populate here once drivers begin shifts.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {activeTripsList.map(trip => {
                  const bus = buses.find(b => b.id === trip.bus_id);
                  const busNumber = bus ? bus.bus_number : `#${trip.bus_id}`;
                  const isPaused = trip.status === 'PAUSED';

                  return (
                    <div 
                      key={trip.id} 
                      onClick={() => focusOnBusMarker(trip)}
                      className={`p-3.5 border rounded-xl cursor-pointer transition-all hover:shadow-xs ${
                        isPaused 
                          ? 'bg-amber-50/50 border-amber-250 hover:border-amber-400' 
                          : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 mb-1.5">
                        <strong className="text-slate-800 font-extrabold uppercase">{busNumber}</strong>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-wider uppercase ${
                          isPaused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 capitalize flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {trip.route}
                      </div>
                      <div className="flex justify-between items-center text-[10px] mt-3 font-mono">
                        <span className="text-slate-650">Speed: <strong className="text-slate-800 font-black">{trip.speed || 0} km/h</strong></span>
                        <span className="text-slate-400 font-semibold">{trip.timestamp ? new Date(trip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Leaflet map block */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2 flex flex-col h-[500px]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
              Fleet Tracking Map
            </h3>
            <div id="owner-map" className="flex-1 rounded-xl border border-slate-200 z-10"></div>
          </div>

        </div>

        {/* 5. Driver Roster & Maintenance Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Driver shifts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-slate-500" /> Operators Standby & Shifts
            </h3>
            
            {drivers.length === 0 ? (
              <p className="text-slate-450 text-center py-8">No drivers provisioned.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
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
                        <strong className="text-slate-800 font-extrabold uppercase">{busNumber}</strong>
                        <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider block mt-1 ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isActive ? 'ON DUTY' : 'STANDBY'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Maintenance checkpoints */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <Hammer className="h-4 w-4 text-slate-500" /> Fleet Maintenance & Garages
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
              {maintenanceBuses.map(bus => (
                <div key={bus.id} className="p-3 bg-slate-50/50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-800 uppercase block font-extrabold">{bus.bus_number}</strong>
                    <span className="text-[10px] text-slate-450 capitalize block">{bus.source} &rarr; {bus.destination}</span>
                  </div>
                  <span className="bg-slate-200 border border-slate-300 text-slate-650 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                    Garaged / Inspect
                  </span>
                </div>
              ))}
              {activeTripsList.map(trip => {
                const bus = buses.find(b => b.id === trip.bus_id);
                if (!bus) return null;
                return (
                  <div key={trip.id} className="p-3 bg-emerald-500/5 border border-emerald-150 rounded-xl flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 uppercase block font-extrabold">{bus.bus_number}</strong>
                      <span className="text-[10px] text-slate-450 capitalize block">{bus.source} &rarr; {bus.destination}</span>
                    </div>
                    <span className="bg-emerald-100 border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded text-[8px] font-black uppercase">
                      In Transit
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* 6. Quick Actions Console (Zoho tabbed form block) */}
        <div id="action-center" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-100 pb-3 gap-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Quick Actions Console</h3>
              <span className="text-[9px] text-slate-400 font-bold block mt-0.5">Provision team accounts and run fleet assignments</span>
            </div>
            
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-bold">
              <button
                onClick={() => setActionTab('driver')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  actionTab === 'driver' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                Add Driver
              </button>
              <button
                onClick={() => setActionTab('manager')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  actionTab === 'manager' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                Add Manager
              </button>
              <button
                onClick={() => setActionTab('assign')}
                className={`px-3 py-1.5 rounded-md transition-all cursor-pointer ${
                  actionTab === 'assign' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-805'
                }`}
              >
                Assign Bus
              </button>
            </div>
          </div>

          <div className="max-w-2xl text-slate-700">
            {actionTab === 'driver' && (
              <form onSubmit={handleCreateDriverSubmit} className="space-y-4">
                {drvError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">{drvError}</div>}
                {drvSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">{drvSuccess}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-450 tracking-wider block mb-1">Driver Name</label>
                    <input type="text" required placeholder="e.g. John Doe" value={drvName} onChange={(e) => setDrvName(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Email Address</label>
                    <input type="email" required placeholder="driver@company.com" value={drvEmail} onChange={(e) => setDrvEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Password</label>
                    <input type="password" required placeholder="Min. 8 characters" value={drvPassword} onChange={(e) => setDrvPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">License Number</label>
                    <input type="text" required placeholder="EX: DL-12345" value={drvLicense} onChange={(e) => setDrvLicense(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Phone Number</label>
                    <input type="tel" required placeholder="EX: +919876543210" value={drvPhone} onChange={(e) => setDrvPhone(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                </div>
                <button type="submit" disabled={drvLoading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg uppercase tracking-wider text-[10px] cursor-pointer transition-colors shadow-xs">
                  Provision Driver
                </button>
              </form>
            )}

            {actionTab === 'manager' && (
              <form onSubmit={handleCreateManagerSubmit} className="space-y-4">
                {mngError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">{mngError}</div>}
                {mngSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">{mngSuccess}</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Manager Name</label>
                    <input type="text" required placeholder="e.g. Sarah Smith" value={mngName} onChange={(e) => setMngName(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Email Address</label>
                    <input type="email" required placeholder="manager@company.com" value={mngEmail} onChange={(e) => setMngEmail(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Login Password</label>
                    <input type="password" required placeholder="Min. 8 characters" value={mngPassword} onChange={(e) => setMngPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2 px-3 outline-none focus:border-brand-500 font-bold" />
                  </div>
                </div>
                <button type="submit" disabled={mngLoading} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg uppercase tracking-wider text-[10px] cursor-pointer transition-colors shadow-xs">
                  Provision Manager
                </button>
              </form>
            )}

            {actionTab === 'assign' && (
              <form onSubmit={handleAssignDriverSubmit} className="space-y-4">
                {assignError && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">{assignError}</div>}
                {assignSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">{assignSuccess}</div>}
                
                {drivers.length === 0 || buses.length === 0 ? (
                  <p className="text-slate-400 font-bold text-[11px] py-2">No standby drivers or fleet vehicles available.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Select Driver</label>
                      <select value={assignDriverId} onChange={(e) => setAssignDriverId(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2.5 px-3 outline-none focus:border-brand-500 font-bold cursor-pointer">
                        {drivers.map(drv => (
                          <option key={drv.id} value={drv.id}>Driver ID: {drv.id} ({drv.license_number})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-extrabold uppercase text-slate-455 tracking-wider block mb-1">Assign Bus</label>
                      <select value={assignBusId} onChange={(e) => setAssignBusId(e.target.value)} className="w-full bg-slate-50 border border-slate-200/80 rounded-lg py-2.5 px-3 outline-none focus:border-brand-500 font-bold cursor-pointer">
                        {buses.map(bus => (
                          <option key={bus.id} value={bus.id}>{bus.bus_number} ({bus.source} to {bus.destination})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
                
                <button type="submit" disabled={assignLoading || drivers.length === 0 || buses.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg uppercase tracking-wider text-[10px] cursor-pointer transition-colors shadow-xs">
                  Save Assignment
                </button>
              </form>
            )}
          </div>
        </div>

        {/* 7. Passenger Bookings Ledger (Zoho Books style table) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Passenger Bookings Log</h3>
              <span className="text-[9px] text-slate-400 font-bold mt-0.5 block">Audit log of tickets purchased for scheduled routes</span>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-150 px-2.5 py-1 rounded-full">
              {bookings.length} Bookings Total
            </span>
          </div>

          {bookings.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Ticket className="h-7 w-7 text-slate-300 mx-auto mb-1.5" />
              <span>No tickets sold.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 uppercase tracking-widest font-extrabold text-[9px] border-b border-slate-200">
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Traveler</th>
                    <th className="py-3 px-3">Bus Number</th>
                    <th className="py-3 px-3">Route Map</th>
                    <th className="py-3 px-3">Seat</th>
                    <th className="py-3 px-3 text-right">Fare Value</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[...bookings].reverse().map(b => {
                    const bus = buses.find(busItem => busItem.id === b.bus_id);
                    const busNumber = bus ? bus.bus_number : `#${b.bus_id}`;
                    const routeName = bus ? `${bus.source} to ${bus.destination}` : 'Unknown';

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-950">#BMS-{b.id}</td>
                        <td className="py-3 px-3">Traveler #{b.user_id}</td>
                        <td className="py-3 px-3 uppercase font-bold text-slate-800">{busNumber}</td>
                        <td className="py-3 px-3 capitalize text-slate-450">{routeName}</td>
                        <td className="py-3 px-3 font-bold text-slate-800">Seat {b.seat_number}</td>
                        <td className="py-3 px-3 text-right font-extrabold text-slate-900">&#8377;{farePerSeat}</td>
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
        </div>

      </div>

    </div>
  );
};

export default OwnerDashboard;
