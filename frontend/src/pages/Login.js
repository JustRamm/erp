import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Recycle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, Mail, Lock } from "lucide-react";

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
    <motion.div
      initial={{ opacity: 0, x: -60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen grid lg:grid-cols-12 bg-white overflow-hidden"
    >
      {/* Visual Brand Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#004883] via-[#0060ab] to-[#0091FF] text-white overflow-hidden"
      >
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
          <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center p-2 shadow-md">
            <img src="/logo.png" alt="Carbon & Whale Logo" className="w-full h-full object-contain brightness-0 invert" />
          </div>
          <div>
            <span className="font-head text-2xl font-bold tracking-tight block">CARBON &amp; WHALE</span>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-200">Lifecycle &amp; Traceability ERP</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono mb-6 text-cyan-100">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Immutable Circular Ledger</span>
          </div>
          <h1 className="font-head text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            From Ocean Plastic to Ground Truth
          </h1>
          <p className="mt-4 text-cyan-100 text-base leading-relaxed">
            Clinical material accountability across granulation, thermal extrusion, compression, and verified municipal deployments.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 font-mono text-xs text-white/90">
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Real-Time Extrusion</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Zero-Discrepancy</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>ESG Certified</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-cyan-200/70 font-mono">
          ISO 14001 &amp; Circular Economy Standards Compliant
        </div>
      </motion.div>

      {/* Full Right Side Seamless Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 bg-white min-h-screen overflow-y-auto"
      >
        
        {/* Top Bar for Right Side */}
        <div className="flex items-center justify-between">
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3195C9] to-[#0091FF] flex items-center justify-center p-2 shadow-xs">
              <img src="/logo.png" alt="Carbon & Whale Logo" className="w-full h-full object-contain brightness-0 invert" />
            </div>
            <span className="font-head text-lg font-bold text-[#010B1C]">CARBON &amp; WHALE</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-slate-500 hidden sm:inline font-body">Need an enterprise account?</span>
            <Link
              to="/signup"
              data-testid="goto-signup-btn"
              className="text-xs font-semibold text-[#0091FF] hover:text-[#005DA7] hover:underline px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#98CAE4] transition-all cursor-pointer"
            >
              Sign Up
            </Link>
          </div>
        </div>

        {/* Central Form Container */}
        <div className="w-full max-w-lg mx-auto my-auto py-8">
          <div>
            <h2 className="font-head text-3xl font-bold tracking-tight text-[#010B1C]">Sign in to console</h2>
            <p className="text-sm text-slate-500 mt-2 font-body">Access your manufacturing lines, ledger events, and operational audits.</p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Work Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="email"
                  data-testid="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 h-12 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 text-sm font-medium"
                  placeholder="operator@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </Label>
              </div>
              <div className="relative mt-2">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="password"
                  data-testid="login-password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 pr-10 h-12 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 font-mono text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div data-testid="login-error" className="text-xs text-rose-700 font-mono bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              data-testid="login-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full h-12 text-sm font-semibold rounded-xl mt-2 bg-gradient-to-r from-[#005DA7] to-[#0091FF] hover:from-[#004883] hover:to-[#0076D1] shadow-xs cursor-pointer"
            >
              {busy ? "Authenticating Session…" : (
                <>Enter Console <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-slate-500 font-body">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="text-[#0091FF] font-semibold hover:underline">
              Register organization
            </Link>
          </div>

          {/* Quick Demo Profiles */}
          <div className="mt-10 border-t border-[#E2E8F0] pt-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
                Quick Demo Profiles
              </span>
              <span className="text-[11px] text-slate-400 font-mono">1-click fill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEMO.map(([role, em, pw]) => {
                const isSelected = email === em;
                return (
                  <button
                    key={em}
                    type="button"
                    data-testid={`demo-${role.toLowerCase()}-btn`}
                    onClick={() => { setEmail(em); setPassword(pw); }}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EBF5FA] border-[#0091FF] text-[#0091FF] shadow-xs"
                        : "bg-[#F8FAFC] border-[#E2E8F0] hover:bg-[#F1F5F9] hover:border-slate-300"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#010B1C]">{role}</div>
                    <div className="text-[11px] font-mono text-slate-500 truncate mt-0.5">{em}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-6 border-t border-[#F1F5F9]">
          <span>Enterprise 256-Bit TLS Security</span>
          <span>© {new Date().getFullYear()} Eco-Precision</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
