import React, { useEffect, useMemo, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { MasterDataSkeleton } from "../components/PageSkeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Switch } from "../components/ui/switch";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { Plus, Trash2, Database, Boxes, Package, PackageCheck, MapPin, Truck, Handshake, Building, Pencil, DollarSign } from "lucide-react";

function toastResult(res, doneMsg) {
  if (res?.data?.status === "pending") toast.success("Change request sent to Finance for approval");
  else toast.success(doneMsg);
}

const GROUPS = [
  { key: "raw_material", label: "Raw Materials", icon: Boxes, hint: "granules, flakes, wash pellets" },
  { key: "product", label: "Intermediates", icon: Package, hint: "extruded lumber, sheets, profiles" },
  { key: "end_product", label: "Finished Goods", icon: PackageCheck, hint: "benches, planters, bollards" },
];

export default function MasterData() {
  const [tab, setTab] = useState("raw_material");
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">Master Data Configuration</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Manage product taxonomies, extrusion specifications, facilities, and ecosystem entities.</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-xl flex-wrap h-auto">
          {GROUPS.map((g) => (
            <TabsTrigger key={g.key} value={g.key} data-testid={`md-tab-${g.key}`} className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
              <g.icon className="w-3.5 h-3.5 mr-1.5 text-[#0091FF]" />{g.label}
            </TabsTrigger>
          ))}
          {[["locations", "Facilities & Bins", MapPin], ["suppliers", "Raw Suppliers", Truck], ["partners", "Recycling Partners", Handshake], ["customers", "Municipal Clients", Building]].map(([k, l, Icon]) => (
            <TabsTrigger key={k} value={k} data-testid={`md-tab-${k}`} className="data-[state=active]:bg-white data-[state=active]:text-[#010B1C] data-[state=active]:shadow-xs rounded-lg text-xs font-semibold py-2">
              <Icon className="w-3.5 h-3.5 mr-1.5 text-[#0091FF]" />{l}
            </TabsTrigger>
          ))}
        </TabsList>

        {GROUPS.map((g) => (
          <TabsContent key={g.key} value={g.key} className="mt-5"><GroupSection group={g} /></TabsContent>
        ))}
        <TabsContent value="locations" className="mt-5"><SimpleColl coll="locations" fields={[["name", "Name"], ["kind", "Kind"]]} /></TabsContent>
        <TabsContent value="suppliers" className="mt-5"><SimpleColl coll="suppliers" fields={[["name", "Name"], ["location", "Location"], ["phone", "Phone Number"]]} /></TabsContent>
        <TabsContent value="partners" className="mt-5"><SimpleColl coll="partners" fields={[["name", "Name"], ["location", "Location"], ["phone", "Phone Number"]]} /></TabsContent>
        <TabsContent value="customers" className="mt-5"><SimpleColl coll="customers" fields={[["name", "Name"], ["project", "Project / Municipal Contract"]]} /></TabsContent>
      </Tabs>
    </div>
  );
}

