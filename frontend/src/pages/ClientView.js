import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, PieChart, Pie, Tooltip,
} from "recharts";
import { BoardroomSkeleton } from "../components/PageSkeleton";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { Leaf, MapPin, Factory, Waves, ShieldCheck } from "lucide-react";

const COLORS = ["#0091FF", "#10B981", "#D97706", "#4F46E5", "#3195C9"];

function Big({ icon: Icon, value, label, unit, color, bg }) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="rounded-2xl border border-[#E2E8F0] bg-white p-6 card-lift shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)]"
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center ${color} mb-4 transition-transform group-hover:scale-110`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="font-head text-3xl sm:text-4xl font-bold tracking-tight text-[#010B1C]">
        {value?.toLocaleString?.() ?? value}
        <span className="text-base text-slate-500 font-mono font-medium ml-1.5">{unit}</span>
      </div>
      <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500 font-body">{label}</div>
    </motion.div>
  );
}

export default function Boardroom() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/client/dashboard").then((r) => setD(r.data)).catch(() => {}); }, []);

  if (!d) {
    return <BoardroomSkeleton />;
  }

  const production = (d?.production || []).filter((p) => p.qty > 0).map((p) => ({ name: p.product, qty: p.qty }));
  const volumes = (d?.volumes || []).map((v) => ({ name: v.name, value: v.total }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">ESG Impact &amp; Boardroom Telemetry</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-body">Verified material transformation, ocean diversion metrics, and municipal installations.</p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse-glow" />
          <span>Ledger Certified</span>
        </div>
      </div>

      <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StaggerItem>
          <Big icon={Waves} value={d?.plastic_diverted_kg ?? 0} unit="kg" label="Ocean Plastic Processed" color="text-[#0091FF]" bg="bg-sky-50" />
        </StaggerItem>
        <StaggerItem>
          <Big icon={Leaf} value={d?.co2_saved_kg ?? 0} unit="kg" label="CO₂ Emissions Offset" color="text-emerald-600" bg="bg-emerald-50" />
        </StaggerItem>
        <StaggerItem>
          <Big icon={Factory} value={production.reduce((a, b) => a + b.qty, 0)} unit="units" label="Circular Products Built" color="text-amber-700" bg="bg-amber-50" />
        </StaggerItem>
        <StaggerItem>
          <Big icon={MapPin} value={d?.deployed_count ?? 0} unit="sites" label="Public Municipal Deployments" color="text-indigo-600" bg="bg-indigo-50" />
        </StaggerItem>
      </StaggerContainer>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)] card-lift">
          <h2 className="font-head text-base font-bold text-[#010B1C] mb-4">Production Output by Catalog Spec</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={production} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" stroke="#94A3B8" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#64748B" fontSize={11} width={130} />
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
              <Bar dataKey="qty" radius={[0, 6, 6, 0]} isAnimationActive={true} animationDuration={800}>
                {production.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {production.length === 0 && <p className="text-slate-400 text-sm text-center py-8 font-mono">No production output logged yet.</p>}
        </div>

        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)] card-lift">
          <h2 className="font-head text-base font-bold text-[#010B1C] mb-4">Material Volume by Category</h2>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={volumes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={3} isAnimationActive={true} animationDuration={800}>
                {volumes.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            {volumes.map((v, i) => (
              <span key={v.name} className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />{v.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400 font-mono">Executive Read-Only View · Sensitive supplier &amp; cost data masked</p>
    </div>
  );
}
