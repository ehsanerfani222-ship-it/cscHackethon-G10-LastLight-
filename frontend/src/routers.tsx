import { Routes, Route, Navigate } from 'react-router-dom';
import { safeZonesRoutes } from './modules/ossma/routers/safezones.router';

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/safezones" replace />} />
      {safeZonesRoutes}
    </Routes>
  );
}