function GroupSection({ group }) {
  const { user } = useAuth();
  const isOps = user.role === "operations";
  const [cats, setCats] = useState(null);
  const [products, setProducts] = useState([]);
  const [types, setTypes] = useState([]);
  const [catDlg, setCatDlg] = useState(null);
  const [prodDlg, setProdDlg] = useState(false);
  const [costing, setCosting] = useState(null);

  const load = () => Promise.all([api.get("/categories"), api.get("/products"), api.get("/types")])
    .then(([c, p, t]) => { setCats(c.data); setProducts(p.data); setTypes(t.data); })
    .catch(() => { setCats([]); setProducts([]); setTypes([]); });
  useEffect(() => { load(); }, []);

  const groupCats = useMemo(() => (cats || []).filter((c) => (c.group || "product") === group.key), [cats, group.key]);
  const catIds = useMemo(() => new Set(groupCats.map((c) => c.id)), [groupCats]);
  const groupProducts = useMemo(() => products.filter((p) => catIds.has(p.category_id)), [products, catIds]);
  const canCost = ["admin", "operations", "finance"].includes(user.role);

  if (!cats) {
    return <MasterDataSkeleton />;
  }

  const delCat = async (id) => { await api.delete(`/categories/${id}`); load(); toast.success("Category removed"); };
  const delProd = async (id) => { await api.delete(`/products/${id}`); load(); toast.success("Item removed"); };

  return (
    <div className="space-y-8">
      {isOps && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 font-medium">
          Note: Operations role modifications to master categories &amp; formulations trigger change requests for Finance approval.
        </div>
      )}

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-head text-lg font-bold text-[#010B1C]">{group.label} Categories</h3>
            <p className="text-xs text-slate-500 font-body">{group.hint}</p>
          </div>
          <Button onClick={() => setCatDlg({})} data-testid={`add-category-${group.key}`} className="h-9 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Category
          </Button>
        </div>
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupCats.map((c) => (
            <StaggerItem key={c.id}>
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-5 card-lift shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-[#010B1C]">{c.name}</div>
                    <div className="font-mono text-xs font-semibold text-[#0091FF] mt-1">{c.sku_prefix} · {c.unit}</div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => setCatDlg(c)} data-testid={`edit-category-${c.name}`} className="p-1.5 text-slate-400 hover:text-[#0091FF] hover:bg-[#EBF5FA] rounded-lg transition-colors cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => delCat(c.id)} data-testid={`del-category-${c.name}`} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge className={`text-[10px] uppercase font-mono ${c.tracking_mode === "unique" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-slate-100 text-slate-700 border-slate-200"}`}>
                    {c.tracking_mode === "unique" ? "Unique-ID Serialized" : "Bulk Weight / Count"}
                  </Badge>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
          {groupCats.length === 0 && <div className="text-slate-400 text-sm col-span-3 bg-white p-6 rounded-2xl border border-[#E2E8F0] text-center font-mono">No categories defined in this section.</div>}
        </StaggerContainer>
      </div>

      {/* Products / SKUs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-head text-lg font-bold text-[#010B1C]">{group.label} Catalog &amp; SKUs</h3>
            <p className="text-xs text-slate-500 font-body">Individual manufactured SKUs, standard costs, and reorder levels.</p>
          </div>
          <Button onClick={() => setProdDlg(true)} data-testid={`add-product-${group.key}`} disabled={groupCats.length === 0} className="h-9 text-xs font-semibold">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
          </Button>
        </div>
        <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden divide-y divide-[#F1F5F9]">
          {groupProducts.map((p) => (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#F8FAFC] transition-colors">
              <span className="font-mono text-xs font-bold text-[#0091FF] bg-[#EBF5FA] px-2.5 py-1 rounded-md border border-[#98CAE4]/40 w-28 shrink-0">{p.sku}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-sm text-[#010B1C]">{p.name}</div>
                <div className="text-xs text-slate-500 font-body">{p.category_name}{p.type_name ? ` · ${p.type_name}` : ""} · {p.unit}</div>
              </div>
              <div className="text-right shrink-0 w-24">
                <div className="font-mono text-sm font-bold text-emerald-700">{p.unit_cost != null ? `$${p.unit_cost}` : "—"}</div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">std cost</div>
              </div>
              {canCost && (
                <button onClick={() => setCosting(p)} data-testid={`edit-cost-${p.sku}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                  <DollarSign className="w-4 h-4" />
                </button>
              )}
              <button onClick={() => delProd(p.id)} data-testid={`del-product-${p.sku}`} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {groupProducts.length === 0 && <div className="text-slate-400 text-sm py-8 text-center">No active SKUs. Create a category first, then register items.</div>}
        </div>
      </div>

      {catDlg && <CategoryDialog group={group.key} isOps={isOps} editing={catDlg.id ? catDlg : null} onClose={() => setCatDlg(null)} onDone={load} />}
      {prodDlg && <ProductDialog cats={groupCats} types={types} onClose={() => setProdDlg(false)} onDone={load} />}
      {costing && <CostDialog product={costing} isOps={isOps} onClose={() => setCosting(null)} onDone={load} />}
    </div>
  );
}

