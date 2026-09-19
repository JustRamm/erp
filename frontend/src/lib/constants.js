import {
  LayoutDashboard, Boxes, ScrollText, Database, Users, AlertTriangle,
  Factory, ArrowLeftRight, PackageMinus, MapPin, Presentation, ShoppingCart, Settings as SettingsIcon, ClipboardCheck, Handshake,
} from "lucide-react";

export const ROLE_BADGE = {
  admin: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
  operations: "bg-amber-50 text-amber-800 border-amber-200/80",
  production: "bg-sky-50 text-sky-700 border-sky-200/80",
  finance: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
  partner: "bg-blue-50 text-blue-700 border-blue-200/80",
  client: "bg-violet-50 text-violet-700 border-violet-200/80",
};

export const ROLES = ["admin", "operations", "production", "finance", "partner", "client"];

export const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "operations", "production", "finance"] },
  { to: "/partner", label: "Partner", icon: Handshake, roles: ["admin", "operations", "partner"] },
  { to: "/inventory", label: "Inventory", icon: Boxes, roles: ["admin", "operations", "production", "finance"] },
  { to: "/procurement", label: "Procurement", icon: ShoppingCart, roles: ["admin", "operations", "finance"] },
  { to: "/ledger", label: "Ledger", icon: ScrollText, roles: ["admin", "operations", "finance"] },
  { to: "/discrepancies", label: "Discrepancies", icon: AlertTriangle, roles: ["admin", "operations", "finance"] },
  { to: "/approvals", label: "Approvals", icon: ClipboardCheck, roles: ["admin", "finance"] },
  { to: "/master-data", label: "Master Data", icon: Database, roles: ["admin", "operations"] },
  { to: "/users", label: "Users", icon: Users, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: SettingsIcon, roles: ["admin"] },
  { to: "/boardroom", label: "Boardroom", icon: Presentation, roles: ["admin", "client", "operations"] },
];

// Stock changes only via: Manufacture, Procurement (receiving), Discrepancy correction.
// Transfer moves stock (net zero); Consume/Deploy reduce stock.
export const QUICK_ACTIONS = [
  { key: "manufacture", label: "Manufacture", icon: Factory, color: "text-[#0091FF]", roles: ["admin", "operations", "production"] },
  { key: "purchase", label: "Purchase Request", icon: ShoppingCart, color: "text-emerald-600", roles: ["admin", "operations"] },
  { key: "transfer", label: "Transfer", icon: ArrowLeftRight, color: "text-amber-600", roles: ["admin", "operations", "production"] },
  { key: "consume", label: "Consume", icon: PackageMinus, color: "text-slate-600", roles: ["admin", "operations", "production"] },
  { key: "deploy", label: "Deploy", icon: MapPin, color: "text-indigo-600", roles: ["admin", "operations"] },
];

export const TXN_COLORS = {
  manufactured: "text-[#0091FF]", purchased: "text-emerald-600", received: "text-emerald-600",
  returned: "text-emerald-600", partner_received: "text-emerald-600", transfer_in: "text-emerald-600",
  transfer_out: "text-amber-600", consumed: "text-slate-600", damaged: "text-rose-600",
  sold: "text-amber-600", deployed: "text-indigo-600", partner_sent: "text-amber-600", adjusted: "text-rose-600",
};

export const PO_STAGES = [
  { key: "po_created", label: "PO Created" },
  { key: "sent", label: "Sent to Supplier" },
  { key: "supplier_confirmed", label: "Supplier Confirmed" },
  { key: "in_production", label: "In Production" },
  { key: "shipped", label: "Shipped" },
  { key: "in_transit", label: "In Transit" },
  { key: "partially_delivered", label: "Partially Delivered" },
];

export const PO_STATUS_COLORS = {
  requested: "bg-amber-50 text-amber-800 border-amber-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
  po_created: "bg-sky-50 text-sky-700 border-sky-200",
  sent: "bg-sky-50 text-sky-700 border-sky-200",
  supplier_confirmed: "bg-sky-50 text-sky-700 border-sky-200",
  in_production: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  in_transit: "bg-indigo-50 text-indigo-700 border-indigo-200",
  partially_delivered: "bg-amber-50 text-amber-800 border-amber-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export const PERMISSION_ACTIONS = [
  { key: "raise_pr", label: "Raise Purchase Request" },
  { key: "approve_pr", label: "Approve PR / Add Cost" },
  { key: "manufacture", label: "Log Production Run" },
  { key: "transfer", label: "Transfer Stock" },
  { key: "consume", label: "Consume / Deploy" },
  { key: "propose_correction", label: "Propose Discrepancy Fix" },
  { key: "approve_correction", label: "Approve Discrepancy Fix" },
  { key: "manage_users", label: "Manage Users" },
  { key: "manage_master_data", label: "Manage Master Data" },
  { key: "manage_settings", label: "Manage Settings" },
];
