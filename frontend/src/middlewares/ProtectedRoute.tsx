import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface Props {
  children: ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const { username } = useStore();
  if (!username) return <Navigate to="/" replace />;
  return <>{children}</>;
}
