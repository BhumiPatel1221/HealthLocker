import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import api from "../../api";

type VerifyState = "loading" | "success" | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setState("error");
      setMessage("Verification link is invalid or expired.");
      return;
    }

    let cancelled = false;

    api
      .get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (cancelled) return;
        setState("success");
        setMessage(
          res.data?.message ?? "Email verified successfully. Your account is now activated."
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setState("error");
        const serverMsg: string =
          err.response?.data?.message ?? "Verification link is invalid or expired.";
        // Normalise any unexpected server message to the required copy
        setMessage(
          serverMsg.toLowerCase().includes("invalid") ||
            serverMsg.toLowerCase().includes("expired") ||
            serverMsg.toLowerCase().includes("already")
            ? "Verification link is invalid or expired."
            : serverMsg
        );
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div
      style={{
        minHeight: "100vh",
        overflowY: "auto",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#F6F4F0",
        padding: "48px 24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#E9EFEA",
          borderRadius: "28px",
          padding: "clamp(32px, 5vw, 56px) clamp(24px, 4vw, 48px)",
          boxShadow: "0px 25px 50px rgba(0,0,0,0.05)",
          textAlign: "center",
        }}
      >
        {/* ── Brand mark ── */}
        <div style={{ marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck
              style={{ width: "22px", height: "22px", color: "#1B6F63" }}
            />
            <span
              className="font-serif"
              style={{ fontSize: "18px", color: "var(--color-text)", fontWeight: 700 }}
            >
              HealthLocker
            </span>
          </div>
        </div>

        {/* ── Status icon ── */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            marginBottom: "28px",
            background:
              state === "loading"
                ? "rgba(27,111,99,0.08)"
                : state === "success"
                ? "rgba(27,111,99,0.10)"
                : "rgba(220,38,38,0.08)",
          }}
        >
          {state === "loading" && (
            <Loader2
              className="animate-spin"
              style={{ width: "40px", height: "40px", color: "#1B6F63" }}
            />
          )}
          {state === "success" && (
            <CheckCircle2
              style={{ width: "40px", height: "40px", color: "#1B6F63" }}
            />
          )}
          {state === "error" && (
            <XCircle
              style={{ width: "40px", height: "40px", color: "#dc2626" }}
            />
          )}
        </div>

        {/* ── Headline ── */}
        <h1
          className="font-serif"
          style={{
            fontSize: "28px",
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: "var(--color-text)",
            marginBottom: "16px",
          }}
        >
          {state === "loading" && "Verifying your email…"}
          {state === "success" && "Email Verified!"}
          {state === "error" && "Verification Failed"}
        </h1>

        {/* ── Body copy ── */}
        <p
          style={{
            fontSize: "15px",
            lineHeight: 1.65,
            color:
              state === "error"
                ? "#dc2626"
                : "var(--color-text-muted)",
            marginBottom: "36px",
          }}
        >
          {state === "loading"
            ? "Please wait while we confirm your verification link."
            : message}
        </p>

        {/* ── CTA ── */}
        {state === "success" && (
          <button
            onClick={() => navigate("/auth")}
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "15px",
              fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#fff",
              background: "#1B6F63",
              border: "none",
              borderRadius: "14px",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
          >
            Sign In to Your Account
          </button>
        )}

        {state === "error" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => navigate("/auth?signup=1")}
              style={{
                width: "100%",
                padding: "16px",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#fff",
                background: "#1B6F63",
                border: "none",
                borderRadius: "14px",
                cursor: "pointer",
              }}
            >
              Register Again
            </button>
            <button
              onClick={() => navigate("/auth")}
              style={{
                width: "100%",
                padding: "14px",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "1.5px solid rgba(0,0,0,0.10)",
                borderRadius: "14px",
                cursor: "pointer",
              }}
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
