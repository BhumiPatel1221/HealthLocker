import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { Vault, Profile } from "./pages/Vault";
import ShareLinkPage from "./pages/ShareLinkPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { Outlet } from "react-router";
import { Navbar } from "./components/Layout";
import { useAuth } from "../context/AuthContext";

function Root() {
  return (
    <div className="relative min-h-screen">
      <div className="grain-overlay" />
      <Navbar />
      <Outlet />
    </div>
  );
}

function ProtectedRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth" />;
  if (role && user.role !== role) return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "auth", Component: LandingPage },
      {
        path: "dashboard",
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: "vault",
        element: <ProtectedRoute role="patient"><Vault /></ProtectedRoute>
      },
      {
        path: "profile",
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      // Public share link page — no auth required
      { path: "share/:token", Component: ShareLinkPage },
      { path: "*", Component: LandingPage }, // Fallback
    ],
  },
  // Standalone public page — no Navbar wrapper
  { path: "/verify-email", Component: VerifyEmailPage },
]);
