import { Shield, ArrowRight, Lock, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export function LandingPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { login, register, user } = useAuth();
  const isAuthRoute = pathname === "/auth";

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user && isAuthRoute) {
      navigate("/dashboard");
    }
  }, [user, isAuthRoute, navigate]);

  // Lock body scroll when on auth route
  useEffect(() => {
    if (isAuthRoute) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isAuthRoute]);

  // ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isAuthRoute) navigate("/");
  }, [isAuthRoute, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleClose = () => navigate("/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isSignup) {
        await register({ ...formData, role: 'patient' });
        toast.success("Account created! Please check your email to verify your account.");
        // Stay on page — user must verify email before logging in
        setIsSignup(false);
        setFormData({ name: '', email: '', password: '' });
      } else {
        await login(formData.email, formData.password);
        toast.success("Logged in successfully");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          background: '#000',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=2400&q=85)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            transition: 'filter 0.5s ease',
            filter: isAuthRoute ? 'blur(10px) brightness(0.6)' : 'brightness(0.9)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.45) 100%)',
            transition: 'opacity 0.5s ease',
          }}
        />

        {!isAuthRoute && (
          <div
            className="animate-fade-in"
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '1200px',
              padding: '0 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              className="mono"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 22px',
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '100px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.14em',
                color: 'rgba(255,255,255,0.95)',
                marginBottom: '44px',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              <Shield style={{ width: '16px', height: '16px' }} />
              Secure Medical Vault
            </div>

            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(42px, 8vw, 92px)',
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                fontWeight: 700,
                color: '#FCFBF8',
                marginBottom: '32px',
                textShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              Your Medical Records.
              <br />
              <span style={{ color: '#88D6C8' }}>
                <em>Secured.</em>
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(17px, 2.2vw, 21px)',
                lineHeight: 1.7,
                color: 'rgba(255,255,255,0.9)',
                maxWidth: '540px',
                marginBottom: '48px',
                fontFamily: "'DM Sans', sans-serif",
                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              A digital vault for complete control over your health records.
              Upload, manage, and share — on your terms.
            </p>

            <button
              onClick={() => navigate("/auth")}
              className="hero-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '22px 52px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: '#fff',
                background: '#1B6F63',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                width: 'auto',
                boxShadow: '0 10px 25px -10px rgba(0,0,0,0.3)',
              }}
            >
              Enter HealthLocker
              <ArrowRight style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}

        {isAuthRoute && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              overflowY: 'auto',
              padding: '40px 0',
              animation: 'fadeIn 0.35s ease-out',
            }}
          >
            <div
              onClick={handleClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.35)',
                backdropFilter: 'blur(12px)',
              }}
            />

            <div
              className="glass-modal"
              style={{
                position: 'relative',
                zIndex: 101,
                width: 'calc(100% - 40px)',
                maxWidth: '460px',
                margin: 'auto',
                flexShrink: 0,
                padding: '48px 40px',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '32px',
                boxShadow: '0px 40px 100px rgba(0,0,0,0.4)',
                animation: 'scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both',
                color: '#F0F4F2',
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: '24px',
                  right: '28px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  color: 'white',
                  transition: 'background 0.2s',
                }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>

              <div style={{ marginBottom: '32px' }}>
                <h2
                  className="font-serif"
                  style={{
                    fontSize: '38px',
                    lineHeight: 1.1,
                    letterSpacing: '-0.02em',
                    fontWeight: 700,
                    marginBottom: '8px',
                    color: 'white',
                  }}
                >
                  {isSignup ? (
                    <>Create Your<br />Vault Access</>
                  ) : (
                    <>Verify Your<br />Identity</>
                  )}
                </h2>
                <p
                  className="mono"
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.6)',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                  }}
                >
                  Secure access to your medical vault
                </p>
              </div>

              {isSignup && (
                <div style={{ marginBottom: '28px' }}>
                  {/* Role selector removed — only patient accounts */}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {isSignup && (
                    <input
                      type="text"
                      name="name"
                      placeholder="Full Name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        fontSize: '15px',
                        fontFamily: "'DM Sans', sans-serif",
                        padding: '14px 20px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '16px',
                        background: 'rgba(255,255,255,0.08)',
                        outline: 'none',
                        color: 'white',
                        boxSizing: 'border-box',
                      }}
                    />
                  )}

                  {/* Doctor-specific fields removed */}

                  <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      fontSize: '15px',
                      fontFamily: "'DM Sans', sans-serif",
                      padding: '14px 20px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.08)',
                      outline: 'none',
                      color: 'white',
                      boxSizing: 'border-box',
                    }}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    style={{
                      width: '100%',
                      fontSize: '15px',
                      fontFamily: "'DM Sans', sans-serif",
                      padding: '14px 20px',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.08)',
                      outline: 'none',
                      color: 'white',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="modal-cta"
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    marginTop: '32px',
                    padding: '18px',
                    fontSize: '15px',
                    fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#fff',
                    background: '#1B6F63',
                    border: 'none',
                    borderRadius: '18px',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                    boxShadow: '0 8px 20px -8px rgba(0,0,0,0.3)',
                    opacity: isLoading ? 0.7 : 1,
                  }}
                >
                  {isLoading ? 'Processing...' : (isSignup ? 'Create Account' : 'Sign In')}
                  {!isLoading && <ArrowRight style={{ width: '18px', height: '18px' }} />}
                </button>

                <p
                  className="mono"
                  style={{
                    textAlign: 'center',
                    marginTop: '20px',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.08em',
                  }}
                >
                  End-to-end encrypted session
                </p>
              </form>

              <div
                style={{
                  marginTop: '28px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  textAlign: 'center',
                }}
              >
                <button
                  onClick={() => setIsSignup(!isSignup)}
                  style={{
                    fontSize: '14px',
                    fontFamily: "'DM Sans', sans-serif",
                    color: 'rgba(255,255,255,0.6)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    transition: 'color 0.2s',
                  }}
                >
                  {isSignup
                    ? 'Already registered? Sign In'
                    : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        )}

        {!isAuthRoute && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '40px',
              padding: '32px 24px',
              borderTop: '1px solid rgba(255,255,255,0.1)',
              flexWrap: 'wrap',
              background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
            }}
          >
            {[
              { icon: Lock, label: "End-to-End Encrypted" },
              { icon: Shield, label: "Patient Controlled" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="mono"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase' as const,
                  letterSpacing: '0.12em',
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                <item.icon style={{ width: '15px', height: '15px', opacity: 0.8 }} />
                {item.label}
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { 
          from { opacity: 0; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes heroFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero-cta:hover {
          background: #165A50 !important;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px -8px rgba(27,111,99,0.4);
        }

        .modal-cta:hover {
          background: #165A50 !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px -6px rgba(27,111,99,0.35);
        }
      `}</style>
    </>
  );
}
