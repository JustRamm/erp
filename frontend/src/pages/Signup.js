import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { api, formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import {
  Recycle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff,
  Mail, Lock, Building2, User, Layers
} from "lucide-react";

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    company: "",
    email: "",
    password: "",
    role: "operations",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e?.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.post("/users", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      toast.success("Account provisioned successfully. Signing you in…");
      await login(form.email.trim(), form.password);
      navigate("/");
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message || "Failed to provision account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen grid lg:grid-cols-12 bg-white overflow-hidden"
    >
      {/* Full Left Side Seamless Form Panel */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-12 lg:p-16 xl:p-20 bg-white min-h-screen overflow-y-auto order-2 lg:order-1"
      >
        
        {/* Top Bar for Form Side */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-[#E2E8F0] flex items-center justify-center p-1.5 shadow-xs">
              <img src="/logo.png" alt="Carbon & Whale Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-head text-lg font-bold text-[#010B1C]">CARBON &amp; WHALE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline font-body">Already registered?</span>
            <Link
              to="/login"
              className="text-xs font-semibold text-[#0091FF] hover:text-[#005DA7] hover:underline px-3 py-1.5 rounded-lg border border-[#E2E8F0] hover:border-[#98CAE4] transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Central Form Container */}
        <div className="w-full max-w-lg mx-auto my-auto py-8">
          <div>
            <h1 className="font-head text-3xl font-bold tracking-tight text-[#010B1C]">Register Organization</h1>
            <p className="text-sm text-slate-500 mt-2 font-body">
              Provision a new processing facility, extrusion line, or fabrication partner node.
            </p>
          </div>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <Label htmlFor="signup-name" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Full Name
                </Label>
                <div className="relative mt-2">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-name"
                    data-testid="signup-name-input"
                    type="text"
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                    required
                    className="pl-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 text-sm font-medium"
                    placeholder="Elena Rostova"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="signup-company" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Facility / Company
                </Label>
                <div className="relative mt-2">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    id="signup-company"
                    data-testid="signup-company-input"
                    type="text"
                    value={form.company}
                    onChange={(e) => set("company", e.target.value)}
                    required
                    className="pl-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 text-sm font-medium"
                    placeholder="Kochi EcoPlant"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="signup-email" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Work Email Address
              </Label>
              <div className="relative mt-2">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="signup-email"
                  data-testid="signup-email-input"
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                  className="pl-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 text-sm font-medium"
                  placeholder="elena@ecoplant.com"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="signup-password" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <Input
                  id="signup-password"
                  data-testid="signup-password-input"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  className="pl-10 pr-10 h-11 bg-[#F8FAFC] border-[#E2E8F0] focus-visible:ring-2 focus-visible:ring-[#0091FF]/30 font-mono text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-signup-password"
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1.5 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="signup-role" className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Operational Node Role
              </Label>
              <div className="relative mt-2">
                <Layers className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="signup-role"
                  data-testid="signup-role-select"
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#010B1C] focus:outline-none focus:ring-2 focus:ring-[#0091FF]/30 font-medium"
                >
                  <option value="operations">Operations (Material Inflow &amp; Processing)</option>
                  <option value="production">Production (Extrusion &amp; Molding Line)</option>
                  <option value="partner">Partner (Contract Fabrication Consignee)</option>
                  <option value="finance">Finance (Procurement &amp; Cost Auditor)</option>
                </select>
              </div>
            </div>

            {error && (
              <div data-testid="signup-error" className="text-xs text-rose-700 font-mono bg-rose-50 border border-rose-200 p-3 rounded-xl flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              data-testid="signup-submit-btn"
              type="submit"
              disabled={busy}
              className="w-full h-11 text-sm font-semibold rounded-xl mt-3 bg-gradient-to-r from-[#005DA7] to-[#0091FF] hover:from-[#004883] hover:to-[#0076D1] shadow-xs cursor-pointer"
            >
              {busy ? "Provisioning Facility Account…" : (
                <>Create Organization Account <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            Already have credentials?{" "}
            <Link to="/login" className="text-[#0091FF] font-semibold hover:underline">
              Sign in to console
            </Link>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="text-xs text-slate-400 font-mono flex items-center justify-between pt-6 border-t border-[#F1F5F9]">
          <span>Enterprise 256-Bit TLS Security</span>
          <span>© {new Date().getFullYear()} Eco-Precision</span>
        </div>
      </motion.div>

      {/* Visual Brand Right Panel */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.42, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-[#004883] via-[#0060ab] to-[#0091FF] text-white overflow-hidden order-1 lg:order-2"
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
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-2 shadow-md">
            <img src="/logo.png" alt="Carbon & Whale Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-head text-2xl font-bold tracking-tight block">CARBON &amp; WHALE</span>
            <span className="font-mono text-xs uppercase tracking-widest text-cyan-200">Lifecycle &amp; Traceability ERP</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono mb-6 text-cyan-100">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" />
            <span>Multi-Facility Node Integration</span>
          </div>
          <h2 className="font-head text-4xl xl:text-5xl font-bold leading-tight tracking-tight">
            Connect Your Plant to the Immutable Ledger
          </h2>
          <p className="mt-4 text-cyan-100 text-base leading-relaxed">
            Gain end-to-end telemetry across collection networks, sorting hubs, automated granulation, and municipal ESG certification.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 font-mono text-xs text-white/90">
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Instant Node Provisioning</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Role-Based Gatekeeper</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/10 px-3.5 py-2 rounded-lg border border-white/15 backdrop-blur-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />
              <span>Double-Entry Balance</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-cyan-200/70 font-mono">
          ISO 14001 &amp; Circular Economy Standards Compliant
        </div>
      </motion.div>
    </motion.div>
  );
}
