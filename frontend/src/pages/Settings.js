import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ROLES, PERMISSION_ACTIONS, ROLE_BADGE } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Checkbox } from "../components/ui/checkbox";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import { Settings as Cog, Building2, Bell, Shield, Database } from "lucide-react";
import { SettingsSkeleton } from "../components/PageSkeleton";

export default function Settings() {
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.get("/settings").then((r) => setS(r.data)); }, []);
  if (!s) return <SettingsSkeleton />;

  const set = (k, v) => setS({ ...s, [k]: v });
  const togglePerm = (role, action) => {
    const perms = { ...(s.permissions || {}) };
    const list = new Set(perms[role] || []);
    list.has(action) ? list.delete(action) : list.add(action);
    perms[role] = [...list];
    setS({ ...s, permissions: perms });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/settings", {
        company_name: s.company_name, low_stock_default: s.low_stock_default ? +s.low_stock_default : null,
        notify_low_stock: s.notify_low_stock, notify_discrepancy: s.notify_discrepancy, permissions: s.permissions,
      });
      toast.success("Settings saved successfully");
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
    finally { setSaving(false); }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">System &amp; Policy Settings</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Global manufacturing thresholds, notification rules, and role permission policies.</p>
        </div>
        <Button onClick={save} disabled={saving} data-testid="save-settings-btn" className="h-10">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      <StaggerContainer className="space-y-6">
        <StaggerItem>
          <Section icon={Building2} title="Enterprise Profile">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Company / Facility Name</Label>
                <Input data-testid="settings-company-input" value={s.company_name || ""} onChange={(e) => set("company_name", e.target.value)} className="mt-1.5 h-11" />
              </div>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section icon={Bell} title="Stock Telemetry &amp; Alerts">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Default Low-Stock Level</Label>
                <Input data-testid="settings-lowstock-input" type="number" value={s.low_stock_default ?? ""} onChange={(e) => set("low_stock_default", e.target.value)} className="mt-1.5 h-11 font-mono" placeholder="e.g. 100 (blank = none)" />
                <p className="text-[11px] text-slate-500 mt-1">Fallback threshold when not specified on individual item categories.</p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <ToggleRow label="Dispatch notifications on low stock threshold breach" checked={s.notify_low_stock} onChange={(v) => set("notify_low_stock", v)} testid="settings-notify-lowstock" />
              <ToggleRow label="Dispatch notifications on negative inventory discrepancy logs" checked={s.notify_discrepancy} onChange={(v) => set("notify_discrepancy", v)} testid="settings-notify-disc" />
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section icon={Shield} title="Role Permissions Matrix">
            <p className="text-xs text-slate-500 mb-4 font-body">Configure capability matrix per enterprise role. Security boundaries are strictly enforced on ledger transactions.</p>
            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full text-sm">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                  <tr className="text-left">
                    <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500 font-body">Operational Action</th>
                    {ROLES.map((r) => <th key={r} className="p-3 text-center"><Badge className={`text-[10px] uppercase font-mono px-2 py-0.5 border ${ROLE_BADGE[r]}`}>{r}</Badge></th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {PERMISSION_ACTIONS.map((a) => (
                    <tr key={a.key} className="hover:bg-[#F8FAFC]/60 transition-colors">
                      <td className="p-3 font-medium text-[#010B1C]">{a.label}</td>
                      {ROLES.map((r) => (
                        <td key={r} className="p-3 text-center">
                          <Checkbox
                            data-testid={`perm-${r}-${a.key}`}
                            checked={(s.permissions?.[r] || []).includes(a.key)}
                            onCheckedChange={() => togglePerm(r, a.key)}
                            disabled={r === "admin"}
                            className="data-[state=checked]:bg-[#0091FF] data-[state=checked]:border-[#0091FF]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>
        </StaggerItem>

        <StaggerItem>
          <Section icon={Database} title="Taxonomy Shortcuts">
            <div className="flex flex-wrap gap-2.5">
              {["Categories", "Products", "Locations", "Suppliers", "Partners", "Customers"].map((m) => (
                <Button key={m} variant="outline" onClick={() => navigate("/master-data")} data-testid={`md-shortcut-${m.toLowerCase()}`} className="h-9 text-xs font-medium">
                  {m}
                </Button>
              ))}
            </div>
          </Section>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}

const Section = ({ icon: Icon, title, children }) => (
  <motion.div
    whileHover={{ y: -1 }}
    transition={{ duration: 0.15 }}
    className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_-2px_rgba(0,145,255,0.06),0_2px_6px_-1px_rgba(1,11,28,0.03)] card-lift"
  >
    <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-[#E2E8F0]">
      <div className="w-8 h-8 rounded-xl bg-[#EBF5FA] flex items-center justify-center text-[#0091FF]">
        <Icon className="w-4 h-4" />
      </div>
      <h2 className="font-head text-base font-bold text-[#010B1C]">{title}</h2>
    </div>
    {children}
  </motion.div>
);

const ToggleRow = ({ label, checked, onChange, testid }) => (
  <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 hover:bg-white transition-colors duration-150">
    <span className="text-sm font-medium text-[#010B1C]">{label}</span>
    <Switch data-testid={testid} checked={!!checked} onCheckedChange={onChange} />
  </div>
);
