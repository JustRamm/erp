import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { TableSkeleton } from "../components/PageSkeleton";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { Search, Boxes, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Inventory() {
  const [inv, setInv] = useState(null);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => { api.get("/inventory").then((r) => setInv(r.data)).catch(() => setInv([])); }, []);

  const filtered = useMemo(() => {
    if (!inv) return [];
    const s = q.toLowerCase();
    return inv.filter((e) =>
      (e.product?.name || "").toLowerCase().includes(s) ||
      (e.product?.sku || "").toLowerCase().includes(s) ||
      (e.product?.category_name || "").toLowerCase().includes(s));
  }, [inv, q]);

  if (!inv) {
    return <TableSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Stock &amp; Inventory</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Location-aware derived balances grounded in the double-entry immutable ledger.</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-testid="inventory-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by product name, SKU, or category…"
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      <StaggerContainer className="space-y-3">
        {filtered.map((e) => {
          const locs = e.locations || [];
          const prod = e.product || {};
          const totalVal = e.total ?? e.total_qty ?? 0;
          return (
            <StaggerItem key={prod.id || Math.random()}>
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                data-testid={`inventory-row-${prod.sku || "item"}`}
                className="group rounded-2xl border border-[#E2E8F0] bg-white p-5 card-lift cursor-pointer shadow-xs"
                onClick={() => prod.id && navigate(`/ledger?product=${prod.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#EBF5FA] flex items-center justify-center shrink-0 text-[#0091FF] transition-transform group-hover:scale-105 duration-200">
                    <Boxes className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-semibold text-base text-[#010B1C]">{prod.name || "Material Item"}</span>
                      <span className="font-mono text-xs font-semibold text-[#0091FF] bg-[#EBF5FA] px-2.5 py-0.5 rounded-lg border border-[#98CAE4]/40">{prod.sku || "SKU"}</span>
                      {prod.category_name && (
                        <Badge variant="outline" className="text-[11px] font-medium border-[#E2E8F0] text-slate-600 bg-[#F8FAFC]">
                          {prod.category_name}
                        </Badge>
                      )}
                      <Badge className={`text-[10px] uppercase font-mono ${
                        prod.tracking_mode === "unique"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : "bg-slate-100 text-slate-700 border-slate-200"
                      }`}>
                        {prod.tracking_mode || "bulk"}
                      </Badge>
                    </div>
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {locs.map((l) => (
                        <span
                          key={l.location_id || l.location_name}
                          className={`text-xs font-mono px-2.5 py-1 rounded-lg border transition-colors ${
                            l.balance < 0
                              ? "border-rose-200 text-rose-700 bg-rose-50 font-semibold"
                              : "border-[#E2E8F0] text-slate-600 bg-[#F8FAFC] group-hover:bg-white"
                          }`}
                        >
                          {l.location_name}: <strong className="text-[#010B1C]">{l.balance}</strong>
                        </span>
                      ))}
                      {locs.length === 0 && <span className="text-xs text-slate-400 font-mono italic">no movements recorded</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-head text-2xl font-bold ${e.negative ? "text-rose-600" : e.low_stock ? "text-amber-600" : "text-[#010B1C]"}`}>
                      {totalVal}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 font-mono font-medium">{prod.unit || "kg"}</div>
                    {e.negative && <Badge className="mt-1 bg-rose-50 text-rose-700 border-rose-200 text-[10px] animate-pulse-glow">Discrepancy</Badge>}
                    {!e.negative && e.low_stock && <Badge className="mt-1 bg-amber-50 text-amber-800 border-amber-200 text-[10px]">Low stock</Badge>}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-hover:translate-x-1 duration-200" />
                </div>
              </motion.div>
            </StaggerItem>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border border-[#E2E8F0] font-mono">
            No matching inventory items found.
          </div>
        )}
      </StaggerContainer>
    </div>
  );
}
