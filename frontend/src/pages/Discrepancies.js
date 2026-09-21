import React, { useEffect, useState, useMemo } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { TableSkeleton } from "../components/PageSkeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Send, History } from "lucide-react";

const STATUS_BADGE = {
  open: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-rose-50 text-rose-700 border-rose-200",
  pending_approval: "bg-amber-50 text-amber-800 border-amber-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function Discrepancies() {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("open");
  const [propose, setPropose] = useState(null);
  const [busy, setBusy] = useState(false);

  const canPropose = ["operations", "admin"].includes(user.role);
  const canApprove = ["finance", "admin"].includes(user.role);

  const load = () => api.get("/discrepancies").then((r) => setItems(r.data)).catch(() => setItems([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (status === "open") return items.filter((d) => d.status === "open" || d.status === "pending");
    if (status === "pending_approval") return items.filter((d) => d.status === "pending_approval" || d.pending_correction);
    if (status === "resolved") return items.filter((d) => d.status === "resolved" || d.status === "approved" || d.status === "rejected");
    return items;
  }, [items, status]);

  if (!items) {
    return <TableSkeleton rows={4} />;
  }

  const act = async (id, kind, note) => {
    setBusy(true);
    try {
      await api.post(`/discrepancies/${id}/${kind}`, { note });
      toast.success(kind === "approve" ? "Correction approved — ledger stock updated" : "Correction rejected");
      load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Discrepancy Resolution</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Material variances require dual-authorization before inventory adjustments are committed.</p>
        </div>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl h-auto">
          <TabsTrigger value="open" data-testid="disc-tab-open" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Active Discrepancies
          </TabsTrigger>
          <TabsTrigger value="pending_approval" data-testid="disc-tab-pending" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Awaiting Finance
          </TabsTrigger>
          <TabsTrigger value="resolved" data-testid="disc-tab-resolved" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Resolved Logs
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <StaggerContainer className="space-y-3.5">
        {filtered.map((d) => (
          <StaggerItem key={d.id}>
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              data-testid={`disc-row-${d.id}`}
              className={`rounded-2xl border p-5 shadow-xs transition-all card-lift ${
                d.status === "open" || d.status === "pending"
                  ? "border-rose-200 bg-white"
                  : d.status === "pending_approval"
                  ? "border-amber-200 bg-white"
                  : "border-[#E2E8F0] bg-white"
              }`}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${STATUS_BADGE[d.status] || "bg-slate-100"}`}>
                  {(d.status || "open").replace(/_/g, " ")}
                </Badge>
                <span className="font-semibold text-base text-[#010B1C]">{d.product_name || d.product?.name || "Material"}</span>
                <span className="text-slate-500 text-sm">@ {d.location_name || d.location?.name || "Facility"}</span>
                <span className={`font-mono font-bold text-base ml-auto ${d.balance < 0 || d.delta < 0 ? "text-rose-600" : "text-emerald-600"}`}>
                  Variance: {d.delta > 0 ? `+${d.delta}` : d.delta} (Sys: {d.balance})
                </span>
              </div>
              <div className="mt-2 text-xs text-slate-400 font-mono">Flagged on {new Date(d.created_at).toLocaleString()}</div>

              {d.pending_correction && (
                <div className="mt-3.5 rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                  <div className="text-xs uppercase tracking-wider text-amber-800 font-mono font-semibold mb-1">Proposed Adjustment</div>
                  <div className="text-sm text-slate-800 font-medium">
                    Delta: <span className="font-mono font-bold text-amber-800">{d.pending_correction.adjust_qty > 0 ? "+" : ""}{d.pending_correction.adjust_qty}</span> — {d.pending_correction.note}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">Proposed by {d.pending_correction.by}</div>
                </div>
              )}
              {d.resolution_note && <div className="mt-2.5 text-xs text-slate-500 italic bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">Resolution: {d.resolution_note}</div>}

              {d.audit?.length > 0 && (
                <div className="mt-3 border-t border-[#E2E8F0] pt-2.5 space-y-1">
                  {d.audit.slice(-4).map((a, i) => (
                    <div key={i} className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-[#0091FF]" />
                      <span className="text-slate-700 uppercase font-semibold">{a.action}</span> by {a.by} — {a.detail}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-[#E2E8F0]/70">
                {d.status === "open" && canPropose && (
                  <Button onClick={() => setPropose(d)} data-testid={`propose-btn-${d.id}`} className="h-9 text-xs font-semibold">
                    <Send className="w-4 h-4 mr-1.5" /> Propose Variance Fix
                  </Button>
                )}
                {d.status === "pending_approval" && canApprove && (
                  <>
                    <Button onClick={() => act(d.id, "approve", "")} disabled={busy} data-testid={`approve-disc-${d.id}`} className="h-9 text-xs font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Variance
                    </Button>
                    <Button onClick={() => act(d.id, "reject", "")} disabled={busy} data-testid={`reject-disc-${d.id}`} variant="outline" className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                      <XCircle className="w-4 h-4 mr-1.5" /> Reject Proposal
                    </Button>
                  </>
                )}
                {d.status === "pending_approval" && !canApprove && (
                  <span className="text-xs text-amber-700 font-medium bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Awaiting Finance verification &amp; approval…
                  </span>
                )}
              </div>
            </motion.div>
          </StaggerItem>
        ))}
        {items.length === 0 && (
          <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border border-[#E2E8F0] font-mono">
            No discrepancies in this category.
          </div>
        )}
      </StaggerContainer>

      {propose && <ProposeDialog disc={propose} onClose={() => setPropose(null)} onDone={load} />}
    </div>
  );
}

function ProposeDialog({ disc, onClose, onDone }) {
  const [adjust, setAdjust] = useState(String(Math.abs(disc.balance)));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/discrepancies/${disc.id}/propose`, { note, adjust_qty: +adjust });
      toast.success("Correction proposed — sent to Finance for approval");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Propose Discrepancy Correction</DialogTitle>
          <DialogDescription>{disc.product_name} @ {disc.location_name} · Current balance: {disc.balance}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Adjustment Quantity (+/-)</Label>
            <Input
              data-testid="propose-adjust-input"
              type="number"
              step="any"
              value={adjust}
              onChange={(e) => setAdjust(e.target.value)}
              className="mt-1.5 h-11 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">Adjustments only apply after dual verification by Finance.</p>
          </div>
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Operational Justification (Required)</Label>
            <Textarea
              data-testid="propose-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm"
              rows={3}
              placeholder="e.g. Weighbridge calibration mismatch on intake hopper 2…"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !note} data-testid="propose-submit-btn">
            {busy ? "Submitting…" : "Send to Finance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
