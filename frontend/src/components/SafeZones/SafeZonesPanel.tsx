import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Hospital, Building, Flame, Pill, Shield, Loader2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { fetchFacilities } from '../../services/api';

import toast from 'react-hot-toast';

const FACILITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  hospital: { icon: <Hospital size={14} />, color: '#00E5FF', label: 'Hospital' },
  clinic: { icon: <Hospital size={14} />, color: '#00BCD4', label: 'Clinic' },
  school: { icon: <Building size={14} />, color: '#FFC857', label: 'School / Shelter' },
  fire_station: { icon: <Flame size={14} />, color: '#FF6B35', label: 'Fire Station' },
  pharmacy: { icon: <Pill size={14} />, color: '#2EF2A3', label: 'Pharmacy' },
  police: { icon: <Shield size={14} />, color: '#7B61FF', label: 'Police Station' },
};

const FILTERS = ['all', 'hospital', 'clinic', 'school', 'fire_station', 'pharmacy', 'police'] as const;
type FilterType = (typeof FILTERS)[number];

export function SafeZonesPanel() {
  const { facilities, setFacilities, userLocation, setUserLocation} = useStore();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);
  const [isLoadingFac, setIsLoadingFac] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);

  const getLocation = async () => {
    setIsLoadingLoc(true);

    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by this browser');
        setIsLoadingLoc(false);
        return;
      }

      // Browser supports Permissions API
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({
          name: 'geolocation' as PermissionName,
        });

        if (permission.state === 'denied') {
          setShowLocationHelp(true);
          setIsLoadingLoc(false);
          return;
        }
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };

          setUserLocation(loc);
          setIsLoadingLoc(false);
          loadFacilities(loc.lat, loc.lng);
        },
        (error) => {
          setIsLoadingLoc(false);

          if (error.code === error.PERMISSION_DENIED) {
            setShowLocationHelp(true);
          } else {
            toast.error('Unable to determine your location');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } catch {
      setIsLoadingLoc(false);
      toast.error('Could not access location services');
    }
  };

  const loadFacilities = async (lat: number, lng: number) => {
    setIsLoadingFac(true);
    try {
      const data = await fetchFacilities(lat, lng, 15000);
      setFacilities(data);
    } catch { toast.error('Could not load nearby facilities'); }
    finally { setIsLoadingFac(false); }
  };

  useEffect(() => {
    if (userLocation && facilities.length === 0) {
      loadFacilities(userLocation.lat, userLocation.lng);
    }
  }, []);

  const filtered = filter === 'all' ? facilities : facilities.filter((f) => f.type === filter);

  return (
    <div className="flex flex-col h-full" style={{ background: '#050816' }}>
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
        <div className="flex items-center gap-3 mb-3">
          <MapPin size={18} className="text-cyan-400" />
          <div>
            <div className="text-white font-bold text-base">Safe Zones</div>
            <div className="text-slate-500 text-xs">Hospitals, shelters, emergency services near you</div>
          </div>
        </div>

        {!userLocation ? (
          <motion.button onClick={getLocation} disabled={isLoadingLoc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
            {isLoadingLoc ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {isLoadingLoc ? 'Getting location...' : 'Find Safe Zones Near Me'}
          </motion.button>
        ) : (
          <div className="text-xs text-green-400 flex items-center gap-2">
            <Navigation size={12} /> Location active • {isLoadingFac ? 'Loading facilities...' : `${facilities.length} facilities found`}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="px-4 py-3 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
            style={filter === f ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }
              : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
            {f === 'all' ? `All (${facilities.length})` : FACILITY_CONFIG[f]?.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">
        {!userLocation && (
          <div className="text-center py-12">
            <MapPin size={40} className="mx-auto mb-3 text-slate-700" />
            <p className="text-slate-500 text-sm">Enable location to see safe zones</p>
          </div>
        )}

        {isLoadingFac && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={18} className="animate-spin text-cyan-400" />
            <span className="text-slate-400 text-sm">Scanning OpenStreetMap...</span>
          </div>
        )}

        {filtered.map((facility, i) => {
          const config = FACILITY_CONFIG[facility.type] ?? FACILITY_CONFIG.clinic;
          return (
            <motion.div key={facility.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${config.color}15`, color: config.color, border: `1px solid ${config.color}30` }}>
                {config.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-medium text-sm truncate">{facility.name}</div>
                <div className="text-xs mt-0.5" style={{ color: config.color }}>{config.label}</div>
                {facility.address && <div className="text-xs text-slate-500 mt-0.5 truncate">{facility.address}</div>}
                {facility.phone && <div className="text-xs text-green-400 mt-0.5">📞 {facility.phone}</div>}
              </div>
              {facility.distanceKm !== undefined && (
                <div className="text-right flex-shrink-0">
                  <div className="text-white font-bold text-sm">{facility.distanceKm}</div>
                  <div className="text-xs text-slate-500">km</div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {showLocationHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div
            className="max-w-md mx-4 rounded-2xl p-6"
            style={{
              background: 'rgba(5,8,22,0.98)',
              border: '1px solid rgba(0,229,255,0.2)',
            }}
          >
            <h3 className="text-white text-lg font-bold mb-3">
              Location Access Blocked
            </h3>

            <p className="text-slate-300 text-sm mb-4">
              Your browser is currently blocking location access for LastLight.
            </p>

            <div className="text-sm text-slate-400 space-y-2 mb-5">
              <p className="font-medium text-slate-200">
                To enable location access:
              </p>

              <ol className="list-decimal list-inside space-y-1">
                <li>Click the lock icon next to the website address.</li>
                <li>Open Site Settings.</li>
                <li>Set Location to Allow.</li>
                <li>Refresh the page.</li>
              </ol>
            </div>

            <button
              onClick={() => setShowLocationHelp(false)}
              className="w-full py-2 rounded-xl font-medium text-black"
              style={{
                background:
                  'linear-gradient(135deg, #00E5FF, #2EF2A3)',
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
