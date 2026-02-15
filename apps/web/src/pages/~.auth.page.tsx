import { Outlet } from 'react-router';

// Auth layout - no navbar/sidebar, just the auth pages
export default function AuthLayout() {
  return <Outlet />;
}
