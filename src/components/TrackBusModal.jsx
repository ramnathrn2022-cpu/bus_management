import React, { useState, useEffect, useRef } from 'react';
import { X, Navigation, MapPin, Clock, Info, ShieldAlert, CheckCircle } from 'lucide-react';
import tripAPI from '../services/tripAPI';

const CITY_COORDINATES = {
  pune: { lat: 18.5204, lng: 73.8567 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.7041, lng: 77.1025 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  goa: { lat: 15.2993, lng: 74.1240 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 }
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const calculateETA = (distanceKm, speedKmh) => {
  const speed = parseFloat(speedKmh) > 10 ? parseFloat(speedKmh) : 45.0; // standard transit speed if bus is static
  const hours = distanceKm / speed;
  const totalMinutes = Math.round(hours * 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} mins`;
  }
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

export const TrackBusModal = ({ bus, onClose }) => {
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Real time stats
  const [telemetry, setTelemetry] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null); // { source: {lat,lng}, dest: {lat,lng} }
  const [distanceRemaining, setDistanceRemaining] = useState(null);
  const [eta, setEta] = useState(null);

  const mapRef = useRef(null);
  const busMarkerRef = useRef(null);
  const wsRef = useRef(null);

  const geocodeCity = async (cityName) => {
    const cleanName = cityName.trim().toLowerCase();
    if (CITY_COORDINATES[cleanName]) {
      return CITY_COORDINATES[cleanName];
    }
    // API geocoding lookup
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (e) {
      console.error('OSM Nominatim Geocode error:', e);
    }
    return null;
  };

  const initTrackingAndMap = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch active trip for bus
      const trip = await tripAPI.getBusActiveTrip(bus.id);
      
      // We only track ACTIVE trips. If the status is NOT ACTIVE, show the empty state.
      if (trip && trip.status === 'ACTIVE') {
        setActiveTrip(trip);
        setTelemetry(trip);

        // 2. Geocode source and destination
        const sourceCoords = await geocodeCity(bus.source);
        const destCoords = await geocodeCity(bus.destination);
        
        if (sourceCoords && destCoords) {
          setRouteCoordinates({ source: sourceCoords, dest: destCoords });
        }
      } else {
        setActiveTrip(null);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to establish transit tracking bridge.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initTrackingAndMap();

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [bus.id]);

  // Handle map creation & WebSockets if active trip exists
  useEffect(() => {
    if (loading || !activeTrip || !routeCoordinates || !window.L) return;

    // 1. Initialize Map
    if (!mapRef.current) {
      const initialLat = telemetry?.latitude ? parseFloat(telemetry.latitude) : routeCoordinates.source.lat;
      const initialLng = telemetry?.longitude ? parseFloat(telemetry.longitude) : routeCoordinates.source.lng;

      mapRef.current = window.L.map('user-track-map', {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([initialLat, initialLng], 8);

      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 20
      }).addTo(mapRef.current);

      // Add Source (Pickup) and Destination Markers
      window.L.marker([routeCoordinates.source.lat, routeCoordinates.source.lng], {
        icon: window.L.divIcon({
          html: `<div class="bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"></div>`,
          className: 'marker-pickup',
          iconSize: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup(`Pickup: ${bus.source.toUpperCase()}`);

      window.L.marker([routeCoordinates.dest.lat, routeCoordinates.dest.lng], {
        icon: window.L.divIcon({
          html: `<div class="bg-red-500 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md"></div>`,
          className: 'marker-destination',
          iconSize: [14, 14]
        })
      }).addTo(mapRef.current).bindPopup(`Destination: ${bus.destination.toUpperCase()}`);

      // Draw Route Line
      const routeLine = window.L.polyline(
        [
          [routeCoordinates.source.lat, routeCoordinates.source.lng],
          [routeCoordinates.dest.lat, routeCoordinates.dest.lng]
        ],
        { color: '#f43f5e', weight: 4, opacity: 0.7, dashArray: '5, 10' }
      ).addTo(mapRef.current);

      // Adjust map bounds to fit route
      mapRef.current.fitBounds(routeLine.getBounds(), { padding: [40, 40] });
    }

    // 2. Render Bus Marker
    updateBusMarkerPosition();

    // 3. Connect WebSocket
    const wsUrl = `ws://${window.location.hostname}:8000/ws/track`;
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.trip_id === activeTrip.id) {
          setTelemetry(payload);
          if (payload.status !== 'ACTIVE') {
            // If trip gets completed or paused, trigger recheck
            initTrackingAndMap();
          }
        }
      } catch (e) {
        console.error('Failed to parse telemetry', e);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [loading, activeTrip, routeCoordinates]);

  // Recalculate remaining distance and ETA whenever telemetry updates
  useEffect(() => {
    if (!telemetry || !routeCoordinates || !telemetry.latitude || !telemetry.longitude) return;

    const busLat = parseFloat(telemetry.latitude);
    const busLng = parseFloat(telemetry.longitude);
    const destLat = routeCoordinates.dest.lat;
    const destLng = routeCoordinates.dest.lng;

    const distance = haversineDistance(busLat, busLng, destLat, destLng);
    setDistanceRemaining(distance.toFixed(1));

    const computedEta = calculateETA(distance, telemetry.speed);
    setEta(computedEta);

    updateBusMarkerPosition();
  }, [telemetry]);

  const updateBusMarkerPosition = () => {
    if (!mapRef.current || !telemetry || !telemetry.latitude || !telemetry.longitude || !window.L) return;

    const lat = parseFloat(telemetry.latitude);
    const lng = parseFloat(telemetry.longitude);

    const busIconHtml = `
      <div class="flex flex-col items-center">
        <div class="bg-rose-600 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-full shadow-md border border-white whitespace-nowrap uppercase tracking-wider">${bus.bus_number}</div>
        <div class="w-3.5 h-3.5 bg-rose-600 rounded-full border-2 border-white shadow-lg -mt-0.5 animate-pulse flex items-center justify-center">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
      </div>
    `;

    const customIcon = window.L.divIcon({
      html: busIconHtml,
      className: 'custom-user-bus-marker',
      iconSize: [50, 35],
      iconAnchor: [25, 17]
    });

    if (busMarkerRef.current) {
      busMarkerRef.current.setLatLng([lat, lng]);
    } else {
      busMarkerRef.current = window.L.marker([lat, lng], { icon: customIcon }).addTo(mapRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white border border-slate-200 w-full max-w-4xl p-6 rounded-3xl shadow-2xl flex flex-col h-[90vh] sm:h-[80vh] relative font-semibold text-slate-850">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Bus className="h-5 w-5 text-rose-500 animate-pulse" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Live Bus Tracker</h2>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">{bus.bus_number} ({bus.source} &rarr; {bus.destination})</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-xs font-bold text-slate-500">
              <Clock className="h-8 w-8 text-rose-500 animate-spin" />
              <span>Connecting live tracking server...</span>
            </div>
          ) : errorMsg ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <ShieldAlert className="h-10 w-10 text-rose-500" />
              <p className="text-sm text-slate-600">{errorMsg}</p>
            </div>
          ) : !activeTrip ? (
            /* NO ACTIVE TRIP EMPTY STATE */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-250">
              <div className="p-4 bg-white border border-slate-200 rounded-full text-slate-400 shadow-xs">
                <Navigation className="h-8 w-8 text-rose-500" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-rose-600 font-black text-sm uppercase tracking-widest">NO ACTIVE TRIP FOUND</h3>
                <p className="text-slate-450 text-xs leading-relaxed font-semibold">
                  Bus tracking will become available once the driver starts the trip.
                </p>
              </div>
            </div>
          ) : (
            /* LIVE MAP & STATS */
            <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0">
              {/* Map */}
              <div className="flex-1 rounded-2xl border border-slate-200 relative overflow-hidden h-60 md:h-full z-10">
                <div id="user-track-map" className="w-full h-full bg-slate-50"></div>
              </div>

              {/* Stats Sidebar */}
              <div className="w-full md:w-80 flex flex-col gap-4 overflow-y-auto pr-1">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Transit Telemetry</span>
                
                {/* Stats cards */}
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 text-xs font-bold text-slate-800">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-sans tracking-wider block">Estimated Arrival (ETA)</span>
                    <span className="text-base font-black text-rose-550 flex items-center gap-1.5">
                      <Clock className="h-4.5 w-4.5 text-rose-500 animate-pulse" />
                      {eta || 'Calculating...'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <span className="text-[9px] text-slate-400 uppercase font-sans tracking-wider block">Remaining Distance</span>
                    <span className="text-base font-black text-slate-850 flex items-center gap-1.5">
                      <MapPin className="h-4.5 w-4.5 text-emerald-500" />
                      {distanceRemaining ? `${distanceRemaining} km` : 'Calculating...'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 col-span-2 md:col-span-1">
                    <span className="text-[9px] text-slate-400 uppercase font-sans tracking-wider block">Bus Speed</span>
                    <span className="text-sm font-black text-slate-850">
                      {telemetry?.speed || 0} km/h
                    </span>
                  </div>
                </div>

                {/* Notifications & Route details */}
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 text-rose-600 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center gap-2 border-b border-rose-500/10 pb-2">
                    <Info className="h-4 w-4 text-rose-500 flex-shrink-0" />
                    <span className="font-extrabold uppercase tracking-wider text-[10px]">Real-Time Notifications</span>
                  </div>
                  <ul className="space-y-1.5 font-semibold text-[11px] list-disc list-inside">
                    <li>Driver started the trip successfully.</li>
                    {parseFloat(telemetry?.speed) > 10 ? (
                      <li>Bus is in motion towards target destination.</li>
                    ) : (
                      <li>Bus is currently stationary at lookup coordinates.</li>
                    )}
                    {eta && <li>Bus arriving in approximately {eta}.</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TrackBusModal;
