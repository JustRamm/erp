import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { QUICK_ACTIONS, TXN_COLORS } from "../lib/constants";
import ActionDialog from "../components/ActionDialog";
import PurchaseRequestDialog from "../components/PurchaseRequestDialog";
import { DashboardSkeleton } from "../components/PageSkeleton";
import { Boxes, AlertTriangle, TrendingDown, Activity, ShoppingCart, Clock, CheckSquare } from "lucide-react";

function StatCard({ label, value, unit, sub, delay }) {
  return (
    <div
      data-testid="stat-card"
      className="rounded-2xl border border-[#E2E8F0] bg-white p-5 card-hover rise shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 font-body">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-[#EBF5FA] flex items-center justify-center text-[#0091FF]">
          <Boxes className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-head text-3xl font-bold tracking-tight text-[#010B1C]">
          {value?.toLocaleString?.() ?? value}
        </span>
        <span className="text-xs text-slate-500 font-mono font-medium">{unit}</span>
      </div>
      <div className="mt-2 text-xs text-slate-500 font-body">{sub}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [action, setAction] = useState(null);

  const load = () => api.get("/dashboard").then((r) => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!data) {
    return <DashboardSkeleton />;
  }

  const actions = QUICK_ACTIONS.filter((a) => a.roles.includes(user.role));
  const na = data?.needs_attention;
  const allClear = na && !na.open_discrepancies && !na.pending_disc_approvals && !na.pending_purchase_requests && !na.live_orders && na.low_stock?.length === 0 && na.negatives?.length === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Operations Console</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">
            Welcome back, <span className="font-semibold text-[#010B1C]">{user?.name ? user.name.split(" ")[0] : "Operator"}</span> · <span className="font-mono text-xs">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {(data?.cards || []).map((c, i) => (
          <StatCard key={c.category} label={c.category} value={Math.round(c.total)} unit={c.unit}
            sub={`${c.products} SKU${c.products !== 1 ? "s" : ""} · ${c.tracking_mode}`} delay={i * 60} />
        ))}
        {(!data?.cards || data.cards.length === 0) && (
          <div className="text-slate-400 text-sm col-span-4 bg-white p-8 rounded-2xl border border-[#E2E8F0] text-center">
            No active categories found.
          </div>
        )}
      </div>

      <div>
        <h2 className="font-head text-lg font-bold tracking-tight text-[#010B1C] mb-4">Quick Operations</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {actions.map((a) => (
            <button
              key={a.key}
              data-testid={`quick-action-${a.key}`}
              onClick={() => setAction(a.key)}
              className="group flex flex-col items-center justify-center gap-3 p-5 min-h-[104px] rounded-2xl border border-[#E2E8F0] bg-white card-hover shadow-xs text-left active:scale-95 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[#EBF5FA] flex items-center justify-center group-hover:scale-105 transition-transform">
                <a.icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <span className="text-xs font-semibold text-[#010B1C] text-center">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs attention container */}
        <div className="lg:col-span-1 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)]">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="font-head text-base font-bold text-[#010B1C]">Needs Attention</h2>
          </div>
          <div className="space-y-3.5">
            <AttnRow icon={AlertTriangle} color="text-rose-600" label="Open discrepancies" value={na?.open_discrepancies || 0} onClick={() => navigate("/discrepancies")} testid="attn-discrepancies" />
            <AttnRow icon={CheckSquare} color="text-amber-600" label="Corrections to approve" value={na?.pending_disc_approvals || 0} onClick={() => navigate("/discrepancies")} testid="attn-disc-approvals" />
            <AttnRow icon={ShoppingCart} color="text-emerald-600" label="PRs pending Finance" value={na?.pending_purchase_requests || 0} onClick={() => navigate("/procurement")} testid="attn-pending-prs" />
            <AttnRow icon={CheckSquare} color="text-[#0091FF]" label="Changes to approve" value={na?.pending_change_requests || 0} onClick={() => navigate("/approvals")} testid="attn-change-requests" />
            <AttnRow icon={Clock} color="text-[#0091FF]" label="Live orders to update" value={na?.live_orders || 0} onClick={() => navigate("/procurement")} testid="attn-live-orders" />
            <AttnRow icon={TrendingDown} color="text-amber-600" label="Low stock items" value={na?.low_stock?.length || 0} onClick={() => navigate("/inventory")} testid="attn-lowstock" />
            {na?.low_stock?.slice(0, 3).map((l) => (
              <div key={l.name} className="text-xs flex justify-between border-t border-[#F1F5F9] pt-2">
                <span className="text-slate-600 truncate mr-2">{l.name}</span>
                <span className="font-mono font-semibold text-amber-700">{Math.round(l.total)} / {l.threshold} {l.unit}</span>
              </div>
            ))}
            {allClear && <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg p-2.5 text-center">System status: Optimal</div>}
          </div>
        </div>

        {/* Recent ledger */}
        <div className="lg:col-span-2 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)]">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#E2E8F0]">
            <div className="w-8 h-8 rounded-lg bg-[#EBF5FA] flex items-center justify-center text-[#0091FF]">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="font-head text-base font-bold text-[#010B1C]">Recent Ledger Feed</h2>
          </div>
          <div className="space-y-2">
            {(data?.recent || []).map((t) => (
              <div key={t.id} className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors border border-transparent hover:border-[#E2E8F0]">
                <div className={`w-2 h-9 rounded-full ${t.delta >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-[#010B1C] truncate">{t.product_name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">{t.location_name} · {new Date(t.created_at).toLocaleString()}</div>
                </div>
                <div className={`text-right ${TXN_COLORS[t.txn_type] || "text-slate-700"}`}>
                  <div className="font-mono font-bold text-sm">{t.delta >= 0 ? "+" : ""}{t.delta} {t.unit}</div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">{t.txn_label}</div>
                </div>
              </div>
            ))}
            {(!data?.recent || data.recent.length === 0) && (
              <div className="text-slate-400 text-sm py-8 text-center">No recent stock movements recorded.</div>
            )}
          </div>
        </div>
      </div>

      {action === "purchase" && <PurchaseRequestDialog open onClose={() => setAction(null)} onDone={load} />}
      {action && action !== "purchase" && <ActionDialog action={action} open onClose={() => setAction(null)} onDone={load} />}
    </div>
  );
}

function AttnRow({ icon: Icon, color, label, value, onClick, testid }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#F8FAFC] active:scale-[0.98] transition-all"
      data-testid={testid}
    >
      <span className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
        <Icon className={`w-4 h-4 ${color}`} />
        {label}
      </span>
      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${value > 0 ? "bg-slate-100 " + color : "text-slate-400"}`}>
        {value}
      </span>
    </button>
  );
}
