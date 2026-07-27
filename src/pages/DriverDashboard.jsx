import React, { useState, useEffect, useRef } from 'react';
import { Bus, MapPin, ShieldAlert, Award, Calendar, RefreshCw, Clock, Navigation, Play, Pause, Square, Power, Compass } from 'lucide-react';
import driverAPI from '../services/driverAPI';
import tripAPI from '../services/tripAPI';
import Loading from '../components/Loading';

export const DriverDashboard = () => {
  const [assignedBus, setAssignedBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [notifications, setNotifications] = useState([]);

  const trackingIntervalRef = useRef(null);

  const addNotification = (text) => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNotifications((prev) => [{ text, time }, ...prev].slice(0, 10));
  };

  const fetchDutyAndTripData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const busData = await driverAPI.getMyAssignedBus();
      if (busData && busData.bus_id) {
        setAssignedBus(busData);
        
        const tripData = await tripAPI.getDriverActiveTrip(busData.driver_id);
        if (tripData) {
          setActiveTrip(tripData);
          addNotification(`Active trip running. Status: ${tripData.status}`);
        } else {
          setActiveTrip(null);
        }
      } else {
        setAssignedBus(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to retrieve duty and trip status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDutyAndTripData();
    return () => {
      if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (activeTrip && activeTrip.status === 'ACTIVE' && gpsEnabled) {
      startGpsReporting();
    } else {
      stopGpsReporting();
    }
  }, [activeTrip?.status, gpsEnabled]);

  const enableGpsAccess = () => {
    setErrorMsg('');
    setInfoMsg('');
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsEnabled(true);
        setGpsCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed || 0,
        });
        setInfoMsg('GPS satellite transponder synced.');
        addNotification('Location services activated.');
      },
      (error) => {
        console.error(error);
        setGpsEnabled(false);
        setErrorMsg('Location permission denied. Please allow GPS access in settings.');
        addNotification('GPS authentication failed.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const startGpsReporting = () => {
    if (trackingIntervalRef.current) clearInterval(trackingIntervalRef.current);
    reportGpsLocation();
    trackingIntervalRef.current = setInterval(() => {
      reportGpsLocation();
    }, 5000);
  };

  const stopGpsReporting = () => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  };

  const reportGpsLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const speedKmh = position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) : '0.0';
        
        setGpsCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: speedKmh
        });

        if (activeTrip && activeTrip.id) {
          try {
            await tripAPI.updateLocation({
              driver_id: assignedBus.driver_id,
              bus_id: assignedBus.bus_id,
              trip_id: activeTrip.id,
              latitude: lat,
              longitude: lng,
              speed: speedKmh,
              status: activeTrip.status,
              timestamp: new Date(position.timestamp).toISOString()
            });
          } catch (err) {
            console.error('Failed to report live GPS coordinates:', err);
          }
        }
      },
      (err) => {
        console.error('Error fetching position:', err);
        addNotification('GPS signal weak.');
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const handleStartTrip = async () => {
    if (!gpsEnabled) {
      setErrorMsg('Please activate GPS transponder before starting dispatch.');
      return;
    }
    setErrorMsg('');
    setInfoMsg('');
    try {
      const newTrip = await tripAPI.startTrip({
        bus_id: assignedBus.bus_id,
        driver_id: assignedBus.driver_id
      });
      setActiveTrip(newTrip);
      addNotification('Trip Started successfully.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to start dispatch run.');
    }
  };

  const handlePauseTrip = async () => {
    if (!activeTrip) return;
    setErrorMsg('');
    setInfoMsg('');
    try {
      await tripAPI.updateStatus(activeTrip.id, 'PAUSED');
      setActiveTrip({ ...activeTrip, status: 'PAUSED' });
      addNotification('Trip delayed / paused.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to pause shift.');
    }
  };

  const handleResumeTrip = async () => {
    if (!activeTrip) return;
    setErrorMsg('');
    setInfoMsg('');
    try {
      await tripAPI.updateStatus(activeTrip.id, 'ACTIVE');
      setActiveTrip({ ...activeTrip, status: 'ACTIVE' });
      addNotification('Trip resumed.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to resume shift.');
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    if (!window.confirm('Confirm trip end? This will close operational logs.')) return;
    setErrorMsg('');
    setInfoMsg('');
    try {
      await tripAPI.updateStatus(activeTrip.id, 'COMPLETED');
      setActiveTrip(null);
      setGpsCoordinates(null);
      addNotification('Trip Completed.');
      setInfoMsg('Shift run successfully archived.');
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to complete trip.');
    }
  };

  if (loading) return <Loading message="Querying route dispatch systems..." />;

  // Support empty state if not assigned
  if (!assignedBus) {
    return (
      <div className="bg-slate-50 min-h-screen font-sans text-slate-800 p-4 antialiased flex flex-col items-center justify-center">
        <div className="max-w-md w-full bg-white border border-slate-200 p-8 text-center rounded-2xl shadow-xs space-y-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto border border-rose-100">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h2 className="font-extrabold text-sm uppercase text-slate-900 tracking-wider font-extrabold">NO VEHICLE ASSIGNED</h2>
            <p className="text-slate-400 text-xs leading-relaxed font-semibold">
              Please contact the garage dispatcher. No active routes or vehicles are currently assigned to your driver ID.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isTripActive = activeTrip && activeTrip.status === 'ACTIVE';
  const isTripPaused = activeTrip && activeTrip.status === 'PAUSED';

  // Speedometer circular dial values
  const currentSpeed = gpsCoordinates ? parseFloat(gpsCoordinates.speed) : 0;
  const maxSpeed = 120;
  const strokeDashoffset = 250 - (Math.min(currentSpeed, maxSpeed) / maxSpeed) * 250;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased p-4 sm:p-6 select-none max-w-md mx-auto flex flex-col justify-between shadow-2xl border-x border-slate-900 rounded-3xl my-6">
      
      {/* 1. Header (Uber Driver HUD style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-slate-850 p-2 rounded-xl text-brand-400 border border-slate-800">
            <Bus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase text-white leading-tight">{assignedBus.bus_number}</h1>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-0.5">Active Transponder</span>
          </div>
        </div>
        <button
          onClick={fetchDutyAndTripData}
          className="p-2 rounded-xl bg-slate-850 border border-slate-800 text-slate-450 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="my-4 space-y-4 flex-1">
        
        {/* Banner messages */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs font-semibold rounded-xl flex items-center gap-2">
            <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {infoMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 text-xs font-semibold rounded-xl flex items-center gap-2">
            <Award className="h-4.5 w-4.5 flex-shrink-0" />
            <span>{infoMsg}</span>
          </div>
        )}

        {/* GPS satellite transponder switch */}
        {!gpsEnabled && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs flex flex-col gap-3 font-semibold">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0 animate-bounce" />
              <span>Location transponder offline. GPS permissions needed.</span>
            </div>
            <button
              onClick={enableGpsAccess}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] py-2.5 rounded-lg uppercase tracking-wider transition-colors cursor-pointer"
            >
              Sync Satellite GPS
            </button>
          </div>
        )}

        {/* Linear timeline checklist (Swiggy Delivery style checkpoint) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <span className="text-[8px] text-slate-450 font-extrabold uppercase tracking-widest block border-b border-slate-800 pb-2">Shift Hub Checkpoints</span>
          
          <div className="relative pl-6 space-y-6 text-xs text-slate-400 font-semibold">
            <div className="absolute left-[5px] top-1.5 bottom-1.5 w-0.5 bg-slate-800"></div>

            <div className="relative">
              <span className="absolute -left-[24px] top-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900 shadow-lg"></span>
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Boarding Station</span>
              <strong className="text-white text-xs font-extrabold block capitalize mt-0.5">{assignedBus.source}</strong>
            </div>

            <div className="relative">
              <span className="absolute -left-[24px] top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 border-2 border-slate-900 shadow-lg"></span>
              <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Arrival Terminus</span>
              <strong className="text-white text-xs font-extrabold block capitalize mt-0.5">{assignedBus.destination}</strong>
            </div>
          </div>
        </div>

        {/* Speedometer Gauge Dial HUD */}
        {activeTrip ? (
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 flex flex-col items-center justify-center shadow-lg relative">
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[8px] font-mono uppercase tracking-widest text-emerald-400 font-bold">Transmitting Telemetry</span>
            </div>

            {/* Circular Speed dial */}
            <div className="relative flex items-center justify-center w-36 h-36">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="72" cy="72" r="45" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                <circle 
                  cx="72" 
                  cy="72" 
                  r="45" 
                  stroke="#3e4edb" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="282"
                  strokeDashoffset={282 - (Math.min(currentSpeed, 100) / 100) * 282}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-white tracking-tight leading-none">{currentSpeed}</span>
                <span className="text-[8px] text-slate-400 uppercase tracking-widest font-extrabold mt-1">KM/H</span>
              </div>
            </div>

            {/* Coordinates info footer */}
            <div className="w-full border-t border-slate-800/80 pt-3 mt-3 grid grid-cols-2 text-[10px] text-slate-400 font-mono font-bold">
              <div className="text-left border-r border-slate-800 pr-2">
                <span className="text-[8px] block font-sans uppercase text-slate-500">Latitude</span>
                <span className="text-white">{gpsCoordinates ? parseFloat(gpsCoordinates.latitude).toFixed(6) : '0.000000'}</span>
              </div>
              <div className="text-right pl-2">
                <span className="text-[8px] block font-sans uppercase text-slate-500">Longitude</span>
                <span className="text-white">{gpsCoordinates ? parseFloat(gpsCoordinates.longitude).toFixed(6) : '0.000000'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <Compass className="h-8 w-8 text-slate-700 animate-spin" />
            <h4 className="font-extrabold uppercase text-slate-300 text-xs">Transponder Idle</h4>
            <p className="text-[10px] leading-relaxed max-w-[200px] leading-normal font-semibold">
              Live telemetry is offline. Press Start Trip below to begin broadcasting coordinates.
            </p>
          </div>
        )}

      </div>

      {/* 5. Mobile Touch controller buttons */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        {!activeTrip ? (
          <button
            onClick={handleStartTrip}
            disabled={!gpsEnabled}
            className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
              gpsEnabled
                ? 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-600/10'
                : 'bg-slate-800 text-slate-500 border border-slate-800/50 cursor-not-allowed'
            }`}
          >
            <Power className="h-4.5 w-4.5" />
            <span>START TRIP</span>
          </button>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {isTripActive && (
                <button
                  onClick={handlePauseTrip}
                  className="py-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Pause className="h-4 w-4" />
                  <span>PAUSE SHIFT</span>
                </button>
              )}

              {isTripPaused && (
                <button
                  onClick={handleResumeTrip}
                  className="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="h-4 w-4" />
                  <span>RESUME SHIFT</span>
                </button>
              )}

              <button
                onClick={handleEndTrip}
                className="py-3.5 bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Square className="h-4 w-4 text-rose-500" />
                <span>END SHIFT</span>
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DriverDashboard;
