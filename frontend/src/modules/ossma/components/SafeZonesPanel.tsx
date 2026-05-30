import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation, Hospital, Building, Flame, Pill, Shield, Loader2, Plus, Trash2, Pencil, X, Check } from 'lucide-react';
import { useStore } from '../../../store/useStore';
import toast from 'react-hot-toast';
import {
  fetchNearbyFacilities,
  fetchSavedSafeZones,
  createSavedSafeZone,
  updateSavedSafeZone,
  deleteSavedSafeZone,
} from '../apis/safezones.api';
import type { SavedSafeZone, SafeZoneType, CreateSafeZoneInput } from '../types/safezone.types';
import { SAFE_ZONE_TYPES, validateCreateSafeZone } from '../schemas/safezone.schema';

const FACILITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  hospital: { icon: <Hospital size={14} />, color: '#00E5FF', label: 'Hospital' },
  clinic: { icon: <Hospital size={14} />, color: '#00BCD4', label: 'Clinic' },
  school: { icon: <Building size={14} />, color: '#FFC857', label: 'School / Shelter' },
  fire_station: { icon: <Flame size={14} />, color: '#FF6B35', label: 'Fire Station' },
  pharmacy: { icon: <Pill size={14} />, color: '#2EF2A3', label: 'Pharmacy' },
  police: { icon: <Shield size={14} />, color: '#7B61FF', label: 'Police Station' },
  shelter: { icon: <Building size={14} />, color: '#A78BFA', label: 'Shelter' },
  other: { icon: <MapPin size={14} />, color: '#94a3b8', label: 'Other' },
};

type ActiveTab = 'nearby' | 'saved';
const FILTERS = ['all', 'hospital', 'clinic', 'school', 'fire_station', 'pharmacy', 'police'] as const;
type FilterType = (typeof FILTERS)[number];

const BLANK_FORM: CreateSafeZoneInput = { name: '', type: 'hospital', lat: 0, lng: 0, address: '', phone: '', notes: '' };

