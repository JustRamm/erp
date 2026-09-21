import React, { useEffect, useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";
import { ROLE_BADGE, ROLES } from "../lib/constants";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { StaggerContainer, StaggerItem } from "../components/PageTransition";
import { motion } from "framer-motion";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "../components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Users as UsersIcon, Plus, Trash2 } from "lucide-react";
import { TableSkeleton } from "../components/PageSkeleton";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", password: "", role: "operations" });

  const load = () => {
    return api.get("/users")
      .then((r) => setUsers(r.data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await api.post("/users", f);
      toast.success("User account provisioned"); setOpen(false);
      setF({ name: "", email: "", password: "", role: "operations" }); load();
    } catch (e) { toast.error(formatApiErrorDetail(e.response?.data?.detail)); }
  };
  const toggle = async (u) => { await api.patch(`/users/${u.id}`, { active: !u.active }); load(); };
  const del = async (u) => { await api.delete(`/users/${u.id}`); load(); toast.success("User account removed"); };

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4 pb-2 border-b border-[#E2E8F0]/70">
        <div>
          <h1 className="font-head text-2xl sm:text-3xl font-bold tracking-tight text-[#010B1C]">User &amp; Role Management</h1>
          <p className="text-sm text-slate-500 mt-1 font-body">Admin-provisioned role-based access control with granular operational gates.</p>
        </div>
        <Button onClick={() => setOpen(true)} data-testid="add-user-btn" className="h-10">
          <Plus className="w-4 h-4 mr-1.5" /> Provision User
        </Button>
      </div>

      <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-xs overflow-hidden">
        <StaggerContainer className="divide-y divide-[#F1F5F9]">
          {users.map((u) => (
            <StaggerItem key={u.id}>
              <div data-testid={`user-row-${u.email}`} className="flex items-center gap-3.5 px-5 py-4 hover:bg-[#F8FAFC] transition-colors duration-150">
                <div className="w-10 h-10 rounded-full bg-[#EBF5FA] border border-[#98CAE4]/50 flex items-center justify-center text-sm font-bold text-[#0091FF] shrink-0">
                  {u.name?.[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#010B1C] truncate text-sm">{u.name}</div>
                  <div className="text-xs text-slate-500 font-mono truncate">{u.email}</div>
                </div>
                <Badge className={`text-[10px] uppercase font-mono px-2.5 py-0.5 border ${ROLE_BADGE[u.role]}`}>{u.role}</Badge>
                <div className="flex items-center gap-3 ml-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">{u.active ? "Active" : "Inactive"}</span>
                    <Switch data-testid={`toggle-user-${u.email}`} checked={u.active} onCheckedChange={() => toggle(u)} />
                  </div>
                  {u.role !== "admin" && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => del(u)}
                      data-testid={`del-user-${u.email}`}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Provision Enterprise User</DialogTitle>
            <DialogDescription>Assign system credentials and access role for plant or boardroom access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Full Name</Label>
              <Input data-testid="user-name-input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="mt-1.5 h-11" placeholder="e.g. Elena Rostova" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Work Email</Label>
              <Input data-testid="user-email-input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="mt-1.5 h-11" placeholder="user@company.com" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Temporary Password</Label>
              <Input data-testid="user-password-input" type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="mt-1.5 h-11" placeholder="••••••••" />
            </div>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">Role Designation</Label>
              <Select value={f.role} onValueChange={(r) => setF({ ...f, role: r })}>
                <SelectTrigger data-testid="user-role-select" className="mt-1.5 h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button data-testid="save-user-btn" onClick={create}>Provision User Account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
