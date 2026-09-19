import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { useSearchParams } from "react-router-dom";
import { TXN_COLORS } from "../lib/constants";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { TableSkeleton } from "../components/PageSkeleton";
import { Search } from "lucide-react";

export default function Ledger() {
  const [txns, setTxns] = useState(null);
  const [q, setQ] = useState("");
  const [params] = useSearchParams();
  const productFilter = params.get("product");

  useEffect(() => {
    const url = productFilter ? `/transactions?product_id=${productFilter}&limit=500` : "/transactions?limit=500";
    api.get(url).then((r) => setTxns(r.data)).catch(() => setTxns([]));
  }, [productFilter]);

  const filtered = useMemo(() => {
    if (!txns) return [];
    const s = q.toLowerCase();
    return txns.filter((t) =>
      t.product_name?.toLowerCase().includes(s) ||
      t.location_name?.toLowerCase().includes(s) ||
      t.txn_label?.toLowerCase().includes(s) ||
      (t.note || "").toLowerCase().includes(s));
  }, [txns, q]);

  if (!txns) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Transaction Ledger</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-body">Cryptographically verifiable, append-only circular production &amp; transfer events.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-testid="ledger-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter ledger events by product, location, or actor…"
          className="pl-10 h-11"
        />
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3.5 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider text-slate-500 font-semibold font-body">
          <div className="col-span-2">Event Type</div>
          <div className="col-span-3">Product / Material</div>
          <div className="col-span-2">Facility / Bin</div>
          <div className="col-span-1 text-right">Delta</div>
          <div className="col-span-2">Logged By</div>
          <div className="col-span-2 text-right">Timestamp</div>
        </div>
        <div className="divide-y divide-[#F1F5F9]">
          {filtered.map((t) => (
            <div key={t.id} data-testid="ledger-entry" className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-3.5 items-center text-sm hover:bg-[#F8FAFC]/80 transition-colors">
              <div className="md:col-span-2">
                <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${
                  t.delta >= 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {t.txn_label}
                </Badge>
              </div>
              <div className="md:col-span-3 min-w-0">
                <div className="font-semibold text-[#010B1C] truncate">{t.product_name}</div>
                <div className="font-mono text-[11px] text-[#0091FF]">{t.product_sku}</div>
              </div>
              <div className="md:col-span-2 text-slate-600 text-xs truncate">{t.location_name}</div>
              <div className={`md:col-span-1 text-right font-mono font-bold text-sm ${t.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {t.delta >= 0 ? "+" : ""}{t.delta}
              </div>
              <div className="md:col-span-2 text-slate-600 text-xs truncate">{t.actor_name}</div>
              <div className="md:col-span-2 text-right text-slate-400 font-mono text-xs">{new Date(t.created_at).toLocaleString()}</div>
              {t.note && (
                <div className="col-span-2 md:col-span-12 text-xs text-slate-500 bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-[#E2E8F0]/60 mt-1">
                  Note: {t.note}{t.total_cost != null ? ` · Total Value: $${t.total_cost}` : ""}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-slate-400 text-sm py-12 text-center">No ledger entries match criteria.</div>
          )}
        </div>
      </div>
    </div>
  );
}
