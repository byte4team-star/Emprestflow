import { RouterProvider } from "react-router";
import { router } from "./routes";
import { AuthProvider } from "./lib/auth-context";
import { Toaster } from "./components/ui/sonner";
import { useEffect } from "react";

// Force cache bust - Updated: 2026-04-02T20:30:00
console.log(
  "[APP_INIT] Loading App component - Version 2026-04-02T20:30:00",
);

export default function App() {
  useEffect(() => {
    console.log(
      "[APP] Component mounted - AuthProvider should be wrapping everything",
    );
    console.log("[APP] Version: 2026-04-02T20:30:00");
  }, []);

  console.log(
    "[APP] Rendering App component with AuthProvider",
  );

  return (
    <AuthProvider>
      <div style={{ minHeight: "100vh" }}>
        <RouterProvider router={router} />
        <Toaster />
      </div>
    </AuthProvider>
  );
}