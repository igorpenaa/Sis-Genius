import { Navigate } from 'react-router-dom';

export function ServiceQuotesPage() {
  return <Navigate to="/quotes/services/list" replace />;
}