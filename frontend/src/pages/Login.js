import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Recycle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff } from "lucide-react";

const DEMO = [
  ["Admin", "admin@recyclops.com", "Admin@123"],
  ["Operations", "ops@recyclops.com", "Ops@123"],
  ["Production", "prod@recyclops.com", "Prod@123"],
  ["Finance", "finance@recyclops.com", "Finance@123"],
  ["Partner", "partner@recyclops.com", "Partner@123"],
  ["Client", "client@recyclops.com", "Client@123"],
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@recyclops.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#F8FAFC]">
      {/* Visual Brand Panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-14 bg-gradient-to-br from-[#004883] via-[#0060ab] to-[#0091FF] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 mix-blend-overlay"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1584263347428-969d7fa4121a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-md">
            <Recycle className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-head text-2xl font-bold tracking-tight block">ECO-PRECISION</span>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-200">Lifecycle &amp; Traceability ERP</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono mb-6 text-cyan-100">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Immutable Circular Ledger</span>
          </div>
          <h1 className="font-head text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
            From Ocean Plastic to Ground Truth
          </h1>
          <p className="mt-4 text-cyan-100 text-base leading-relaxed">
            Clinical material accountability across granulation, thermal extrusion, compression, and verified municipal deployments.
          </p>
          <div className="mt-10 flex gap-4 font-mono text-xs text-white/80">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Real-Time Extrusion</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Zero-Discrepancy</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/15">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>ESG Certified</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-cyan-200/70 font-mono">
          ISO 14001 &amp; Circular Economy Standards Compliant
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md rise bg-white border border-[#E2E8F0] shadow-[0_4px_24px_-2px_rgba(0,145,255,0.08),0_2px_8px_-1px_rgba(1,11,28,0.04)] rounded-2xl p-8 sm:p-10">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3195C9] to-[#0091FF] flex items-center justify-center">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="font-head text-xl font-bold text-[#010B1C]">ECO-PRECISION</span>
          </div>
          
          <h2 className="font-head text-2xl font-bold text-[#010B1C]">Sign In</h2>
          <p className="text-sm text-slate-500 mt-1 font-body">Access your manufacturing and operations console.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Email Address</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">Password</Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p data-testid="login-error" className="text-xs text-rose-600 font-mono bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</p>}
            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full h-11 text-base font-semibold"
            >
              {busy ? "Authenticating…" : (<>Enter Console <ArrowRight className="w-4 h-4 ml-1.5" /></>)}
            </Button>
          </form>

          <div className="mt-8 border-t border-[#E2E8F0] pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Quick Demo Profiles</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO.map(([role, em, pw]) => (
                <button
                  key={em}
                  type="button"
                  data-testid={`demo-${role.toLowerCase()}-btn`}
                  onClick={() => { setEmail(em); setPassword(pw); }}
                  className="text-left px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-[#EBF5FA] hover:border-[#98CAE4] transition-all cursor-pointer"
                >
                  <div className="text-xs font-semibold text-[#010B1C]">{role}</div>
                  <div className="text-[10px] font-mono text-slate-500 truncate">{em}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