export function SafeZonesPanel() {
  const { facilities, setFacilities, userLocation, setUserLocation } = useStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('nearby');
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoadingLoc, setIsLoadingLoc] = useState(false);
  const [isLoadingFac, setIsLoadingFac] = useState(false);
  const [showLocationHelp, setShowLocationHelp] = useState(false);

  // Saved safe zones state
  const [saved, setSaved] = useState<SavedSafeZone[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateSafeZoneInput>(BLANK_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Nearby facilities ───────────────────────────────────────────────

  const getLocation = async () => {
    setIsLoadingLoc(true);
    try {
      if (!navigator.geolocation) { toast.error('Geolocation not supported'); setIsLoadingLoc(false); return; }
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        if (perm.state === 'denied') { setShowLocationHelp(true); setIsLoadingLoc(false); return; }
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          setIsLoadingLoc(false);
          loadNearby(loc.lat, loc.lng);
        },
        (err) => {
          setIsLoadingLoc(false);
          if (err.code === err.PERMISSION_DENIED) setShowLocationHelp(true);
          else toast.error('Unable to determine your location');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } catch { setIsLoadingLoc(false); toast.error('Could not access location services'); }
  };

  const loadNearby = async (lat: number, lng: number) => {
    setIsLoadingFac(true);
    try {
      const data = await fetchNearbyFacilities(lat, lng, 15000);
      setFacilities(data);
    } catch { toast.error('Could not load nearby facilities'); }
    finally { setIsLoadingFac(false); }
  };

  useEffect(() => {
    if (userLocation && facilities.length === 0) loadNearby(userLocation.lat, userLocation.lng);
  }, []);

  // ─── Saved safe zones CRUD ───────────────────────────────────────────

  const loadSaved = async () => {
    setIsLoadingSaved(true);
    try { setSaved(await fetchSavedSafeZones()); }
    catch { toast.error('Could not load saved safe zones'); }
    finally { setIsLoadingSaved(false); }
  };

  useEffect(() => { if (activeTab === 'saved') loadSaved(); }, [activeTab]);

  const openCreate = () => {
    setEditingId(null);
    setForm(userLocation
      ? { ...BLANK_FORM, lat: userLocation.lat, lng: userLocation.lng }
      : BLANK_FORM);
    setShowForm(true);
  };

  const openEdit = (zone: SavedSafeZone) => {
    setEditingId(zone.id);
    setForm({ name: zone.name, type: zone.type, lat: zone.lat, lng: zone.lng, address: zone.address, phone: zone.phone, notes: zone.notes });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    const err = validateCreateSafeZone(form);
    if (err) { toast.error(err); return; }
    setIsSaving(true);
    try {
      if (editingId) {
        const updated = await updateSavedSafeZone(editingId, form);
        setSaved((prev) => prev.map((z) => (z.id === editingId ? updated : z)));
        toast.success('Safe zone updated');
      } else {
        const created = await createSavedSafeZone(form);
        setSaved((prev) => [created, ...prev]);
        toast.success('Safe zone saved');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save safe zone'); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSavedSafeZone(id);
      setSaved((prev) => prev.filter((z) => z.id !== id));
      toast.success('Safe zone removed');
    } catch { toast.error('Failed to delete safe zone'); }
  };

  const filtered = filter === 'all' ? facilities : facilities.filter((f) => f.type === filter);

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full" style={{ background: '#050816' }}>
      {/* Header */}
      <div className="px-4 py-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(0,229,255,0.1)', background: 'rgba(5,8,22,0.95)' }}>
        <div className="flex items-center gap-3 mb-3">
          <MapPin size={18} className="text-cyan-400" />
          <div>
            <div className="text-white font-bold text-base">Safe Zones</div>
            <div className="text-slate-500 text-xs">Hospitals, shelters, emergency services</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {(['nearby', 'saved'] as ActiveTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize"
              style={activeTab === tab
                ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
              {tab === 'nearby' ? 'Nearby' : 'My Saved'}
            </button>
          ))}
        </div>

        {activeTab === 'nearby' && !userLocation && (
          <motion.button onClick={getLocation} disabled={isLoadingLoc} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
            {isLoadingLoc ? <Loader2 size={16} className="animate-spin" /> : <Navigation size={16} />}
            {isLoadingLoc ? 'Getting location...' : 'Find Safe Zones Near Me'}
          </motion.button>
        )}
        {activeTab === 'nearby' && userLocation && (
          <div className="text-xs text-green-400 flex items-center gap-2">
            <Navigation size={12} /> Location active • {isLoadingFac ? 'Loading...' : `${facilities.length} facilities found`}
          </div>
        )}
        {activeTab === 'saved' && (
          <button onClick={openCreate}
            className="w-full py-2 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
            <Plus size={16} /> Add Safe Zone
          </button>
        )}
      </div>

      {/* Nearby filters */}
      {activeTab === 'nearby' && (
        <div className="px-4 py-3 flex gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={filter === f
                ? { background: 'rgba(0,229,255,0.15)', border: '1px solid rgba(0,229,255,0.3)', color: '#00E5FF' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#64748b' }}>
              {f === 'all' ? `All (${facilities.length})` : FACILITY_CONFIG[f]?.label}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2">

        {/* ── Nearby tab ── */}
        {activeTab === 'nearby' && (
          <>
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
              const cfg = FACILITY_CONFIG[facility.type] ?? FACILITY_CONFIG.other;
              return (
                <motion.div key={facility.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{facility.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: cfg.color }}>{cfg.label}</div>
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
          </>
        )}

        {/* ── Saved tab ── */}
        {activeTab === 'saved' && (
          <>
            {isLoadingSaved && (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 size={18} className="animate-spin text-cyan-400" />
                <span className="text-slate-400 text-sm">Loading saved zones...</span>
              </div>
            )}
            {!isLoadingSaved && saved.length === 0 && (
              <div className="text-center py-12">
                <MapPin size={40} className="mx-auto mb-3 text-slate-700" />
                <p className="text-slate-500 text-sm">No saved safe zones yet</p>
                <p className="text-slate-600 text-xs mt-1">Tap "Add Safe Zone" to save one</p>
              </div>
            )}
            {saved.map((zone, i) => {
              const cfg = FACILITY_CONFIG[zone.type] ?? FACILITY_CONFIG.other;
              return (
                <motion.div key={zone.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-4 flex items-start gap-3"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-sm truncate">{zone.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: cfg.color }}>{cfg.label}</div>
                    {zone.address && <div className="text-xs text-slate-500 mt-0.5 truncate">{zone.address}</div>}
                    {zone.phone && <div className="text-xs text-green-400 mt-0.5">📞 {zone.phone}</div>}
                    {zone.notes && <div className="text-xs text-slate-400 mt-0.5 truncate italic">{zone.notes}</div>}
                    <div className="text-xs text-slate-600 mt-1">{zone.lat.toFixed(4)}, {zone.lng.toFixed(4)}</div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => openEdit(zone)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => handleDelete(zone.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(255,80,80,0.1)', color: '#ff5050' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* Add/Edit form modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm mx-4 rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(5,8,22,0.98)', border: '1px solid rgba(0,229,255,0.2)' }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-white font-bold">{editingId ? 'Edit Safe Zone' : 'Add Safe Zone'}</h3>
                <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X size={18} /></button>
              </div>

              {/* Name */}
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Name *"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

              {/* Type */}
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SafeZoneType })}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                {SAFE_ZONE_TYPES.map((t) => (
                  <option key={t} value={t} style={{ background: '#050816' }}>{FACILITY_CONFIG[t]?.label ?? t}</option>
                ))}
              </select>

              {/* Lat / Lng */}
              <div className="flex gap-2">
                <input type="number" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })}
                  placeholder="Latitude *"
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
                <input type="number" value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })}
                  placeholder="Longitude *"
                  className="flex-1 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>

              {/* Address */}
              <input value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Address"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

              {/* Phone */}
              <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

              {/* Notes */}
              <textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Notes" rows={2}
                className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none resize-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />

              {/* Use current location */}
              {userLocation && (
                <button onClick={() => setForm({ ...form, lat: userLocation.lat, lng: userLocation.lng })}
                  className="text-xs text-cyan-400 flex items-center gap-1 hover:text-cyan-300">
                  <Navigation size={11} /> Use my current location
                </button>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowForm(false)}
                  className="flex-1 py-2 rounded-xl text-sm text-slate-400 border"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={isSaving}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold text-black flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
                  {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {editingId ? 'Update' : 'Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Location help modal */}
      {showLocationHelp && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="max-w-md mx-4 rounded-2xl p-6"
            style={{ background: 'rgba(5,8,22,0.98)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <h3 className="text-white text-lg font-bold mb-3">Location Access Blocked</h3>
            <p className="text-slate-300 text-sm mb-4">Your browser is blocking location access.</p>
            <ol className="list-decimal list-inside text-sm text-slate-400 space-y-1 mb-5">
              <li>Click the lock icon next to the URL</li>
              <li>Open Site Settings</li>
              <li>Set Location to Allow</li>
              <li>Refresh the page</li>
            </ol>
            <button onClick={() => setShowLocationHelp(false)}
              className="w-full py-2 rounded-xl font-medium text-black"
              style={{ background: 'linear-gradient(135deg, #00E5FF, #2EF2A3)' }}>
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
