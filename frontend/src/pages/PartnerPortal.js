import React, { useEffect, useMemo, useState, useCallback } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { DashboardSkeleton, TableSkeleton } from "../components/PageSkeleton";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Handshake, Hammer, PackagePlus, Boxes, Package, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function PartnerPortal() {
  const { user } = useAuth();
  if (user.role === "partner") return <PartnerView user={user} />;
  return <OpsPartnerView />;
}

/* ---------------- Partner's own dashboard ---------------- */
function PartnerView({ user }) {
  const [d, setD] = useState(null);
  const [fab, setFab] = useState(false);
  const [matReq, setMatReq] = useState(false);
  const load = () => api.get("/partner/dashboard").then((r) => setD(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  if (!d) {
    return <DashboardSkeleton />;
  }

  const STATUS = {
    pending: "bg-amber-50 text-amber-800 border-amber-200",
    approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Partner Fabrication Portal</h1>
            <Badge className="bg-blue-50 text-blue-700 border-blue-200">{d?.location_name || "Partner Yard"}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1 font-body">Held raw material, local fabrication requests, and custody ledger transfers.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => setFab(true)} data-testid="partner-fabricate-btn" className="h-11">
          <Hammer className="w-4 h-4 mr-1.5" /> Fabricate End Product
        </Button>
        <Button onClick={() => setMatReq(true)} data-testid="partner-material-btn" variant="outline" className="h-11">
          <PackagePlus className="w-4 h-4 mr-1.5 text-[#0091FF]" /> Request Raw Stock
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeldList title="Raw Materials In Yard" icon={Boxes} rows={d?.materials || []} testid="partner-materials" empty="No materials currently in custody — request stock from Operations." />
        <HeldList title="Fabricated Finished Goods" icon={Package} rows={d?.end_products || []} testid="partner-endproducts" empty="No end products currently fabricated in yard." />
      </div>

      <div>
        <h2 className="font-head text-lg font-bold text-[#010B1C] mb-4">Requisition &amp; Fabrication Requests</h2>
        <div className="space-y-3">
          {(d?.requests || []).map((r) => (
            <div key={r.id} data-testid={`partner-req-${r.id}`} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 flex items-center gap-3.5 flex-wrap shadow-xs">
              <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${STATUS[r.status]}`}>{r.status}</Badge>
              <span className="text-xs uppercase font-mono font-semibold text-[#0091FF] bg-[#EBF5FA] px-2 py-0.5 rounded">{r.type}</span>
              <span className="text-sm font-semibold text-[#010B1C]">{r.summary}</span>
              <span className="ml-auto text-xs text-slate-400 font-mono">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
          ))}
          {(!d?.requests || d.requests.length === 0) && (
            <div className="text-slate-400 text-sm py-8 text-center bg-white rounded-2xl border border-[#E2E8F0]">No historical partner requests found.</div>
          )}
        </div>
      </div>

      {fab && <FabricationDialog materials={d?.materials || []} onClose={() => setFab(false)} onDone={load} />}
      {matReq && <MaterialDialog onClose={() => setMatReq(false)} onDone={load} />}
    </div>
  );
}

function HeldList({ title, icon: Icon, rows, empty, testid }) {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)]" data-testid={testid}>
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#E2E8F0]">
        <div className="w-8 h-8 rounded-lg bg-[#EBF5FA] flex items-center justify-center text-[#0091FF]">
          <Icon className="w-4 h-4" />
        </div>
        <h2 className="font-head text-base font-bold text-[#010B1C]">{title}</h2>
      </div>
      <div className="space-y-2">
        {rows.map((m) => (
          <div key={m.product.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F8FAFC] transition-colors border-b border-[#F1F5F9] last:border-0">
            <div>
              <div className="text-sm font-semibold text-[#010B1C]">{m.product.name}</div>
              <div className="text-xs font-mono text-[#0091FF]">{m.product.sku}</div>
            </div>
            <div className={`font-mono font-bold text-sm ${m.balance < 0 ? "text-rose-600" : "text-[#010B1C]"}`}>
              {m.balance} <span className="text-xs text-slate-500 font-normal">{m.product.unit}</span>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-slate-400 text-xs py-4 text-center">{empty}</div>}
      </div>
    </div>
  );
}

function FabricationDialog({ materials, onClose, onDone }) {
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [f, setF] = useState({ consumed_product_id: "", consumed_qty: "", produced_product_id: "", produced_qty: "", note: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api.get("/products").then((r) => setProducts(r.data));
    api.get("/categories").then((r) => setCats(r.data));
  }, []);
  const endCatIds = useMemo(() => new Set(cats.filter((c) => (c.group || "product") === "end_product").map((c) => c.id)), [cats]);
  const endProducts = useMemo(() => products.filter((p) => endCatIds.has(p.category_id)), [products, endCatIds]);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/partner/fabrication", {
        consumed_product_id: f.consumed_product_id, consumed_qty: +f.consumed_qty,
        produced_product_id: f.produced_product_id, produced_qty: +f.produced_qty, note: f.note,
      });
      toast.success("Fabrication request sent to Operations for confirmation");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-[#0091FF]" />
            <span>Fabricate Finished Product</span>
          </DialogTitle>
          <DialogDescription>Convert held raw inventory into finished municipal products. Stock updates once Operations verifies.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase text-[#0091FF]">1. Consumed Material (from Yard)</p>
            <Select value={f.consumed_product_id} onValueChange={(v) => setF({ ...f, consumed_product_id: v })}>
              <SelectTrigger data-testid="fab-consumed-product" className="h-11 bg-white border-[#E2E8F0]"><SelectValue placeholder="Select held material" /></SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                {materials.map((m) => <SelectItem key={m.product.id} value={m.product.id}>{m.product.name} ({m.balance} {m.product.unit})</SelectItem>)}
              </SelectContent>
            </Select>
            <Input data-testid="fab-consumed-qty" type="number" step="any" value={f.consumed_qty} onChange={(e) => setF({ ...f, consumed_qty: e.target.value })} className="h-11 font-mono" placeholder="Quantity consumed" />
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
            <p className="text-xs font-mono font-semibold uppercase text-emerald-700">2. Fabricated Output</p>
            <Select value={f.produced_product_id} onValueChange={(v) => setF({ ...f, produced_product_id: v })}>
              <SelectTrigger data-testid="fab-produced-product" className="h-11 bg-white border-[#E2E8F0]"><SelectValue placeholder="Select finished good" /></SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                {endProducts.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input data-testid="fab-produced-qty" type="number" step="any" value={f.produced_qty} onChange={(e) => setF({ ...f, produced_qty: e.target.value })} className="h-11 font-mono" placeholder="Quantity finished" />
          </div>
          <Textarea data-testid="fab-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white text-sm" rows={2} placeholder="Optional batch / work-order note" />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="fab-submit-btn">
            {busy ? "Submitting…" : "Submit Fabrication Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MaterialDialog({ onClose, onDone }) {
  const [products, setProducts] = useState([]);
  const [f, setF] = useState({ product_id: "", qty: "", note: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([api.get("/products"), api.get("/categories")]).then(([p, c]) => {
      const endIds = new Set(c.data.filter((x) => (x.group || "product") === "end_product").map((x) => x.id));
      setProducts(p.data.filter((x) => !endIds.has(x.category_id)));
    });
  }, []);
  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/partner/material-request", { product_id: f.product_id, qty: +f.qty, note: f.note });
      toast.success("Material request sent to Operations");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Raw Stock Dispatch</DialogTitle>
          <DialogDescription>Request dispatch of company granules or lumber to your partner yard location.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={f.product_id} onValueChange={(v) => setF({ ...f, product_id: v })}>
            <SelectTrigger data-testid="matreq-product" className="h-11 bg-white border-[#E2E8F0]"><SelectValue placeholder="Select raw material" /></SelectTrigger>
            <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} ({p.unit})</SelectItem>)}</SelectContent>
          </Select>
          <Input data-testid="matreq-qty" type="number" step="any" value={f.qty} onChange={(e) => setF({ ...f, qty: e.target.value })} className="h-11 font-mono" placeholder="Quantity requested" />
          <Textarea data-testid="matreq-note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} className="rounded-lg border border-[#E2E8F0] bg-white text-sm" rows={2} placeholder="Reason / project reference" />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="matreq-submit-btn">
            {busy ? "Requesting…" : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Ops/Admin: approve partner requests ---------------- */
function OpsPartnerView() {
  const [items, setItems] = useState(null);
  const [status, setStatus] = useState("pending");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/partner/requests?status=${status}`).then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  if (!items) {
    return <TableSkeleton rows={4} />;
  }

  const act = async (id, kind) => {
    setBusy(true);
    try { await api.post(`/partner/requests/${id}/${kind}`, { note: "" }); toast.success(kind === "approve" ? "Approved — ledger updated" : "Rejected"); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Partner Trust Authorization</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Review and authorize external fabricator stock consumptions and product receipts.</p>
        </div>
      </div>
      <Tabs value={status} onValueChange={setStatus}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl h-auto">
          <TabsTrigger value="pending" data-testid="pr-tab-pending" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">Pending Verification</TabsTrigger>
          <TabsTrigger value="approved" data-testid="pr-tab-approved" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">Approved</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="pr-tab-rejected" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">Rejected</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-3.5">
        {items.map((r) => (
          <div key={r.id} data-testid={`partnerreq-row-${r.id}`} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <Badge className="bg-sky-50 border border-sky-200 text-[#0091FF] text-[10px] uppercase font-mono px-2.5 py-0.5">
                {r.type === "fabrication" ? <Hammer className="w-3 h-3 mr-1" /> : <PackagePlus className="w-3 h-3 mr-1" />}
                {r.type}
              </Badge>
              <span className="text-sm font-semibold text-[#010B1C]">{r.summary}</span>
              <span className="ml-auto text-xs text-slate-500 font-mono">Partner: {r.requested_by}</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {new Date(r.created_at).toLocaleString()}
            </div>
            {r.status === "pending" && (
              <div className="mt-4 flex gap-2.5 pt-3 border-t border-[#E2E8F0]">
                <Button onClick={() => act(r.id, "approve")} disabled={busy} data-testid={`partner-approve-${r.id}`} className="h-9 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve &amp; Post Ledger
                </Button>
                <Button onClick={() => act(r.id, "reject")} disabled={busy} data-testid={`partner-reject-${r.id}`} variant="outline" className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                  <XCircle className="w-4 h-4 mr-1.5" /> Reject
                </Button>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">No {status} partner requests.</div>}
      </div>
    </div>
  );
}
