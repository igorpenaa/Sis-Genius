import { Navigate } from 'react-router-dom';

export function PartsPage() {
  return <Navigate to="/store/parts/list" replace />;
}