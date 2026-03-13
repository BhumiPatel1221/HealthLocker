import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, register, user, loading: authLoading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [role] = useState<"patient">("patient");
  const [loading, setLoading] = useState(false);
  // After successful registration, hold the email so we can show the "check your inbox" view
  const [registrationEmail, setRegistrationEmail] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    medicalRegistrationNumber: '',
    hospitalClinicName: '',
    mobile: '',
  });
  const [mobileError, setMobileError] = useState('');

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignup) {
        const result = await register({ ...formData, role });
        // Account created — waiting for email verification. Show the check-email panel.
        setRegistrationEmail(result.email);
      } else {
        await login(formData.email, formData.password);
        navigate("/dashboard");
      }
    } catch (err: any) {
      const apiMessage: string | undefined = err?.response?.data?.message;
      const status: number | undefined = err?.response?.status;

      if (!err?.response) {
        toast.error('Unable to reach backend API. Start backend on port 5000 or set VITE_API_BASE_URL correctly.');
      } else if (status === 401 && apiMessage?.toLowerCase().includes('verify your email')) {
        toast.error('Please verify your email first, then sign in. Check inbox/spam for the verification link.');
      } else {
        toast.error(apiMessage || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        background: '#F6F4F0',
      }}
    >
      {/* ═══════════════════════════════════════
          LEFT — Full-height Medical Image (45%)
         ═══════════════════════════════════════ */}
      <div
        style={{
          width: '45%',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          display: 'none',
          flexShrink: 0,
        }}
        className="lg:!block"
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1000&q=75)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'saturate(0.8) brightness(1.02)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(246,244,240,0.1) 0%, rgba(246,244,240,0.3) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            left: '32px',
            right: '32px',
            zIndex: 2,
          }}
        >
          <p
            className="mono"
            style={{
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            HealthLocker · Secure Medical Vault
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          RIGHT — Auth Panel (55%)
         ═══════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '460px',
            padding: '44px 40px',
            background: '#E9EFEA',
            borderRadius: '28px',
            boxShadow: '0px 25px 50px rgba(0,0,0,0.05)',
          }}
        >
          {/* ── Post-registration: check your inbox ── */}
          {registrationEmail ? (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: 'rgba(27,111,99,0.10)',
                  marginBottom: '24px',
                }}
              >
                <MailCheck style={{ width: '36px', height: '36px', color: '#1B6F63' }} />
              </div>
              <h1
                className="font-serif"
                style={{ fontSize: 'clamp(24px, 5vw, 32px)', lineHeight: 1.15, letterSpacing: '-0.02em', fontWeight: 700, color: 'var(--color-text)', marginBottom: '12px' }}
              >
                Check Your Inbox
              </h1>
              <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: '8px' }}>
                A verification email has been sent to
              </p>
              <p
                style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  marginBottom: '28px',
                  wordBreak: 'break-all',
                }}
              >
                {registrationEmail}
              </p>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: '32px' }}>
                Click the link in the email to activate your account. The link expires in{' '}
                <strong>24 hours</strong>. Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => {
                  setRegistrationEmail(null);
                  setIsSignup(false);
                  setFormData({ name: '', email: '', password: '', medicalRegistrationNumber: '', hospitalClinicName: '', mobile: '' });
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  padding: '16px',
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#fff',
                  background: '#1B6F63',
                  border: 'none',
                  borderRadius: '14px',
                  cursor: 'pointer',
                }}
              >
                Back to Sign In
                <ArrowRight style={{ width: '18px', height: '18px' }} />
              </button>
            </div>
          ) : (
          <>
          {/* ── Heading ── */}
          <div style={{ marginBottom: '28px' }}>
            <h1
              className="font-serif"
              style={{
                fontSize: 'clamp(28px, 5vw, 44px)',
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                fontWeight: 700,
                color: 'var(--color-text)',
                marginBottom: '10px',
              }}
            >
              {isSignup ? (
                <>Create Your<br />Vault Access</>
              ) : (
                <>Sign In</>
              )}
            </h1>
            <p
              className="mono"
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {isSignup
                ? 'Register to access your secure medical vault'
                : 'Access your encrypted medical records'}
            </p>
          </div>

          {/* Role selector removed: only patient role allowed */}

          {/* ── Form ── */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {isSignup && (
                <div>
                  <label
                    className="mono"
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--color-text-muted)',
                      marginBottom: '6px',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Dr. Jane Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      fontSize: '15px',
                      fontFamily: "'DM Sans', sans-serif",
                      padding: '12px 0',
                      border: 'none',
                      borderBottom: '1.5px solid rgba(0,0,0,0.12)',
                      background: 'transparent',
                      outline: 'none',
                      color: 'var(--color-text)',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                  />
                </div>
              )}

              {/* Doctor-specific fields removed */}

              <div>
                <label
                  className="mono"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(0,0,0,0.12)',
                    background: 'transparent',
                    outline: 'none',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>

              <div>
                <label
                  className="mono"
                  style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--color-text-muted)',
                    marginBottom: '6px',
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    fontSize: '15px',
                    fontFamily: "'DM Sans', sans-serif",
                    padding: '12px 0',
                    border: 'none',
                    borderBottom: '1.5px solid rgba(0,0,0,0.12)',
                    background: 'transparent',
                    outline: 'none',
                    color: 'var(--color-text)',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                />
              </div>
            </div>

            {/* ── CTA Button ── */}
            <button
              type="submit"
              disabled={loading || authLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginTop: '24px',
                padding: '16px',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#fff',
                background: '#1B6F63',
                border: 'none',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                opacity: (loading || authLoading) ? 0.7 : 1,
              }}
            >
              {(loading || authLoading) ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignup ? 'Create Account' : 'Sign In'}
                  <ArrowRight style={{ width: '18px', height: '18px' }} />
                </>
              )}
            </button>

            <p
              className="mono"
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--color-text-muted)',
                letterSpacing: '0.06em',
                opacity: 0.7,
              }}
            >
              End-to-end encrypted session
            </p>
          </form>

          {/* ── Toggle link ── */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(0,0,0,0.06)',
              textAlign: 'center',
            }}
          >
            <button
              onClick={() => setIsSignup(!isSignup)}
              style={{
                fontSize: '14px',
                fontFamily: "'DM Sans', sans-serif",
                color: 'var(--color-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 0.2s',
              }}
            >
              {isSignup
                ? 'Already registered? Sign In'
                : "Don't have an account? Sign Up"}
            </button>
          </div>
          {/* ── end of ternary else (normal auth form) ── */}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
