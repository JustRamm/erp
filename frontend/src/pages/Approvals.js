import React, { useEffect, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { TableSkeleton } from "../components/PageSkeleton";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { ClipboardCheck, CheckCircle2, XCircle, Layers, DollarSign } from "lucide-react";

const TYPE_META = {
  category_create: { label: "New Category", icon: Layers, color: "text-[#0091FF] bg-sky-50 border-sky-200" },
  category_update: { label: "Edit Category", icon: Layers, color: "text-amber-800 bg-amber-50 border-amber-200" },
  product_cost_update: { label: "Cost Change", icon: DollarSign, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

export default function Approvals() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/change-requests?status=${status}`).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) {
    return <TableSkeleton rows={4} />;
  }

  const act = async (id, kind) => {
    setBusy(true);
    try {
      await api.post(`/change-requests/${id}/${kind}`, { note: "" });
      toast.success(kind === "approve" ? "Approved & applied" : "Rejected");
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Governance &amp; Approvals</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Dual-authorization gateway for master-data taxonomies, formulations, and standard pricing.</p>
        </div>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl h-auto">
          <TabsTrigger value="pending" data-testid="cr-tab-pending" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Pending Action
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="cr-tab-approved" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Approved History
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="cr-tab-rejected" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <StaggerContainer className="space-y-3.5">
        {items.map((c) => {
          const m = TYPE_META[c.type] || { label: c.type, icon: ClipboardCheck, color: "text-slate-700 bg-slate-100 border-slate-200" };
          return (
            <StaggerItem key={c.id}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                data-testid={`cr-row-${c.id}`}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 card-lift shadow-xs"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${m.color}`}>
                    <m.icon className="w-3 h-3 mr-1" />
                    {m.label}
                  </Badge>
                  <span className="text-sm font-semibold text-[#010B1C]">{c.summary}</span>
                  <span className="ml-auto text-xs text-slate-500 font-mono">Requested by {c.requested_by}</span>
                </div>
                <div className="mt-2 text-xs text-slate-400 font-mono">
                  {new Date(c.created_at).toLocaleString()}
                  {c.approved_by ? ` · ${c.status} by ${c.approved_by}` : ""}
                </div>
                {c.status === "pending" && (
                  <div className="mt-4 flex gap-2.5 pt-3 border-t border-[#E2E8F0]">
                    <Button onClick={() => act(c.id, "approve")} disabled={busy} data-testid={`cr-approve-${c.id}`} className="h-9 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve &amp; Commit
                    </Button>
                    <Button onClick={() => act(c.id, "reject")} disabled={busy} data-testid={`cr-reject-${c.id}`} variant="outline" className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject Request
                    </Button>
                  </div>
                )}
              </motion.div>
            </StaggerItem>
          );
        })}
        {items.length === 0 && (
          <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border border-[#E2E8F0] font-mono">
            No {status} change requests found.
          </div>
        )}
      </StaggerContainer>
    </div>
  );
}
