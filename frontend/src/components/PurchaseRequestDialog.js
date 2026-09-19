import React, { useEffect, useState } from "react";
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
import { Plus, Trash2, ShoppingCart } from "lucide-react";

export default function PurchaseRequestDialog({ open, onClose, onDone }) {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([{ product_id: "", qty: "" }]);
  const [supplierId, setSupplierId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setItems([{ product_id: "", qty: "" }]); setSupplierId(""); setNote("");
    api.get("/products").then((r) => setProducts(r.data));
    api.get("/master/suppliers").then((r) => setSuppliers(r.data)).catch(() => {});
  }, [open]);

  const setItem = (i, k, v) => setItems((arr) => arr.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addRow = () => setItems((arr) => [...arr, { product_id: "", qty: "" }]);
  const removeRow = (i) => setItems((arr) => arr.filter((_, idx) => idx !== i));

  const submit = async () => {
    const valid = items.filter((it) => it.product_id && +it.qty > 0);
    if (valid.length === 0) return toast.error("Add at least one product with quantity");
    setBusy(true);
    try {
      await api.post("/procurement", {
        supplier_id: supplierId || null,
        items: valid.map((it) => ({ product_id: it.product_id, qty: +it.qty })),
        note,
      });
      toast.success("Purchase request raised — sent to Finance for cost verification");
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto" data-testid="pr-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <span>New Purchase Request</span>
          </DialogTitle>
          <DialogDescription>Finance verifies unit costs before issuing official Purchase Orders. Inventory reflects on delivery.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Preferred Supplier (Optional)</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger data-testid="pr-supplier-select" className="mt-1.5 h-11 bg-white border-[#E2E8F0]">
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">
                {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Procurement Items</Label>
            {items.map((it, i) => (
              <div key={i} className="flex gap-2 items-center bg-[#F8FAFC] p-2 rounded-xl border border-[#E2E8F0]">
                <Select value={it.product_id} onValueChange={(v) => setItem(i, "product_id", v)}>
                  <SelectTrigger data-testid={`pr-item-product-${i}`} className="h-10 bg-white border-[#E2E8F0] flex-1">
                    <SelectValue placeholder="Select Product" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#E2E8F0] shadow-lg max-h-64">
                    {products.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <span className="font-mono text-xs font-semibold text-[#0091FF] mr-2">{p.sku}</span>
                        <span>{p.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  data-testid={`pr-item-qty-${i}`}
                  type="number"
                  step="any"
                  value={it.qty}
                  onChange={(e) => setItem(i, "qty", e.target.value)}
                  className="h-10 w-24 bg-white font-mono"
                  placeholder="Qty"
                />
                {items.length > 1 && (
                  <button
                    onClick={() => removeRow(i)}
                    data-testid={`pr-remove-${i}`}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              onClick={addRow}
              data-testid="pr-add-row"
              className="h-9 text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1 text-[#0091FF]" /> Add Line Item
            </Button>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Requisition Note</Label>
            <Textarea
              data-testid="pr-note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1.5 rounded-lg border border-[#E2E8F0] bg-white text-sm"
              rows={2}
              placeholder="Reason for requisition / urgency notes"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={busy} data-testid="pr-submit-btn">
            {busy ? "Submitting…" : "Raise Purchase Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
