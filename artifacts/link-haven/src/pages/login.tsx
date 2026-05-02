import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Min 6 characters"),
});

const signupSchema = loginSchema.extend({
  name: z.string().min(2, "Name required"),
});

type LoginValues = z.infer<typeof loginSchema>;
type SignupValues = z.infer<typeof signupSchema>;

const BOOT_LINES = [
  "LinkHaven OS v2.1.0 (build 20260502)",
  "Kernel: lh-core-4.21.0-haven #1 SMP",
  "Mounting filesystem.............................. [ OK ]",
  "Starting secure vault daemon.................... [ OK ]",
  "Initialising bookmark engine.................... [ OK ]",
  "Loading user session............................ [ OK ]",
  "",
  "Welcome to Link Haven. Your personal web sanctuary.",
  "",
];

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const isSignup = typeof window !== "undefined" && window.location.pathname.includes("/signup");
  const [bootDone, setBootDone] = useState(false);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const loginForm = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });
  const signupForm = useForm<SignupValues>({ resolver: zodResolver(signupSchema) });

  useEffect(() => {
    if (currentLine >= BOOT_LINES.length) {
      setTimeout(() => setBootDone(true), 200);
      return;
    }
    const line = BOOT_LINES[currentLine];
    if (currentChar < line.length) {
      const delay = line.includes("[ OK ]") ? 8 : 18;
      const t = setTimeout(() => setCurrentChar((c) => c + 1), delay);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayedLines((prev) => [...prev, line]);
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, line === "" ? 80 : 120);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChar]);

  useEffect(() => {
    terminalRef.current?.scrollTo({ top: 9999 });
  }, [displayedLines, currentChar]);

  const handleLogin = async (data: LoginValues) => {
    setError(null);
    try {
      const res = await loginMutation.mutateAsync({ data });
      setAuthToken(res.token);
      setLocation("/app");
    } catch {
      setError("Invalid email or password. Please try again.");
    }
  };

  const handleSignup = async (data: SignupValues) => {
    setError(null);
    try {
      const res = await registerMutation.mutateAsync({ data });
      setAuthToken(res.token);
      setLocation("/app");
    } catch {
      setError("This email is already registered. Try logging in.");
    }
  };

  const isPending = loginMutation.isPending || registerMutation.isPending;

  const partialLine =
    currentLine < BOOT_LINES.length
      ? BOOT_LINES[currentLine].substring(0, currentChar)
      : "";

  return (
    <div className="min-h-screen bg-[#0c0c10] flex items-center justify-center p-4 font-mono">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-900/20 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60 bg-[#111118]">
          {/* Window chrome */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a24] border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="size-3 rounded-full bg-[#ff5f57]" />
              <div className="size-3 rounded-full bg-[#febc2e]" />
              <div className="size-3 rounded-full bg-[#28c840]" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-[11px] text-white/30 tracking-wide select-none">
                link-haven — bash — 80×24
              </span>
            </div>
            <div className="size-4" />
          </div>

          {/* Terminal body */}
          <div
            ref={terminalRef}
            className="p-5 min-h-[420px] max-h-[70vh] overflow-y-auto text-sm leading-relaxed"
          >
            <div className="mb-4 text-[#6ee7b7]/70">
              {displayedLines.map((line, i) => (
                <div key={i} className={line === "" ? "h-3" : ""}>
                  {line.includes("[ OK ]") ? (
                    <span>
                      <span className="text-[#6ee7b7]/50">{line.replace("[ OK ]", "")}</span>
                      <span className="text-[#28c840] font-semibold">[ OK ]</span>
                    </span>
                  ) : (
                    line
                  )}
                </div>
              ))}
              {!bootDone && (
                <div>
                  <span className="text-[#6ee7b7]/50">{partialLine}</span>
                  <span className="inline-block w-2 h-4 bg-[#6ee7b7]/70 animate-pulse ml-px align-middle" />
                </div>
              )}
            </div>

            {bootDone && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-indigo-400 mb-5">
                  <span className="text-white/30">user@linkhaven</span>
                  <span className="text-white/20">:</span>
                  <span className="text-indigo-400">~</span>
                  <span className="text-white/20">$</span>
                  <span className="text-white/80 ml-1">
                    ./{isSignup ? "register" : "login"}.sh
                  </span>
                </div>

                {isSignup ? (
                  <form
                    onSubmit={signupForm.handleSubmit(handleSignup)}
                    className="space-y-4 pl-4 border-l-2 border-indigo-500/20"
                  >
                    <TerminalField
                      label="enter name"
                      type="text"
                      placeholder="Your Name"
                      error={signupForm.formState.errors.name?.message}
                      {...signupForm.register("name")}
                    />
                    <TerminalField
                      label="enter email"
                      type="email"
                      placeholder="you@domain.com"
                      error={signupForm.formState.errors.email?.message}
                      {...signupForm.register("email")}
                    />
                    <TerminalField
                      label="enter password"
                      type="password"
                      placeholder="min 6 chars"
                      error={signupForm.formState.errors.password?.message}
                      {...signupForm.register("password")}
                    />
                    <TerminalSubmit isPending={isPending} isSignup error={error} />
                  </form>
                ) : (
                  <form
                    onSubmit={loginForm.handleSubmit(handleLogin)}
                    className="space-y-4 pl-4 border-l-2 border-indigo-500/20"
                  >
                    <TerminalField
                      label="enter email"
                      type="email"
                      placeholder="you@domain.com"
                      autoFocus
                      error={loginForm.formState.errors.email?.message}
                      {...loginForm.register("email")}
                    />
                    <TerminalField
                      label="enter password"
                      type="password"
                      placeholder="••••••••"
                      error={loginForm.formState.errors.password?.message}
                      {...loginForm.register("password")}
                    />
                    <TerminalSubmit isPending={isPending} isSignup={false} error={error} />
                  </form>
                )}

                <div className="mt-6 pl-4 text-xs text-white/25">
                  {isSignup ? (
                    <>
                      Already registered?{" "}
                      <Link href="/login" className="text-indigo-400/70 hover:text-indigo-400 underline underline-offset-2">
                        ./login.sh
                      </Link>
                    </>
                  ) : (
                    <>
                      No account?{" "}
                      <Link href="/signup" className="text-indigo-400/70 hover:text-indigo-400 underline underline-offset-2">
                        ./register.sh
                      </Link>
                    </>
                  )}
                  {" · "}
                  <Link href="/" className="text-white/20 hover:text-white/40 underline underline-offset-2">
                    cd /home
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TerminalField({
  label,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/30 w-28 shrink-0">{label}:</span>
        <input
          {...props}
          className="flex-1 bg-transparent border-b border-indigo-500/20 focus:border-indigo-500/60 outline-none text-[#a5b4fc] placeholder:text-white/15 py-0.5 text-sm transition-colors"
        />
      </div>
      {error && <p className="text-[11px] text-red-400/80 pl-32">{error}</p>}
    </div>
  );
}

function TerminalSubmit({
  isSignup,
  isPending,
  error,
}: {
  isSignup: boolean;
  isPending: boolean;
  error: string | null;
}) {
  return (
    <div className="pt-3 space-y-3">
      {error && (
        <div className="flex items-center gap-2 text-red-400/80 text-xs">
          <span className="text-red-400">!</span>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-1.5 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/10 hover:border-indigo-500/70 text-xs font-bold tracking-widest uppercase transition-colors rounded disabled:opacity-40"
      >
        {isPending ? "[ ... ]" : isSignup ? "[ REGISTER ]" : "[ LOGIN ]"}
      </button>
    </div>
  );
}
