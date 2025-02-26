import { Navigate } from 'react-router-dom';

export function EmployeesPage() {
  return <Navigate to="/employees/list" replace />;
}