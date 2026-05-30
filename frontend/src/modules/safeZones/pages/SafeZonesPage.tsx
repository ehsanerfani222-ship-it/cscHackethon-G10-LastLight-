import { MapView } from '../components/MapView';
import { SafeZonesPanel } from '../components/SafeZonesPanel';

export function SafeZonesPage() {
  return (
    <div className="w-full h-full flex" style={{ background: '#050816' }}>
      <div className="flex-1 relative">
        <MapView />
      </div>
      <div className="w-[420px] flex-shrink-0 h-full" style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', boxShadow: '-10px 0 30px rgba(0,0,0,0.5)' }}>
        <SafeZonesPanel />
      </div>
    </div>
  );
}
