import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react";
import { setAuthToken } from "@/lib/auth";
import { apiCall } from "@/lib/api";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    const e = params.get("email");
    if (t) setToken(t);
    if (e) setEmail(decodeURIComponent(e));
  }, []);

  useEffect(() => {
    if (token) {
      handleVerify(token);
    }
  }, [token]);

  const handleVerify = async (verifyToken: string) => {
    setStatus("loading");
    try {
      const data = await apiCall("/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token: verifyToken }),
      });
      setAuthToken(data.token);
      setStatus("success");
      setTimeout(() => setLocation("/app"), 1500);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center p-4 font-mono">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-indigo-900/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#111118]">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a24] border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-[#ff5f57]" />
              <div className="size-3 rounded-full bg-[#febc2e]" />
              <div className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-white/30 tracking-wide select-none">
                link-haven — verify-email.sh
              </span>
            </div>
            <div className="size-4" />
          </div>

          <div className="p-8 flex flex-col items-center text-center gap-6">
            {status === "idle" && (
              <>
                <div className="size-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Mail className="size-7 text-indigo-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white mb-2">Verify your email</h1>
                  {email && (
                    <p className="text-sm text-white/40 mb-1">
                      Account: <span className="text-indigo-300">{email}</span>
                    </p>
                  )}
                  <p className="text-sm text-white/35">
                    Loading verification…
                  </p>
                </div>
              </>
            )}

            {status === "loading" && (
              <>
                <div className="size-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Loader2 className="size-7 text-indigo-400 animate-spin" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white mb-2">Verifying your email…</h1>
                  <p className="text-sm text-white/35">Please wait a moment.</p>
                </div>
              </>
            )}

            {status === "success" && (
              <>
                <div className="size-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <CheckCircle className="size-7 text-green-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white mb-2">Email verified!</h1>
                  <p className="text-sm text-white/40">
                    Redirecting to your dashboard…
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-green-400/70">
                  <span className="text-green-400">[ OK ]</span>
                  email_verified = true
                  <ArrowRight className="size-3" />
                  /app
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="size-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <XCircle className="size-7 text-red-400" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white mb-2">Verification failed</h1>
                  <p className="text-sm text-red-400/70 mb-1">{errorMsg}</p>
                  <p className="text-xs text-white/25">
                    The link may have expired or already been used.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocation("/signup")}
                    className="px-4 py-2 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-xs font-bold tracking-wider uppercase rounded transition-colors"
                  >
                    [ NEW ACCOUNT ]
                  </button>
                  <button
                    onClick={() => setLocation("/login")}
                    className="px-4 py-2 border border-white/10 text-white/40 hover:bg-white/5 text-xs font-bold tracking-wider uppercase rounded transition-colors"
                  >
                    [ SIGN IN ]
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
