"use client";

import { useState } from "react";
import { login } from "@/actions/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function CadernoLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#00805A" />
      <text x="16" y="23" textAnchor="middle" fontFamily="serif" fontSize="20" fontWeight="bold" fill="white">C</text>
      <path d="M19 10 L21 10" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19 13 L21 13" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Preencha todos os campos.");
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
      toast.success("Bem-vindo!");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Erro ao fazer login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0C0F0A" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, #00805A08 0%, transparent 70%)" }}
      />

      <div className="w-full max-w-md space-y-8 relative">
        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="glow-green-pulse rounded-2xl">
              <CadernoLogo size={56} />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight" style={{ color: "#F4F6F3" }}>
              Caderno PDV
            </h1>
            <p className="text-sm mt-1.5" style={{ color: "#4A7A52" }}>
              Sistema de Gestão para Conveniências
            </p>
          </div>
        </div>

        {/* Login card */}
        <div
          className="rounded-3xl p-8 space-y-6"
          style={{ background: "#111A14", border: "1px solid #1A2B1D" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: "#00805A20", color: "#00805A" }}>
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-black" style={{ color: "#F4F6F3" }}>
                Entrar no sistema
              </h2>
              <p className="text-xs" style={{ color: "#4A7A52" }}>
                Faça login com suas credenciais
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Email
              </Label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#4A7A52" }}
                />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="pl-10 h-12 rounded-xl text-sm"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F4F6F3" }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase tracking-widest" style={{ color: "#4A7A52" }}>
                Senha
              </Label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#4A7A52" }}
                />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pl-10 pr-10 h-12 rounded-xl text-sm"
                  style={{ background: "#0A0D0A", border: "1px solid #1A2B1D", color: "#F4F6F3" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#4A7A52" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-13 py-3.5 rounded-xl font-black text-base transition-all active:scale-95 disabled:opacity-50 mt-2"
              style={{
                background: "linear-gradient(135deg, #00805A, #006045)",
                color: "#F4F6F3",
                boxShadow: "0 4px 24px #00805A30",
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Entrando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </form>
        </div>

        {/* Skip auth notice */}
        <p className="text-center text-xs" style={{ color: "#2D4D33" }}>
          Sem conta?{" "}
          <a href="/" className="underline" style={{ color: "#4A7A52" }}>
            Acessar PDV diretamente
          </a>
        </p>
      </div>
    </div>
  );
}
