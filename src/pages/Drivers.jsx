import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, X, Search, ShieldAlert, CheckCircle, Bus, Loader2, Key, Phone } from 'lucide-react';
import driverAPI from '../services/driverAPI';
import busAPI from '../services/busAPI';
import DriverCard from '../components/DriverCard';
import Loading from '../components/Loading';
import { getRole } from '../utils/token';

export const Drivers = () => {
  const role = getRole();

  const [drivers, setDrivers] = useState([]);
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const fetchDriversAndBuses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [driversData, busesData] = await Promise.all([
        driverAPI.getAllDrivers(),
        busAPI.getAllBuses(),
      ]);
      setDrivers(driversData);
      setBuses(busesData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to fetch drivers catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriversAndBuses();
  }, []);

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSuccess('');

    if (!userId || !licenseNumber || !phone) {
      setAddError('All fields are required.');
      return;
    }

    setAddLoading(true);
    try {
      await driverAPI.addDriver({
        user_id: parseInt(userId, 10),
        license_number: licenseNumber.trim().toUpperCase(),
        phone: phone.trim()
      });

      setAddSuccess('Driver registered successfully.');
      setUserId('');
      setLicenseNumber('');
      setPhone('');
      
      fetchDriversAndBuses();
      
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess('');
      }, 1000);
    } catch (err) {
      console.error(err);
      setAddError(err.message || 'Registration failed. Check user ID role eligibility.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemoveDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to remove this driver profile?')) return;
    setErrorMsg('');
    try {
      await driverAPI.removeDriver(driverId);
      setDrivers(drivers.filter(d => d.id !== driverId));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to remove driver.');
    }
  };

  const handleOpenAssignModal = (driver) => {
    setSelectedDriver(driver);
    setSelectedBusId(driver.assigned_bus_id || '');
    setShowAssignModal(true);
  };

  const handleAssignDriver = async (e) => {
    e.preventDefault();
    setAssignError('');
    setAssignSuccess('');

    if (!selectedBusId) {
      setAssignError('Please select a bus.');
      return;
    }

    setAssignLoading(true);
    try {
      await driverAPI.assignDriver({
        driver_id: parseInt(selectedDriver.id, 10),
        bus_id: parseInt(selectedBusId, 10)
      });

      setAssignSuccess('Driver assigned successfully!');
      
      fetchDriversAndBuses();
      
      setTimeout(() => {
        setShowAssignModal(false);
        setAssignSuccess('');
        setSelectedDriver(null);
      }, 1000);
    } catch (err) {
      console.error(err);
      setAssignError(err.message || 'Failed to assign bus.');
    } finally {
      setAssignLoading(false);
    }
  };

  const busMap = {};
  buses.forEach(b => {
    busMap[b.id] = b.bus_number;
  });

  const filteredDrivers = drivers.filter(d => 
    d.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm) ||
    d.user_id.toString().includes(searchTerm)
  );

  if (loading) return <Loading message="Retrieving active operators..." />;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto space-y-6 select-none animate-fade-in bg-slate-50 min-h-screen">
      
      {/* Header card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 uppercase tracking-tight">Drivers Registry</h1>
          <p className="text-slate-400 text-xs font-semibold mt-1">Manage active operators and duty assignments</p>
        </div>

        {role === 'owner' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider text-xs shadow-md shadow-rose-600/10 cursor-pointer flex items-center gap-2"
          >
            <Plus className="h-4.5 w-4.5" />
            Add Operator
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
      <div className="relative max-w-md bg-white border border-slate-200 p-2.5 rounded-2xl shadow-xs">
        <input
          type="text"
          placeholder="Filter by License ID, Phone, User ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-50 text-slate-850 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 pl-10 text-xs font-semibold outline-none focus:border-rose-500"
        />
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400">
          <Search className="h-4 w-4" />
        </div>
      </div>

      {/* Driver cards roster */}
      {filteredDrivers.length === 0 ? (
        <div className="bg-white border border-slate-200 p-12 text-center rounded-3xl flex flex-col items-center gap-3 shadow-xs">
          <ShieldCheck className="h-10 w-10 text-slate-350" />
          <p className="text-slate-800 font-bold">No registered operators match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              busNumber={busMap[driver.assigned_bus_id]}
              onRemove={handleRemoveDriver}
              onAssignClick={handleOpenAssignModal}
            />
          ))}
        </div>
      )}

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 text-rose-500" />
                Register Operator Profile
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {addSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{addSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddDriver} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Driver Account User ID</label>
                <input
                  type="number"
                  required
                  placeholder="EX: 4"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                />
                <span className="text-[9px] text-slate-400 block mt-1 font-semibold">
                  * Operator must have registered their login account as 'Driver' role.
                </span>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">License Identification Number</label>
                <input
                  type="text"
                  required
                  placeholder="EX: DL-9999-8888"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Contact Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="EX: +919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl py-2.5 px-4 text-xs outline-none focus:border-rose-500 focus:bg-white transition-all font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full btn-premium-red py-3 rounded-xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg mt-2 cursor-pointer"
              >
                {addLoading ? 'Registering operator...' : 'ADD OPERATOR'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Driver to Bus Modal */}
      {showAssignModal && selectedDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Bus className="h-4.5 w-4.5 text-rose-500" />
                Assign Duty Vehicle
              </h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedDriver(null);
                }}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {assignError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-rose-600 text-xs flex items-center gap-2 font-semibold">
                <ShieldAlert className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{assignError}</span>
              </div>
            )}

            {assignSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle className="h-4.5 w-4.5 flex-shrink-0" />
                <span>{assignSuccess}</span>
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 text-xs text-slate-600 font-semibold space-y-2">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase">Driver Details</p>
              <div className="flex justify-between">
                <span>Roster ID: #{selectedDriver.id}</span>
                <span>License: {selectedDriver.license_number}</span>
              </div>
            </div>

            <form onSubmit={handleAssignDriver} className="space-y-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-1.5 uppercase">Select Active Fleet Bus</label>
                <select
                  required
                  value={selectedBusId}
                  onChange={(e) => setSelectedBusId(e.target.value)}
                  className="w-full bg-slate-50 text-slate-800 border border-slate-200 rounded-xl py-2.5 px-3 text-xs font-bold cursor-pointer"
                >
                  <option value="" disabled>Choose an active vehicle</option>
                  {buses.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.bus_number} ({b.source} &rarr; {b.destination})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={assignLoading}
                className="w-full btn-premium-red py-3 rounded-xl uppercase tracking-wider text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg mt-2 cursor-pointer"
              >
                {assignLoading ? 'Saving Assignment...' : 'ASSIGN BUS'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Drivers;
