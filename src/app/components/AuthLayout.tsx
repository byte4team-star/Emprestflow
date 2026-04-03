// src/components/AuthLayout.tsx
import { ReactNode } from "react";
import { AuthProvider } from "../lib/auth-context";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthProvider>{children}</AuthProvider>;
}