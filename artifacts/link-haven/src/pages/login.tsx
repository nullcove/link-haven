import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useRegister, useLoginAsGuest } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const isSignup = window.location.pathname === "/signup";
  const [text, setText] = useState("");
  const fullText = "Welcome to LinkHaven OS v1.0.0\\nEstablishing secure connection...\\nConnection established.\\n\\n";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const guestMutation = useLoginAsGuest();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      let res;
      if (isSignup) {
        res = await registerMutation.mutateAsync({ data: { ...data, name: data.email.split('@')[0] } });
      } else {
        res = await loginMutation.mutateAsync({ data });
      }
      setAuthToken(res.token);
      setLocation("/app");
    } catch (e) {
      console.error(e);
    }
  };

  const handleGuest = async () => {
    try {
      const res = await guestMutation.mutateAsync();
      setAuthToken(res.token);
      setLocation("/app");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-[#4af626] font-mono p-4 md:p-8 flex flex-col selection:bg-[#4af626] selection:text-[#0a0a0c]">
      <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
        <div className="whitespace-pre-wrap mb-6 text-sm md:text-base leading-relaxed opacity-80">
          {text}
          {text.length === fullText.length && <span className="animate-pulse">_</span>}
        </div>

        {text.length === fullText.length && (
          <div className="animate-in fade-in duration-1000 mt-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="opacity-50">user@linkhaven:~$</span>
                <span className="text-[#4af626]">./{isSignup ? 'register' : 'login'}.sh</span>
              </div>

              <div className="pl-4 border-l border-[#4af626]/20 space-y-4 py-2 mt-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm opacity-70">Enter email:</label>
                  <input 
                    {...register("email")}
                    type="email"
                    autoFocus
                    className="bg-transparent border-b border-[#4af626]/30 focus:border-[#4af626] outline-none py-1 text-[#4af626] w-full max-w-sm placeholder:text-[#4af626]/20"
                    placeholder="user@domain.com"
                  />
                </div>
                
                <div className="flex flex-col gap-1">
                  <label className="text-sm opacity-70">Enter password:</label>
                  <input 
                    {...register("password")}
                    type="password"
                    className="bg-transparent border-b border-[#4af626]/30 focus:border-[#4af626] outline-none py-1 text-[#4af626] w-full max-w-sm"
                  />
                </div>

                <div className="pt-4 flex items-center gap-4">
                  <button 
                    type="submit"
                    disabled={loginMutation.isPending || registerMutation.isPending}
                    className="px-4 py-1 border border-[#4af626] hover:bg-[#4af626] hover:text-[#0a0a0c] transition-colors disabled:opacity-50"
                  >
                    [ EXECUTE ]
                  </button>
                  {isSignup && (
                    <button 
                      type="button"
                      onClick={handleGuest}
                      disabled={guestMutation.isPending}
                      className="px-4 py-1 border border-[#4af626]/50 text-[#4af626]/70 hover:bg-[#4af626]/10 transition-colors"
                    >
                      --guest-mode
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="mt-8 text-sm opacity-50">
              {isSignup ? (
                <span>Already have an account? <Link href="/login" className="underline hover:text-[#4af626] hover:opacity-100">./login.sh</Link></span>
              ) : (
                <span>Need an account? <Link href="/signup" className="underline hover:text-[#4af626] hover:opacity-100">./register.sh</Link></span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
