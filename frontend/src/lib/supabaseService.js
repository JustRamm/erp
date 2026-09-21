import { supabase } from "./supabase";

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

export async function loginUser(email, password) {
  const cleanEmail = (email || "").toLowerCase().trim();
  const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
  if (error) throw error;
  
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();
    
  if (profileError) {
    console.error("Error fetching user profile from Supabase:", profileError);
  }

  const user = {
    id: data.user.id,
    email: data.user.email,
    name: profile?.name || data.user.user_metadata?.name || cleanEmail.split("@")[0],
    role: profile?.role || data.user.user_metadata?.role || "operations",
    partner_id: profile?.partner_id || null,
    location_id: profile?.location_id || null
  };
  
  return { token: data.session?.access_token, user };
}

export async function getCurrentProfile() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email,
        name: profile?.name || user.user_metadata?.name || user.email.split("@")[0],
        role: profile?.role || user.user_metadata?.role || "operations",
        partner_id: profile?.partner_id,
        location_id: profile?.location_id
      };
    }
  } catch (e) {}

  const stored = localStorage.getItem("user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }

  return null;
}

export async function logoutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  return { ok: true };
}

// ==========================================
// 2. MASTER DATA (Categories, Products, Locations, Partners)
// ==========================================

export async function fetchCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("name");
  if (error) {
    console.error("Error fetching categories from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function createCategory(cat) {
  const { data, error } = await supabase.from("categories").insert([cat]).select().single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchProducts() {
  const { data, error } = await supabase.from("products").select("*, category:categories(*)").order("name");
  if (error) {
    console.error("Error fetching products from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function createProduct(prod) {
  const { data, error } = await supabase.from("products").insert([prod]).select().single();
  if (error) throw error;
  return data;
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

export async function fetchLocations() {
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) {
    console.error("Error fetching locations from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function createLocation(loc) {
  const { data, error } = await supabase.from("locations").insert([loc]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchPartners() {
  const { data, error } = await supabase.from("partners").select("*").order("name");
  if (error) {
    console.error("Error fetching partners from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function createPartner(partner) {
  const { data, error } = await supabase.from("partners").insert([partner]).select().single();
  if (error) throw error;
  return data;
}

// ==========================================
// 3. DOUBLE-ENTRY LEDGER & INVENTORY CALCULATION
// ==========================================

export async function fetchLedgerEntries(limit = 100) {
  const { data, error } = await supabase
    .from("ledger_entries")
    .select("*, product:products(*), from_location:locations!from_location_id(name), to_location:locations!to_location_id(name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching ledger entries from Supabase:", error);
    return [];
  }

  // Valid transaction_type enum: RECEIVE_RAW | STAGE_ADVANCE | MANUFACTURE | TRANSFER | DISCREPANCY_ADJUST | DEPLOYMENT | RETURN_RECYCLE
  const OUTFLOW_TYPES = new Set(["STAGE_ADVANCE", "DEPLOYMENT"]);

  return (data || []).map(e => {
    const locName = e.to_location?.name || e.from_location?.name || "Facility";
    const isOutflow = OUTFLOW_TYPES.has(e.transaction_type) || (e.from_location_id && !e.to_location_id);
    const delta = isOutflow ? -Math.abs(e.quantity || 0) : Math.abs(e.quantity || 0);

    const TXN_LABELS = {
      RECEIVE_RAW: "Received",
      MANUFACTURE: "Manufactured",
      TRANSFER: "Transferred",
      STAGE_ADVANCE: "Consumed",
      DISCREPANCY_ADJUST: "Adjusted",
      DEPLOYMENT: "Deployed",
      RETURN_RECYCLE: "Returned",
    };

    return {
      ...e,
      txn_label: TXN_LABELS[e.transaction_type] || e.transaction_type || "Movement",
      product_name: e.product?.name || "Product",
      product_sku: e.product?.sku || "SKU",
      location_name: locName,
      delta,
      actor_name: e.operator_name || "Operations",
      note: e.notes || "",
      created_at: e.created_at || new Date().toISOString(),
    };
  });
}

export async function postLedgerEntry(entry) {
  const { data, error } = await supabase.from("ledger_entries").insert([entry]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchInventoryBalances() {
  const [products, locations, ledger] = await Promise.all([
    fetchProducts(),
    fetchLocations(),
    fetchLedgerEntries(2000)
  ]);

  if (!products || products.length === 0) return [];

  // Compute double-entry balances: Sum debits (to_location) minus credits (from_location)
  const balances = {};
  for (const p of products) {
    balances[p.id] = { product: p, total_qty: 0, by_location: {} };
    for (const loc of locations) {
      balances[p.id].by_location[loc.id] = 0;
    }
  }

  const OUTFLOW_TYPES = new Set(["STAGE_ADVANCE", "DEPLOYMENT"]);

  for (const entry of ledger) {
    const pid = entry.product_id;
    if (!balances[pid]) continue;
    const qty = Number(entry.quantity) || 0;
    const isOutflowOnly = OUTFLOW_TYPES.has(entry.transaction_type) && !entry.to_location_id;

    // Inflow to destination location (all types with a to_location)
    if (entry.to_location_id && balances[pid].by_location[entry.to_location_id] !== undefined) {
      balances[pid].by_location[entry.to_location_id] += qty;
    }
    // Outflow from origin location (all types with a from_location)
    if (entry.from_location_id && balances[pid].by_location[entry.from_location_id] !== undefined) {
      // Only subtract if it's actually leaving (has no destination, or it's an outflow type)
      if (!entry.to_location_id || entry.transaction_type === "TRANSFER" || entry.transaction_type === "DEPLOYMENT") {
        balances[pid].by_location[entry.from_location_id] -= qty;
      }
    }
  }

  // Calculate totals, locations array, and low-stock flags
  return Object.values(balances).map(b => {
    b.total_qty = Object.values(b.by_location).reduce((acc, v) => acc + v, 0);
    b.total = b.total_qty;
    b.is_low_stock = b.total_qty <= (b.product?.reorder_level || 0);
    b.low_stock = b.is_low_stock;
    b.negative = b.total_qty < 0;
    b.locations = locations.map(loc => ({
      location_id: loc.id,
      location_name: loc.name,
      balance: b.by_location[loc.id] || 0
    }));
    return b;
  });
}

// ==========================================
// 4. PROCUREMENT PIPELINE
// ==========================================

export async function fetchProcurementRequests() {
  const { data, error } = await supabase
    .from("procurement_requests")
    .select("*, items:procurement_items(*, product:products(name, sku)), updates:procurement_updates(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching procurement from Supabase:", error);
    return [];
  }

  return (data || []).map(p => ({
    ...p,
    number: p.po_number || p.pr_number || `PO-${p.id}`,
    po_number: p.po_number || p.pr_number || `PO-${p.id}`,
    requested_by: p.created_by_name || p.requested_by || "Operations",
    total_cost: p.total_amount || 0,
    items: (p.items || []).map(it => ({
      ...it,
      qty: it.requested_qty || 0,
      unit: it.unit || "kg",
      unit_cost: it.unit_cost || 0,
      product_name: it.product?.name || "Material"
    }))
  }));
}

export async function createPurchaseRequest(prData) {
  const prNumber = `PR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data: pr, error: prErr } = await supabase
    .from("procurement_requests")
    .insert([{
      pr_number: prNumber,
      supplier_id: prData.supplier_id,
      supplier_name: prData.supplier_name,
      note: prData.note,
      status: "requested"
    }])
    .select()
    .single();

  if (prErr) throw prErr;

  if (prData.items && prData.items.length > 0) {
    const itemsToInsert = prData.items.map(item => ({
      request_id: pr.id,
      product_id: item.product_id,
      requested_qty: item.qty,
      unit: item.unit || "kg"
    }));
    await supabase.from("procurement_items").insert(itemsToInsert);
  }
  return pr;
}

export async function approveProcurementRequest(id, items, note) {
  const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const totalAmount = (items || []).reduce((sum, it) => sum + (it.qty * it.unit_cost), 0);
  
  const { error: prErr } = await supabase.from("procurement_requests").update({
    po_number: poNumber,
    status: "po_created",
    total_amount: totalAmount
  }).eq("id", id);
  if (prErr) throw prErr;

  for (const it of (items || [])) {
    await supabase.from("procurement_items")
      .update({ unit_cost: it.unit_cost })
      .eq("request_id", id)
      .eq("product_id", it.product_id);
  }

  await supabase.from("procurement_updates").insert([{
    request_id: id,
    stage: "po_created",
    note: note || "Finance approved and Purchase Order issued"
  }]);
  
  return { ok: true };
}

export async function updateProcurementStage(id, stage, note) {
  const { error } = await supabase.from("procurement_requests").update({ status: stage }).eq("id", id);
  if (error) throw error;
  await supabase.from("procurement_updates").insert([{ request_id: id, stage, note }]);
  return { ok: true };
}

export async function deliverProcurementOrder(id, locationId, receivedItems, note) {
  const { data: pr } = await supabase.from("procurement_requests").select("*").eq("id", id).single();
  
  await supabase.from("procurement_requests").update({ status: "delivered" }).eq("id", id);
  await supabase.from("procurement_updates").insert([{
    request_id: id,
    stage: "delivered",
    note: note || "Order received and stock updated"
  }]);

  // Insert RECEIVE_RAW ledger entries for each delivered item
  for (const item of (receivedItems || [])) {
    await postLedgerEntry({
      transaction_type: "RECEIVE_RAW",
      product_id: item.product_id,
      from_location_id: "00000000-0000-0000-0000-000000000000",
      to_location_id: locationId,
      quantity: Number(item.received_qty),
      unit_cost: Number(item.unit_cost) || 0,
      notes: `PO Delivery: ${pr?.po_number || pr?.pr_number || id}`,
      operator_name: "Operations"
    });
    // Update received_qty on the item
    await supabase.from("procurement_items")
      .update({ received_qty: Number(item.received_qty) })
      .eq("request_id", id)
      .eq("product_id", item.product_id);
  }
  return { ok: true };
}

// ==========================================
// 5. PARTNER PORTAL & APPROVALS
// ==========================================

export async function fetchPartnerDashboard(partnerId, locationId) {
  const balances = await fetchInventoryBalances();
  const targetLocation = locationId || "44444444-4444-4444-4444-444444444444";
  
  const partnerStock = (balances || []).map(b => ({
    product_id: b.product.id,
    sku: b.product.sku,
    name: b.product.name,
    unit: b.product.unit,
    group: b.product.category?.group,
    balance: b.by_location[targetLocation] || 0
  }));

  let query = supabase.from("partner_requests").select("*").order("created_at", { ascending: false });
  if (partnerId) {
    query = query.eq("partner_id", partnerId);
  }
  const { data: requests, error } = await query;
  if (error) {
    console.error("Error fetching partner requests:", error);
    return { stock: partnerStock, requests: [] };
  }

  return { stock: partnerStock, requests: requests || [] };
}

export async function submitPartnerRequest(req) {
  const { data, error } = await supabase.from("partner_requests").insert([req]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchApprovals() {
  const [prsRes, partnerRes, discRes] = await Promise.all([
    supabase.from("procurement_requests").select("*").eq("status", "requested"),
    supabase.from("partner_requests").select("*").eq("status", "pending"),
    supabase.from("discrepancies").select("*").eq("status", "pending")
  ]);

  const pendingPRs = (prsRes.data || []).map(p => ({
    id: p.id,
    type: "procurement",
    title: `Purchase Request ${p.pr_number}`,
    amount: p.total_amount,
    requested_by: p.created_by_name || "Operations",
    created_at: p.created_at,
    raw: p
  }));

  const pendingPartner = (partnerRes.data || []).map(r => ({
    id: r.id,
    type: r.type === "fabrication" ? "partner_fabrication" : "partner_material",
    title: r.type === "fabrication" ? "Partner Fabrication Run" : "Partner Material Requisition",
    requested_by: r.requested_by_name || "Partner",
    created_at: r.created_at,
    raw: r
  }));

  const pendingDiscrepancies = (discRes.data || []).map(d => ({
    id: d.id,
    type: "discrepancy",
    title: `Physical Variance: ${d.variance > 0 ? "+" : ""}${d.variance} (${d.reason || "Variance"})`,
    requested_by: d.reported_by_name || "Operations",
    created_at: d.created_at,
    raw: d
  }));

  return [...pendingPRs, ...pendingPartner, ...pendingDiscrepancies];
}

export async function resolveApproval(type, id, action, note) {
  if (type === "partner_fabrication" || type === "partner_material") {
    const { error } = await supabase.from("partner_requests").update({ status: action }).eq("id", id);
    if (error) throw error;
  } else if (type === "discrepancy") {
    const { error } = await supabase.from("discrepancies").update({ status: action, resolution_notes: note }).eq("id", id);
    if (error) throw error;
  } else if (type === "procurement") {
    const status = action === "approved" ? "po_created" : "rejected";
    const { error } = await supabase.from("procurement_requests").update({ status }).eq("id", id);
    if (error) throw error;
  }
  return { ok: true };
}

// ==========================================
// 6. DISCREPANCIES & ASSETS & SETTINGS
// ==========================================

export async function fetchDiscrepancies() {
  const { data, error } = await supabase
    .from("discrepancies")
    .select("*, product:products(*), location:locations(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching discrepancies from Supabase:", error);
    return [];
  }

  return (data || []).map(d => ({
    ...d,
    product: d.product,
    product_name: d.product?.name || "Product",
    product_sku: d.product?.sku || "SKU",
    location: d.location,
    location_name: d.location?.name || "Location",
    balance: d.system_quantity || 0,
    physical_balance: d.physical_quantity || 0,
    delta: d.variance || 0,
    reported_by: d.reported_by_name || "Operations",
    created_at: d.created_at || new Date().toISOString()
  }));
}

export async function reportDiscrepancy(disc) {
  // variance is a generated column (physical_quantity - system_quantity) — never insert it
  const { variance, ...safeDisc } = disc;
  const { data, error } = await supabase.from("discrepancies").insert([safeDisc]).select().single();
  if (error) throw error;
  return data;
}

export async function fetchDeployedAssets() {
  const { data, error } = await supabase
    .from("deployed_assets")
    .select("*, product:products(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching deployed assets from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function fetchSettings() {
  const { data, error } = await supabase.from("settings").select("*").eq("id", "global").maybeSingle();
  if (error || !data) {
    return {
      app_name: "Carbon & Whale · IMS",
      low_stock_alert: true,
      notify_email: "alerts@carbonandwhale.com",
      notify_low_stock: true,
      notify_discrepancy: true,
      permissions: {
        admin: ["*"],
        operations: ["dashboard", "inventory", "ledger", "procurement", "master_data", "discrepancies", "approvals"],
        production: ["dashboard", "inventory", "ledger", "procurement"],
        finance: ["dashboard", "inventory", "ledger", "procurement", "approvals"],
        partner: ["partner_portal"],
        client: ["client_view"]
      }
    };
  }
  return data;
}

export async function updateSettings(updates) {
  const { data, error } = await supabase.from("settings").update(updates).eq("id", "global").select().single();
  if (error) throw error;
  return data;
}

export async function fetchUsers() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error("Error fetching profiles from Supabase:", error);
    return [];
  }
  return data || [];
}

export async function createUser(user) {
  const newUser = {
    id: crypto.randomUUID ? crypto.randomUUID() : `usr-${Date.now()}`,
    email: user.email,
    name: user.name,
    role: user.role || "operations",
    active: true,
  };
  const { data, error } = await supabase.from("profiles").insert([newUser]).select().single();
  if (error) {
    console.warn("Could not insert profile directly into DB:", error.message);
    return newUser;
  }
  return data;
}

export async function updateUser(id, updates) {
  const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
  if (error) {
    console.warn("Profile update in Supabase warning:", error.message);
    return { id, ...updates };
  }
  return data;
}

export async function deleteUser(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) console.warn("Profile delete warning:", error.message);
  return { ok: true };
}
