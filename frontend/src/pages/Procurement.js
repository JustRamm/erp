import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { PO_STAGES, PO_STATUS_COLORS } from "../lib/constants";
import PurchaseRequestDialog from "../components/PurchaseRequestDialog";
import { TableSkeleton } from "../components/PageSkeleton";
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
import { ShoppingCart, Plus, Clock, CheckCircle2, XCircle, Truck, PackageCheck } from "lucide-react";

export default function Procurement() {
  const { user } = useAuth();
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("active");
  const [prOpen, setPrOpen] = useState(false);
  const [approve, setApprove] = useState(null);
  const [update, setUpdate] = useState(null);
  const [deliver, setDeliver] = useState(null);

  const load = () => api.get("/procurement").then((r) => setOrders(r.data)).catch(() => setOrders([]));
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!orders) return [];
    if (tab === "pending") return orders.filter((o) => o.status === "requested");
    if (tab === "delivered") return orders.filter((o) => o.status === "delivered");
    if (tab === "rejected") return orders.filter((o) => o.status === "rejected");
    return orders.filter((o) => !["requested", "delivered", "rejected"].includes(o.status));
  }, [orders, tab]);

  if (!orders) {
    return <TableSkeleton rows={4} />;
  }

  const canRaise = ["operations", "admin"].includes(user.role);
  const canApprove = ["finance", "admin"].includes(user.role);
  const canOps = ["operations", "admin"].includes(user.role);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Procurement Pipeline</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Requisition verification, supplier PO issuance, and receiving checkpoints.</p>
        </div>
        {canRaise && (
          <Button onClick={() => setPrOpen(true)} data-testid="raise-pr-btn" className="h-10">
            <Plus className="w-4 h-4 mr-1.5" /> New Purchase Request
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl h-auto">
          <TabsTrigger value="pending" data-testid="proc-tab-pending" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Pending Finance
          </TabsTrigger>
          <TabsTrigger value="active" data-testid="proc-tab-active" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Live Orders
          </TabsTrigger>
          <TabsTrigger value="delivered" data-testid="proc-tab-delivered" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Delivered &amp; Stocked
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="proc-tab-rejected" className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
            Rejected
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-4">
        {filtered.map((o) => (
          <div key={o.id} data-testid={`proc-row-${o.number}`} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#0091FF] bg-[#EBF5FA] px-2.5 py-1 rounded-md border border-[#98CAE4]/40">
                {o.po_number || o.number}
              </span>
              <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${PO_STATUS_COLORS[o.status] || ""}`}>
                {o.status.replace(/_/g, " ")}
              </Badge>
              {o.supplier_name && <span className="text-xs font-medium text-slate-600 font-body">Supplier: {o.supplier_name}</span>}
              {o.total_cost != null && <span className="ml-auto font-mono text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">${o.total_cost}</span>}
            </div>

            <div className="mt-4 space-y-1.5 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]/70">
              {(o.items || []).map((it, idx) => (
                <div key={it.product_id || idx} className="text-sm flex items-center justify-between">
                  <span className="text-slate-800 font-medium">{it.product_name || "Raw Material"}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">
                      {it.qty ?? it.requested_qty ?? 0} {it.unit || "kg"}{it.unit_cost != null ? ` @ $${it.unit_cost}` : ""}
                    </span>
                    {(it.received_qty > 0) && (
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                        recv {it.received_qty}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {(!o.items || o.items.length === 0) && (
                <div className="text-xs text-slate-400 italic">No line items specified</div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Requested by {o.requested_by || o.requester_name || o.created_by_name || "Operations Manager"}</span>
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2.5 pt-3 border-t border-[#E2E8F0]">
              {o.status === "requested" && canApprove && (
                <>
                  <Button onClick={() => setApprove(o)} data-testid={`approve-pr-${o.number}`} className="h-9 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve &amp; Set Cost
                  </Button>
                  <Button onClick={() => setUpdate({ order: o, reject: true })} data-testid={`reject-pr-${o.number}`} variant="outline" className="h-9 text-xs border-rose-200 text-rose-600 hover:bg-rose-50">
                    <XCircle className="w-4 h-4 mr-1.5" /> Reject
                  </Button>
                </>
              )}
              {!["requested", "delivered", "rejected"].includes(o.status) && canOps && (
                <>
                  <Button onClick={() => setUpdate({ order: o })} data-testid={`update-order-${o.number}`} variant="outline" className="h-9 text-xs">
                    <Clock className="w-4 h-4 mr-1.5 text-[#0091FF]" /> Update Stage / Telemetry
                  </Button>
                  <Button onClick={() => setDeliver(o)} data-testid={`deliver-order-${o.number}`} className="h-9 text-xs font-semibold">
                    <PackageCheck className="w-4 h-4 mr-1.5" /> Receive &amp; Stock
                  </Button>
                </>
              )}
            </div>

            {o.timeline?.length > 1 && (
              <div className="mt-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]/60 space-y-1.5">
                {o.timeline.slice(-4).map((t, i) => (
                  <div key={i} className="text-xs text-slate-500 font-mono flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5 text-[#0091FF] shrink-0" />
                    <span className="text-slate-700 font-semibold">{t.label}</span>
                    {t.note && <span className="text-slate-500">— {t.note}</span>}
                    <span className="ml-auto text-slate-400 text-[11px]">{new Date(t.at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-slate-400 text-sm py-12 text-center bg-white rounded-2xl border border-[#E2E8F0]">
            No procurement orders in this status view.
          </div>
        )}
      </div>

      <PurchaseRequestDialog open={prOpen} onClose={() => setPrOpen(false)} onDone={load} />
      {approve && <ApproveDialog order={approve} onClose={() => setApprove(null)} onDone={load} />}
      {update && <UpdateDialog data={update} onClose={() => setUpdate(null)} onDone={load} />}
      {deliver && <DeliverDialog order={deliver} onClose={() => setDeliver(null)} onDone={load} />}
    </div>
  );
}

function ApproveDialog({ order, onClose, onDone }) {
  const [costs, setCosts] = useState(Object.fromEntries(order.items.map((it) => [it.product_id, it.unit_cost || ""])));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      await api.post(`/procurement/${order.id}/approve`, {
        items: order.items.map((it) => ({ product_id: it.product_id, unit_cost: +costs[it.product_id] })),
        note,
      });
      toast.success("PR approved — order created & sent to Operations");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Unit Costs &amp; Authorize PO</DialogTitle>
          <DialogDescription>{order.number} · Enter approved supplier unit price per item to generate official PO.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.product_id} className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
              <div className="flex-1">
                <div className="text-sm font-semibold text-[#010B1C]">{it.product_name}</div>
                <div className="text-xs text-slate-500 font-mono">{it.qty} {it.unit}</div>
              </div>
              <Input
                data-testid={`approve-cost-${it.product_id}`}
                type="number"
                step="any"
                value={costs[it.product_id]}
                onChange={(e) => setCosts({ ...costs, [it.product_id]: e.target.value })}
                className="w-28 h-10 bg-white font-mono"
                placeholder="Unit $"
              />
            </div>
          ))}
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white text-sm"
            rows={2}
            placeholder="Finance approval note / budget reference (optional)"
            data-testid="approve-note"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="approve-submit-btn">
            {busy ? "Authorizing…" : "Authorize PO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateDialog({ data, onClose, onDone }) {
  const { order, reject } = data;
  const [stage, setStage] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      if (reject) {
        await api.post(`/procurement/${order.id}/reject`, { note });
        toast.success("PR rejected");
      } else {
        await api.post(`/procurement/${order.id}/update`, { stage: stage || null, note });
        toast.success("Order stage updated");
      }
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{reject ? "Reject Purchase Request" : "Update Supply Chain Stage"}</DialogTitle>
          <DialogDescription>{order.po_number || order.number}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!reject && (
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Transit Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger data-testid="update-stage-select" className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
                  <SelectValue placeholder="Keep current stage" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                  {PO_STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">{reject ? "Rejection Reason" : "Status Telemetry Note"}</Label>
            <Textarea
              data-testid="update-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm"
              rows={2}
              placeholder={reject ? "Reason for denying requisition…" : "e.g. In transit on vessel MV Nordic line 4…"}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={submit}
            disabled={busy}
            data-testid="update-submit-btn"
            variant={reject ? "destructive" : "default"}
          >
            {busy ? "Saving…" : reject ? "Confirm Rejection" : "Update Stage"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliverDialog({ order, onClose, onDone }) {
  const [locations, setLocations] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [qtys, setQtys] = useState(Object.fromEntries(order.items.map((it) => [it.product_id, it.qty - (it.received_qty || 0)])));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/master/locations").then((r) => setLocations(r.data)); }, []);
  const submit = async () => {
    if (!locationId) return toast.error("Select a storage location");
    setBusy(true);
    try {
      await api.post(`/procurement/${order.id}/deliver`, {
        location_id: locationId,
        items: order.items.map((it) => ({ product_id: it.product_id, received_qty: +qtys[it.product_id] || 0 })),
        note,
      });
      toast.success("Delivery recorded — inventory balances incremented");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setBusy(false); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <PackageCheck className="w-4 h-4" />
            </div>
            <span>Receive Shipment Delivery</span>
          </DialogTitle>
          <DialogDescription>Receiving delivery logs incoming material quantities into selected facility and records ledger entries.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Destination Storage Location</Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger data-testid="deliver-location-select" className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
                <SelectValue placeholder="Select warehouse / raw silo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Received Line Quantities</Label>
            {order.items.map((it) => (
              <div key={it.product_id} className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0]">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-[#010B1C]">{it.product_name}</div>
                  <div className="text-xs text-slate-500 font-mono">Ordered {it.qty} {it.unit} @ ${it.unit_cost}</div>
                </div>
                <Input
                  data-testid={`deliver-qty-${it.product_id}`}
                  type="number"
                  step="any"
                  value={qtys[it.product_id]}
                  onChange={(e) => setQtys({ ...qtys, [it.product_id]: e.target.value })}
                  className="w-24 h-10 bg-white font-mono"
                />
              </div>
            ))}
          </div>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-lg border border-[#E2E8F0] bg-white text-sm"
            rows={2}
            placeholder="Receiving condition / QA inspection note (optional)"
            data-testid="deliver-note"
          />
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="deliver-submit-btn">
            {busy ? "Stocking…" : "Confirm & Stock Inventory"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
