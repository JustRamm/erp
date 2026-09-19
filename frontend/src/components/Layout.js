import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { NAV, ROLE_BADGE } from "../lib/constants";
import { Recycle, LogOut, Bell, Menu, X, ChevronDown } from "lucide-react";
import { Badge } from "./ui/badge";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./PageTransition";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "./ui/dropdown-menu";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState([]);

  const nav = NAV.filter((n) => user?.role && n.roles.includes(user.role));

  const loadNotes = () => api.get("/notifications").then((r) => setNotes(r.data)).catch(() => {});
  useEffect(() => { loadNotes(); }, []);

  const unread = notes.filter((n) => !n.read).length;
  const doLogout = async () => { await logout(); navigate("/login"); };
  const markRead = async () => { await api.post("/notifications/read-all"); loadNotes(); };

  const SideLinks = ({ onClick }) => (
    <nav className="space-y-1">
      {nav.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.to === "/"} onClick={onClick} data-testid={`nav-${n.label.toLowerCase().replace(" ", "-")}`}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3.5 min-h-[44px] rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
              isActive
                ? "bg-[#EBF5FA] text-[#0091FF] border-l-2 border-[#0091FF] font-semibold shadow-xs"
                : "text-slate-600 hover:bg-[#F8FAFC] hover:text-[#010B1C] border-l-2 border-transparent"
            }`}>
          <n.icon className="w-4 h-4 shrink-0" />
          <span>{n.label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#E2E8F0] bg-white p-5 sticky top-0 h-screen shadow-xs">
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#3195C9] to-[#0091FF] flex items-center justify-center shadow-xs">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-head text-lg font-bold tracking-tight text-[#010B1C] block leading-tight">ECO-PRECISION</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#0091FF] font-semibold">IMS / MES Platform</span>
          </div>
        </div>
        <SideLinks />
        <div className="mt-auto pt-4 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]/80">
            <div className="w-8 h-8 rounded-full bg-[#EBF5FA] border border-[#98CAE4]/50 flex items-center justify-center text-xs font-bold text-[#0091FF] shrink-0">
              {user?.name?.[0] || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold truncate text-[#010B1C]">{user?.name || "User"}</div>
              <Badge className={`text-[9px] uppercase border px-1.5 py-0 ${ROLE_BADGE[user?.role] || ""}`}>{user?.role}</Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <aside className="relative w-64 bg-white border-r border-[#E2E8F0] p-5 shadow-xl flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3195C9] to-[#0091FF] flex items-center justify-center">
                  <Recycle className="w-4 h-4 text-white" />
                </div>
                <span className="font-head text-base font-bold text-[#010B1C]">ECO-PRECISION</span>
              </div>
              <button onClick={() => setOpen(false)} data-testid="close-menu-btn" className="p-1 rounded-md text-slate-500 hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SideLinks onClick={() => setOpen(false)} />
            </div>
            <div className="pt-4 border-t border-[#E2E8F0] mt-auto">
              <button
                onClick={() => { setOpen(false); doLogout(); }}
                data-testid="mobile-logout-btn"
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-semibold text-rose-600 bg-rose-50/80 hover:bg-rose-100 rounded-lg border border-rose-200 active:scale-[0.98] transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 sm:px-8 h-16 border-b border-[#E2E8F0]/80 bg-white/85 backdrop-blur-md">
          <button className="md:hidden p-2 rounded-lg border border-[#E2E8F0] text-slate-600 active:scale-95 transition-transform" onClick={() => setOpen(true)} data-testid="open-menu-btn"><Menu className="w-5 h-5" /></button>
          <div className="md:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3195C9] to-[#0091FF] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" />
            </div>
            <span className="font-head text-sm font-bold text-[#010B1C]">ECO-PRECISION</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <DropdownMenu onOpenChange={(o) => o && loadNotes()}>
              <DropdownMenuTrigger asChild>
                <button data-testid="notifications-btn" className="relative w-10 h-10 rounded-lg border border-[#E2E8F0] bg-white flex items-center justify-center hover:bg-[#F8FAFC] active:scale-95 transition-all shadow-xs">
                  <Bell className="w-4 h-4 text-slate-600" />
                  {unread > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0091FF] text-white text-[10px] font-bold flex items-center justify-center shadow-xs">{unread}</span>}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-white border-[#E2E8F0] shadow-lg rounded-xl">
                <DropdownMenuLabel className="flex items-center justify-between text-[#010B1C]">
                  Notifications
                  {unread > 0 && <button onClick={markRead} className="text-xs text-[#0091FF] font-semibold hover:underline" data-testid="mark-read-btn">Mark all read</button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E2E8F0]" />
                {notes.length === 0 && <div className="px-3 py-6 text-sm text-slate-400 text-center">No notifications</div>}
                {notes.slice(0, 12).map((n) => (
                  <div key={n.id} className={`px-3.5 py-2.5 text-xs border-b border-[#F1F5F9] last:border-0 ${n.read ? "text-slate-400" : "text-[#010B1C] font-medium bg-[#F8FAFC]"}`}>
                    {n.message}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" className="flex items-center gap-2.5 h-10 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] active:scale-95 transition-all shadow-xs cursor-pointer">
                  <div className="w-6 h-6 rounded-full bg-[#EBF5FA] border border-[#98CAE4]/50 flex items-center justify-center text-xs font-bold text-[#0091FF]">{user.name?.[0]}</div>
                  <span className="hidden sm:block text-sm font-medium text-[#010B1C]">{user.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-[#E2E8F0] shadow-lg rounded-xl min-w-[200px] p-1.5">
                <DropdownMenuLabel className="text-xs text-slate-500 font-normal px-2.5 py-2">
                  <div className="font-semibold text-[#010B1C] text-sm">{user.name}</div>
                  <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">{user.email}</div>
                  <Badge className={`mt-1.5 text-[9px] uppercase border px-1.5 py-0 ${ROLE_BADGE[user?.role] || ""}`}>{user?.role}</Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E2E8F0] my-1" />
                <DropdownMenuItem onClick={doLogout} data-testid="logout-btn" className="text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer font-medium rounded-lg px-2.5 py-2 text-xs">
                  <LogOut className="w-4 h-4 mr-2 text-rose-500" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1500px] w-full">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
