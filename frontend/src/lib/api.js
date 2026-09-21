import * as SupabaseService from "./supabaseService";
export * from "./supabaseService";

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

// Unified API client that routes to Supabase service functions
export const api = {
  async get(url, config = {}) {
    const cleanUrl = url.split("?")[0].replace(/^\/api/, "").replace(/^\//, "");
    
    // Auth
    if (cleanUrl === "auth/me") {
      const user = await SupabaseService.getCurrentProfile();
      if (!user) {
        const stored = localStorage.getItem("user");
        if (stored) return { data: JSON.parse(stored) };
        throw new Error("Unauthorized");
      }
      return { data: user };
    }

    // Master Data
    if (cleanUrl === "categories") {
      const data = await SupabaseService.fetchCategories();
      return { data };
    }
    if (cleanUrl === "products") {
      const data = await SupabaseService.fetchProducts();
      return { data };
    }
    if (cleanUrl === "locations") {
      const data = await SupabaseService.fetchLocations();
      return { data };
    }
    if (cleanUrl === "partners") {
      const data = await SupabaseService.fetchPartners();
      return { data };
    }
    if (cleanUrl === "settings") {
      const data = await SupabaseService.fetchSettings();
      return { data };
    }
    if (cleanUrl === "users") {
      const data = await SupabaseService.fetchUsers();
      return { data };
    }

    // Inventory & Ledger
    if (cleanUrl === "items" || cleanUrl === "inventory") {
      const data = await SupabaseService.fetchInventoryBalances();
      return { data };
    }
    if (cleanUrl === "ledger" || cleanUrl === "transactions") {
      const data = await SupabaseService.fetchLedgerEntries(config?.params?.limit || 100);
      return { data };
    }

    // Procurement
    if (cleanUrl === "procurement/requests" || cleanUrl === "procurement") {
      const data = await SupabaseService.fetchProcurementRequests();
      return { data };
    }

    // Partner Portal
    if (cleanUrl === "partner/dashboard") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const data = await SupabaseService.fetchPartnerDashboard(user?.partner_id, user?.location_id);
      return { data };
    }

    // Approvals & Discrepancies
    if (cleanUrl === "approvals") {
      const data = await SupabaseService.fetchApprovals();
      return { data };
    }
    if (cleanUrl === "discrepancies") {
      const data = await SupabaseService.fetchDiscrepancies();
      return { data };
    }

    // Deployed Assets
    if (cleanUrl === "assets" || cleanUrl === "deployed-assets") {
      const data = await SupabaseService.fetchDeployedAssets();
      return { data };
    }

    // Dashboard Overview
    if (cleanUrl === "dashboard/summary" || cleanUrl === "dashboard") {
      const results = await Promise.allSettled([
        SupabaseService.fetchInventoryBalances(),
        SupabaseService.fetchLedgerEntries(10),
        SupabaseService.fetchProcurementRequests(),
        SupabaseService.fetchDiscrepancies()
      ]);

      const balances = (results[0].status === 'fulfilled' ? results[0].value : null) || [];
      const ledger   = (results[1].status === 'fulfilled' ? results[1].value : null) || [];
      const prs      = (results[2].status === 'fulfilled' ? results[2].value : null) || [];
      const discrepancies = (results[3].status === 'fulfilled' ? results[3].value : null) || [];

      const catMap = {};
      for (const b of balances) {
        const cat = b.product?.category || {};
        const catName = cat.name || b.product?.category_name || "Uncategorized";
        if (!catMap[catName]) {
          catMap[catName] = {
            category: catName,
            total: 0,
            unit: b.product?.unit || "kg",
            products: 0,
            tracking_mode: b.product?.tracking_mode || "bulk"
          };
        }
        catMap[catName].total += (b.total_qty || 0);
        catMap[catName].products += 1;
      }
      const cards = Object.values(catMap);

      const totalWeight = balances.reduce((sum, b) => sum + (b.total_qty || 0), 0);
      const totalValue = balances.reduce((sum, b) => sum + ((b.total_qty || 0) * (b.product?.unit_cost || 0)), 0);
      const lowStockCount = balances.filter(b => b.is_low_stock).length;
      const lowStockItems = balances.filter(b => b.is_low_stock).map(b => ({
        name: b.product?.name || "Item",
        total: b.total_qty || 0,
        threshold: b.product?.reorder_level || 100,
        unit: b.product?.unit || "kg"
      }));

      const openDiscs = discrepancies.filter(d => d.status === "open" || d.status === "pending").length;
      const pendingDiscApprovals = discrepancies.filter(d => d.status === "pending_approval" || d.pending_correction).length;
      const pendingPRs = prs.filter(p => p.status === "requested").length;
      const liveOrders = prs.filter(p => p.status !== "delivered" && p.status !== "rejected" && p.status !== "requested").length;

      return {
        data: {
          cards,
          recent: ledger.map(l => ({
            id: l.id,
            product_name: l.product_name,
            location_name: l.location_name,
            delta: l.delta,
            unit: l.unit || "kg",
            txn_label: l.txn_label,
            txn_type: l.transaction_type,
            created_at: l.created_at
          })),
          needs_attention: {
            open_discrepancies: openDiscs,
            pending_disc_approvals: pendingDiscApprovals,
            pending_purchase_requests: pendingPRs,
            pending_change_requests: 0,
            live_orders: liveOrders,
            low_stock: lowStockItems,
            negatives: []
          },
          total_inventory_weight: totalWeight,
          total_inventory_value: totalValue,
          total_sku_count: balances.length,
          low_stock_count: lowStockCount,
          active_orders_count: liveOrders + pendingPRs,
          recent_transactions: ledger,
          inventory_summary: balances
        }
      };
    }

    return { data: [] };
  },

  async post(url, payload = {}) {
    const cleanUrl = url.split("?")[0].replace(/^\/api/, "").replace(/^\//, "");

    // Auth
    if (cleanUrl === "auth/login") {
      const { email, password } = payload;
      const data = await SupabaseService.loginUser(email, password);
      return { data };
    }
    if (cleanUrl === "auth/logout") {
      const data = await SupabaseService.logoutUser();
      return { data };
    }

    // Master Data Creation
    if (cleanUrl === "categories") {
      const data = await SupabaseService.createCategory(payload);
      return { data };
    }
    if (cleanUrl === "products") {
      const data = await SupabaseService.createProduct(payload);
      return { data };
    }
    if (cleanUrl === "locations") {
      const data = await SupabaseService.createLocation(payload);
      return { data };
    }
    if (cleanUrl === "partners") {
      const data = await SupabaseService.createPartner(payload);
      return { data };
    }
    if (cleanUrl === "settings") {
      const data = await SupabaseService.updateSettings(payload);
      return { data };
    }

    // Ledger Movement
    if (cleanUrl === "ledger" || cleanUrl === "actions/execute") {
      const data = await SupabaseService.postLedgerEntry(payload);
      return { data };
    }

    // Procurement Operations
    if (cleanUrl === "procurement/requests") {
      const data = await SupabaseService.createPurchaseRequest(payload);
      return { data };
    }
    if (cleanUrl.match(/^procurement\/requests\/([^/]+)\/approve$/)) {
      const id = cleanUrl.match(/^procurement\/requests\/([^/]+)\/approve$/)[1];
      const data = await SupabaseService.approveProcurementRequest(id, payload.items, payload.note);
      return { data };
    }
    if (cleanUrl.match(/^procurement\/requests\/([^/]+)\/update$/)) {
      const id = cleanUrl.match(/^procurement\/requests\/([^/]+)\/update$/)[1];
      const data = await SupabaseService.updateProcurementStage(id, payload.stage, payload.note);
      return { data };
    }
    if (cleanUrl.match(/^procurement\/requests\/([^/]+)\/deliver$/)) {
      const id = cleanUrl.match(/^procurement\/requests\/([^/]+)\/deliver$/)[1];
      const data = await SupabaseService.deliverProcurementOrder(id, payload.location_id, payload.items, payload.note);
      return { data };
    }

    // Partner Portal
    if (cleanUrl === "partner/fabrication" || cleanUrl === "partner/material-request") {
      const data = await SupabaseService.submitPartnerRequest({
        ...payload,
        type: cleanUrl.includes("fabrication") ? "fabrication" : "material_request"
      });
      return { data };
    }

    // Approvals
    if (cleanUrl.match(/^approvals\/([^/]+)\/(approve|reject)$/)) {
      const [, id, action] = cleanUrl.match(/^approvals\/([^/]+)\/(approve|reject)$/);
      const data = await SupabaseService.resolveApproval(payload.type, id, action, payload.note);
      return { data };
    }

    // Discrepancies
    if (cleanUrl === "discrepancies") {
      const data = await SupabaseService.reportDiscrepancy(payload);
      return { data };
    }

    return { data: { ok: true } };
  },

  async put(url, payload = {}) {
    return this.post(url, payload);
  },

  async delete(url) {
    return { data: { ok: true } };
  }
};
