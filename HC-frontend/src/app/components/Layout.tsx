import { Link, useLocation } from "react-router";
import {
  Shield,
  LayoutDashboard,
  Database,
  User,
  LogIn,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAuth } from "../../context/AuthContext";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const isAuth = location.pathname.startsWith("/auth");
  const isLanding = location.pathname === "/" || location.pathname === "/auth";

  if (isAuth) return null;

  const allNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Vault", href: "/vault", icon: Database },
  ];

  const navItems = allNavItems;

  return (
    <nav
      style={{ padding: isLanding ? '16px 20px' : '0 16px' }}
      className={cn(
        "z-50 transition-all duration-500",
        isLanding
          ? "absolute top-0 left-0 right-0 bg-transparent border-none md:px-[60px] md:py-[24px]"
          : "fixed top-0 left-0 right-0 bg-bg/85 backdrop-blur-md border-b border-border/60 md:px-[32px] md:pr-[32px]"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-between w-full",
          !isLanding && "h-16"
        )}
      >
        <Link to="/" className="flex items-center" style={{ gap: '12px' }}>
          <div className={cn(
            "flex items-center justify-center rounded-sm",
            isLanding ? "bg-white/10 backdrop-blur-md border border-white/20" : "bg-primary"
          )} style={{ width: '32px', height: '32px' }}>
            <Shield className={cn("w-4 h-4", isLanding ? "text-white" : "text-white")} />
          </div>
          <span className={cn(
            "font-semibold tracking-tight uppercase mono",
            isLanding ? "text-white text-shadow-sm" : "text-primary"
          )} style={{ fontSize: '18px' }}>
            HealthLocker
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center" style={{ gap: '32px' }}>
          {!isLanding &&
            navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "font-medium tracking-wide uppercase transition-colors hover:text-primary",
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-text-muted"
                )}
                style={{ fontSize: '14px' }}
              >
                {item.label}
              </Link>
            ))}
          {isLanding && (
            <Link
              to="/auth"
              className="flex items-center bg-primary text-white font-semibold uppercase transition-all shadow-lg hover:bg-[#165A50] hover:-translate-y-0.5"
              style={{
                gap: '8px',
                padding: '12px 28px',
                fontSize: '14px',
                borderRadius: '20px'
              }}
            >
              <LogIn className="w-4 h-4" /> Enter Vault
            </Link>
          )}
          {!isLanding && (
            <Link
              to="/profile"
              className="rounded-full bg-surface border border-border flex items-center justify-center hover:border-primary transition-colors"
              style={{ width: '40px', height: '40px' }}
            >
              <User className="w-5 h-5 text-text-muted" />
            </Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className={cn("md:hidden", isLanding ? "text-white" : "text-text")} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className={cn(
          "md:hidden absolute left-0 right-0 border-b flex flex-col animate-entrance",
          isLanding ? "bg-black/60 backdrop-blur-xl border-white/10" : "bg-bg border-border"
        )}
          style={{ top: isLanding ? '88px' : '64px', padding: '24px', gap: '20px' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "font-medium uppercase",
                isLanding ? "text-white/80" : (location.pathname === item.href ? "text-primary" : "text-text-muted")
              )}
              style={{ fontSize: '16px' }}
            >
              {item.label}
            </Link>
          ))}
          {!isLanding && user && (
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className={cn(
                "font-medium uppercase",
                location.pathname === "/profile" ? "text-primary" : "text-text-muted"
              )}
              style={{ fontSize: '16px' }}
            >
              Profile
            </Link>
          )}
          {isLanding && (
            <Link
              to="/auth"
              onClick={() => setIsOpen(false)}
              className="bg-primary text-white rounded-lg text-center font-semibold uppercase"
              style={{ padding: '14px', fontSize: '15px' }}
            >
              Enter Vault
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const allNavItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Vault", href: "/vault", icon: Database },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const navItems = allNavItems;

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className="fixed left-0 bottom-0 bg-surface/20 border-r border-border/60 hidden md:flex flex-col items-center"
        style={{ top: '64px', width: '64px', padding: '32px 0', gap: '20px' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "rounded-xl transition-all relative group",
                isActive
                  ? "text-primary bg-primary/8"
                  : "text-text-muted hover:text-primary hover:bg-primary/4"
              )}
              style={{ padding: '12px' }}
            >
              <item.icon className="w-5 h-5" />
              {isActive && (
                <div
                  className="absolute top-1/2 -translate-y-1/2 bg-primary rounded-l-full"
                  style={{ right: 0, width: '3px', height: '22px' }}
                />
              )}
              <div
                className="absolute bg-text text-white uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap mono z-50"
                style={{ left: '64px', fontSize: '11px', padding: '6px 10px' }}
              >
                {item.label}
              </div>
            </Link>
          );
        })}
      </aside>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/60 flex md:hidden items-center justify-around"
        style={{ padding: '8px 0 env(safe-area-inset-bottom, 8px) 0', height: '64px' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center transition-all",
                isActive ? "text-primary" : "text-text-muted"
              )}
              style={{ gap: '4px', padding: '4px 16px' }}
            >
              <item.icon className="w-5 h-5" />
              <span className="mono font-semibold uppercase" style={{ fontSize: '9px', letterSpacing: '0.06em' }}>
                {item.label}
              </span>
              {isActive && (
                <div
                  className="absolute top-0 bg-primary rounded-b-full"
                  style={{ width: '24px', height: '3px' }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
