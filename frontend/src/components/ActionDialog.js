import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { MapPin, Camera, Loader2, Sparkles } from "lucide-react";

const TITLES = {
  consume: "Consume Stock", damage: "Report Damaged", transfer: "Transfer Stock",
  manufacture: "Log Production Run", deploy: "Deploy Asset",
};

export default function ActionDialog({ action, open, onClose, onDone }) {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({});
  const [gps, setGps] = useState(null);
  const [photoPath, setPhotoPath] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm({}); setGps(null); setPhotoPath(null);
    api.get("/products").then((r) => setProducts(r.data));
    api.get("/master/locations").then((r) => setLocations(r.data));
    api.get("/master/customers").then((r) => setCustomers(r.data)).catch(() => {});
  }, [open, action]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const selectedProduct = useMemo(() => products.find((p) => p.id === form.product_id), [products, form.product_id]);
  const producedProduct = useMemo(() => products.find((p) => p.id === form.produced_product_id), [products, form.produced_product_id]);
  const consumedProduct = useMemo(() => products.find((p) => p.id === form.consumed_product_id), [products, form.consumed_product_id]);

  const captureGps = () => {
    if (!navigator.geolocation) return toast.error("Geolocation unavailable");
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5) }),
      () => toast.error("Location permission denied"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setPhotoPath(data.storage_path);
      toast.success("Photo attached");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (action === "manufacture") {
        await api.post("/production/run", {
          consumed_product_id: form.consumed_product_id, consumed_location_id: form.consumed_location_id,
          consumed_qty: +form.consumed_qty, produced_product_id: form.produced_product_id,
          produced_location_id: form.produced_location_id, produced_qty: +form.produced_qty,
          unit_cost: form.unit_cost ? +form.unit_cost : null, note: form.note || "",
        });
      } else if (action === "transfer") {
        if (form.from_location_id === form.to_location_id) throw { response: { data: { detail: "Locations must differ" } } };
        await api.post("/transfer", {
          product_id: form.product_id, from_location_id: form.from_location_id,
          to_location_id: form.to_location_id, qty: +form.qty, note: form.note || "",
        });
      } else {
        const map = { consume: "consumed", damage: "damaged", deploy: "deployed" };
        const meta = {};
        if (action === "deploy") {
          meta.customer_id = form.customer_id;
          meta.install_location = form.install_location;
          if (gps) meta.gps = gps;
          if (photoPath) meta.photo = photoPath;
        }
        await api.post("/transactions", {
          txn_type: map[action], product_id: form.product_id, location_id: form.location_id,
          qty: +form.qty, note: form.note || "", meta,
        });
      }
      toast.success(`${TITLES[action]} recorded`);
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const ProductSelect = ({ value, onChange, filter, testid, label = "Product" }) => (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={testid} className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
          <SelectValue placeholder="Select product" />
        </SelectTrigger>
        <SelectContent className="bg-white border-[#E2E8F0] shadow-lg max-h-72">
          {products.filter(filter || (() => true)).map((p) => (
            <SelectItem key={p.id} value={p.id}>
              <span className="font-mono text-xs font-semibold text-[#0091FF] mr-2">{p.sku}</span>
              <span className="text-[#010B1C]">{p.name}</span>
              <span className="text-slate-500 ml-1">({p.unit})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const LocationSelect = ({ value, onChange, testid, label = "Location" }) => (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger data-testid={testid} className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
          <SelectValue placeholder="Select location" />
        </SelectTrigger>
        <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
          {locations.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );

  const QtyField = ({ prod, label = "Quantity", k = "qty" }) => (
    <div>
      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
        {label} {prod ? `(${prod.unit})` : ""}
      </Label>
      <Input
        data-testid={`${action}-${k}-input`}
        type="number"
        step="any"
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        className="mt-1.5 h-11 font-mono"
        placeholder="0"
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto" data-testid="action-dialog">
        <DialogHeader>
          <DialogTitle>{TITLES[action]}</DialogTitle>
          <DialogDescription>This operation creates an immutable double-entry ledger record.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {action === "manufacture" && (
            <>
              <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-4 space-y-3">
                <p className="text-xs font-mono font-semibold uppercase text-[#0091FF]">1. Consumed Feedstock</p>
                <ProductSelect value={form.consumed_product_id} onChange={(v) => set("consumed_product_id", v)}
                  filter={(p) => p.tracking_mode === "bulk"} testid="manufacture-consumed-product" label="Input material" />
                <LocationSelect value={form.consumed_location_id} onChange={(v) => set("consumed_location_id", v)} testid="manufacture-consumed-location" label="From location" />
                <QtyField prod={consumedProduct} k="consumed_qty" label="Consumed qty" />
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
                <p className="text-xs font-mono font-semibold uppercase text-emerald-700">2. Produced Output</p>
                <ProductSelect value={form.produced_product_id} onChange={(v) => set("produced_product_id", v)} testid="manufacture-produced-product" label="Output product" />
                <LocationSelect value={form.produced_location_id} onChange={(v) => set("produced_location_id", v)} testid="manufacture-produced-location" label="To location" />
                <QtyField prod={producedProduct} k="produced_qty" label="Produced qty" />
              </div>
            </>
          )}

          {action === "transfer" && (
            <>
              <ProductSelect value={form.product_id} onChange={(v) => set("product_id", v)} testid="transfer-product" />
              <LocationSelect value={form.from_location_id} onChange={(v) => set("from_location_id", v)} testid="transfer-from" label="Source Location" />
              <LocationSelect value={form.to_location_id} onChange={(v) => set("to_location_id", v)} testid="transfer-to" label="Destination Location" />
              <QtyField prod={selectedProduct} />
            </>
          )}

          {["consume", "damage", "deploy"].includes(action) && (
            <>
              <ProductSelect value={form.product_id} onChange={(v) => set("product_id", v)} testid={`${action}-product`} />
              <LocationSelect value={form.location_id} onChange={(v) => set("location_id", v)} testid={`${action}-location`} />
              <QtyField prod={selectedProduct} />
              {action === "deploy" && (
                <>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Customer / Project</Label>
                    <Select value={form.customer_id} onValueChange={(v) => set("customer_id", v)}>
                      <SelectTrigger data-testid="deploy-customer" className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                        {customers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.project ? ` — ${c.project}` : ""}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Install Location</Label>
                    <Input
                      data-testid="deploy-install-input"
                      value={form.install_location || ""}
                      onChange={(e) => set("install_location", e.target.value)}
                      className="mt-1.5 h-11"
                      placeholder="e.g. Riverside Park, Bay 3"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={captureGps} data-testid="deploy-gps-btn"
                      className="flex-1 h-11">
                      <MapPin className="w-4 h-4 mr-1 text-[#0091FF]" /> {gps ? `${gps.lat}, ${gps.lng}` : "Tag GPS"}
                    </Button>
                    <label className="flex-1">
                      <div className="h-11 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] flex items-center justify-center cursor-pointer text-sm font-medium transition-colors" data-testid="deploy-photo-btn">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#0091FF]" /> : <><Camera className="w-4 h-4 mr-1 text-slate-600" /> {photoPath ? "Photo Attached" : "Attach Photo"}</>}
                      </div>
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={uploadPhoto} />
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Note</Label>
            <Textarea
              data-testid={`${action}-note-input`}
              value={form.note || ""}
              onChange={(e) => set("note", e.target.value)}
              className="mt-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm"
              placeholder="Optional operational reference / telemetry note"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="action-submit-btn">
            {busy ? "Posting…" : "Confirm & Post Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
