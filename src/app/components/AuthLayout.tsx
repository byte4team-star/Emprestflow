import { Outlet } from 'react-router';
import { AuthProvider } from '../lib/auth-context';
import { Toaster } from './ui/sonner';

export default function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
      <Toaster />
    </AuthProvider>
  );
}