function CategoryDialog({ group, isOps, editing, onClose, onDone }) {
  const [f, setF] = useState(editing
    ? { name: editing.name, tracking_mode: editing.tracking_mode, unit: editing.unit, sku_prefix: editing.sku_prefix || "", low_stock_threshold: editing.low_stock_threshold ?? "" }
    : { name: "", tracking_mode: group === "end_product" ? "unique" : "bulk", unit: group === "raw_material" ? "kg" : "pieces", sku_prefix: "", low_stock_threshold: "" });
  const save = async () => {
    try {
      const payload = { name: f.name, tracking_mode: f.tracking_mode, unit: f.unit, group, sku_prefix: f.sku_prefix || null,
        low_stock_threshold: f.low_stock_threshold ? +f.low_stock_threshold : null, custom_fields: editing?.custom_fields || [] };
      const res = editing ? await api.patch(`/categories/${editing.id}`, payload) : await api.post("/categories", payload);
      toastResult(res, editing ? "Category updated" : "Category created");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "New"} Category Taxonomy</DialogTitle>
          {isOps && <DialogDescription className="text-amber-700 text-xs font-semibold">Note: Action requires Finance review.</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Category Name"><Input data-testid="category-name-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-11" placeholder="e.g. Recycled HDPE Lumber" /></Field>
          <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
            <div><div className="text-sm font-semibold text-[#010B1C]">Unique-ID Serialized Tracking</div><div className="text-xs text-slate-500 font-body">Off = bulk metric tonnage / count</div></div>
            <Switch data-testid="category-tracking-switch" checked={f.tracking_mode === "unique"} onCheckedChange={(v) => setF({ ...f, tracking_mode: v ? "unique" : "bulk" })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit of Measure"><Input data-testid="category-unit-input" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} className="h-11" placeholder="kg, MT, pieces" /></Field>
            <Field label="SKU Prefix"><Input data-testid="category-prefix-input" value={f.sku_prefix} onChange={(e) => setF({ ...f, sku_prefix: e.target.value })} className="h-11" placeholder="e.g. LUM-HDPE" /></Field>
          </div>
          <Field label="Low-Stock Alert Level (Optional)"><Input data-testid="category-threshold-input" type="number" value={f.low_stock_threshold} onChange={(e) => setF({ ...f, low_stock_threshold: e.target.value })} className="h-11 font-mono" /></Field>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} data-testid="save-category-btn">{isOps ? "Submit for Review" : (editing ? "Save Changes" : "Create Category")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProductDialog({ cats, types, onClose, onDone }) {
  const { user } = useAuth();
  const isOps = user.role === "operations";
  const [f, setF] = useState({ category_id: "", type_id: "", name: "", unit: "", low_stock_threshold: "", unit_cost: "" });
  const selectedCat = cats.find((c) => c.id === f.category_id);
  const create = async () => {
    try {
      const res = await api.post("/products", {
        category_id: f.category_id, type_id: f.type_id || null, name: f.name, unit: f.unit || null,
        low_stock_threshold: f.low_stock_threshold ? +f.low_stock_threshold : null,
        unit_cost: f.unit_cost ? +f.unit_cost : null, custom_field_values: {},
      });
      toastResult(res, "Item created");
      onDone(); onClose();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Register New Catalog Item</DialogTitle>
          {isOps && <DialogDescription className="text-amber-700 text-xs font-semibold">Requires Finance validation.</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Category Taxonomy">
            <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v, type_id: "" })}>
              <SelectTrigger data-testid="product-category-select" className="bg-white border-[#E2E8F0] h-11"><SelectValue placeholder="Select parent category" /></SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} ({c.unit})</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Type Specification (Optional)">
            <Select value={f.type_id} onValueChange={(v) => setF({ ...f, type_id: v })}>
              <SelectTrigger data-testid="product-type-select" className="bg-white border-[#E2E8F0] h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent className="bg-white border-[#E2E8F0] shadow-lg">{types.filter((t) => t.category_id === f.category_id).map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          <Field label="Product Name / Spec"><Input data-testid="product-name-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="h-11" placeholder="e.g. 2x4 Structural Plank 8ft" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Standard Unit Cost (per ${selectedCat?.unit || "unit"})`}><Input data-testid="product-cost-input" type="number" step="any" value={f.unit_cost} onChange={(e) => setF({ ...f, unit_cost: e.target.value })} className="h-11 font-mono" placeholder="optional" /></Field>
            <Field label="Low-stock Threshold"><Input data-testid="product-threshold-input" type="number" value={f.low_stock_threshold} onChange={(e) => setF({ ...f, low_stock_threshold: e.target.value })} className="h-11 font-mono" /></Field>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={create} data-testid="save-product-btn">{isOps ? "Submit for Approval" : "Create Item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CostDialog({ product, isOps, onClose, onDone }) {
  const [cost, setCost] = useState(product.unit_cost ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const res = await api.patch(`/products/${product.id}/cost`, { unit_cost: cost === "" ? null : +cost });
      toastResult(res, "Standard cost updated");
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
              <DollarSign className="w-4 h-4" />
            </div>
            <span>Update Standard Valuation</span>
          </DialogTitle>
          <DialogDescription>{product.name} ({product.sku}){isOps ? " · requires Finance approval" : ""}</DialogDescription>
        </DialogHeader>
        <div>
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Standard Cost (per {product.unit})</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-slate-400 font-mono">$</span>
            <Input data-testid="cost-input" type="number" step="any" value={cost} onChange={(e) => setCost(e.target.value)} className="h-11 font-mono" />
            <span className="text-slate-500 font-mono text-xs whitespace-nowrap">/ {product.unit}</span>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={busy} data-testid="save-cost-btn">
            {busy ? "Saving…" : isOps ? "Submit Proposal" : "Save Standard Cost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SimpleColl({ coll, fields }) {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({});
  const load = () => api.get(`/master/${coll}`).then((r) => setItems(r.data));
  useEffect(() => { load(); setF({}); }, [coll]);
  const create = async () => {
    if (!f.name) return toast.error("Name is required");
    try { await api.post(`/master/${coll}`, f); toast.success("Entity registered"); setOpen(false); setF({}); load(); }
    catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const del = async (id) => { await api.delete(`/master/${coll}/${id}`); load(); toast.success("Removed"); };
  const sub = (x) => fields.slice(1).map(([k]) => x[k]).filter(Boolean).join(" · ");
  return (
    <div className="space-y-4">
      <Button onClick={() => setOpen(true)} data-testid={`add-${coll}-btn`} className="h-10">
        <Plus className="w-4 h-4 mr-1.5" /> Register {coll.slice(0, -1)}
      </Button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((x) => (
          <div key={x.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 flex items-center justify-between card-hover shadow-xs">
            <div>
              <div className="font-bold text-[#010B1C]">{x.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{sub(x)}</div>
            </div>
            <button onClick={() => del(x.id)} data-testid={`del-${coll}-${x.name}`} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && <div className="text-slate-400 text-sm col-span-3 bg-white p-6 rounded-2xl border border-[#E2E8F0] text-center">No entities registered yet.</div>}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New {coll.slice(0, -1)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {fields.map(([k, l]) => (
              <Field key={k} label={l}><Input data-testid={`${coll}-${k}-input`} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-11" /></Field>
            ))}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} data-testid={`save-${coll}-btn`}>Save Entity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Field = ({ label, children }) => (
  <div><Label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 block">{label}</Label>{children}</div>
);
