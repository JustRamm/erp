import { supabase, isSupabaseConfigured } from "./supabase";

// In-memory mock store used seamlessly as fallback when Supabase keys are not yet configured
let mockData = {
  users: [
    { id: "u1", email: "ops@recyclops.com", name: "Operations Manager", role: "operations", active: true },
    { id: "u2", email: "admin@recyclops.com", name: "System Admin", role: "admin", active: true },
    { id: "u3", email: "prod@recyclops.com", name: "Production Supervisor", role: "production", active: true },
    { id: "u4", email: "finance@recyclops.com", name: "Finance Lead", role: "finance", active: true },
    { id: "u5", email: "partner@recyclops.com", name: "Rajesh (GreenCycle)", role: "partner", active: true, partner_id: "44444444-4444-4444-4444-444444444444", location_id: "44444444-4444-4444-4444-444444444444" },
    { id: "u6", email: "partner@greencycle.in", name: "Rajesh (GreenCycle)", role: "partner", active: true, partner_id: "44444444-4444-4444-4444-444444444444", location_id: "44444444-4444-4444-4444-444444444444" },
    { id: "u7", email: "client@recyclops.com", name: "Smart City Kochi", role: "client", active: true },
    { id: "u8", email: "client@smartcity.gov", name: "Smart City Kochi", role: "client", active: true }
  ],
  locations: [
    { id: "11111111-1111-1111-1111-111111111111", name: "Central Processing Facility", code: "CPF-01", kind: "factory", is_active: true },
    { id: "22222222-2222-2222-2222-222222222222", name: "Kochi Port Warehouse", code: "WH-KCH", kind: "warehouse", is_active: true },
    { id: "33333333-3333-3333-3333-333333333333", name: "Bangalore Logistics Hub", code: "WH-BLR", kind: "warehouse", is_active: true },
    { id: "44444444-4444-4444-4444-444444444444", name: "GreenCycle Partner Facility", code: "PRT-RC1", kind: "partner", is_active: true },
    { id: "55555555-5555-5555-5555-555555555555", name: "Marine Drive Deployment Site", code: "SITE-MD", kind: "client", is_active: true },
    { id: "00000000-0000-0000-0000-000000000000", name: "External / Supplier", code: "EXT-SUP", kind: "supplier", is_active: true }
  ],
  categories: [
    { id: "c1", name: "Raw Recycled Flakes", tracking_mode: "bulk", unit: "kg", group: "raw_material", sku_prefix: "RAW", low_stock_threshold: 500, custom_fields: [] },
    { id: "c2", name: "Plastic Granules / Pellets", tracking_mode: "bulk", unit: "kg", group: "product", sku_prefix: "PEL", low_stock_threshold: 300, custom_fields: [] },
    { id: "c3", name: "Composite Lumber Boards", tracking_mode: "bulk", unit: "piece", group: "product", sku_prefix: "LMB", low_stock_threshold: 50, custom_fields: [] },
    { id: "c4", name: "Public Space Park Benches", tracking_mode: "unique", unit: "unit", group: "end_product", sku_prefix: "BNC", low_stock_threshold: 5, custom_fields: [] },
    { id: "c5", name: "Recycled Waste Bins", tracking_mode: "unique", unit: "unit", group: "end_product", sku_prefix: "BIN", low_stock_threshold: 10, custom_fields: [] }
  ],
  product_types: [
    { id: "pt1", category_id: "c1", name: "HDPE Flakes", description: "High-density polyethylene baled flakes" },
    { id: "pt2", category_id: "c2", name: "PP Extruded Pellets", description: "Polypropylene black pellets" }
  ],
  products: [
    { id: "p1", category_id: "c1", sku: "RAW-HDPE-01", name: "Unsorted HDPE Baled Flakes", unit: "kg", tracking_mode: "bulk", reorder_level: 1000, unit_cost: 35.00 },
    { id: "p2", category_id: "c2", sku: "PEL-PP-01", name: "Extruded PP Pellet (Black)", unit: "kg", tracking_mode: "bulk", reorder_level: 500, unit_cost: 75.00 },
    { id: "p3", category_id: "c3", sku: "LMB-COMP-2M", name: "2-Meter Composite Planks", unit: "piece", tracking_mode: "bulk", reorder_level: 100, unit_cost: 450.00 },
    { id: "p4", category_id: "c4", sku: "BNC-ECO-01", name: "EcoUrban Park Bench (3-Seater)", unit: "unit", tracking_mode: "unique", reorder_level: 10, unit_cost: 4800.00 },
    { id: "p5", category_id: "c5", sku: "BIN-DUAL-01", name: "Smart Dual Segregation Bin", unit: "unit", tracking_mode: "unique", reorder_level: 15, unit_cost: 2200.00 }
  ],
  partners: [
    { id: "44444444-4444-4444-4444-444444444444", name: "GreenCycle Fabricators Ltd", contact_person: "Rajesh Menon", phone: "+91 98765 43210", email: "rajesh@greencycle.in", verified: true, rating: 4.9 },
    { id: "a1", name: "CleanKerala Collection Network", contact_person: "Ananya Nair", phone: "+91 94470 12345", email: "ananya@cleankerala.org", verified: true, rating: 4.8 }
  ],
  ledger: [
    {
      id: "l1",
      entry_number: 1001,
      transaction_type: "RECEIVE_RAW",
      product_id: "p1",
      from_location_id: "00000000-0000-0000-0000-000000000000",
      to_location_id: "11111111-1111-1111-1111-111111111111",
      quantity: 5000,
      unit: "kg",
      unit_cost: 35,
      total_cost: 175000,
      operator_name: "Operations Manager",
      notes: "Initial Raw Material Inflow Batch #101",
      entry_hash: "a8f92d4e6b7a09c3d5f8e1b2a4c6d93f8c1a9d47b26e05f1a8c2d94e7b6035",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      id: "l2",
      entry_number: 1002,
      transaction_type: "STAGE_ADVANCE",
      product_id: "p2",
      from_location_id: "11111111-1111-1111-1111-111111111111",
      to_location_id: "22222222-2222-2222-2222-222222222222",
      quantity: 2400,
      unit: "kg",
      unit_cost: 75,
      total_cost: 180000,
      operator_name: "Operations Manager",
      notes: "Extrusion output transfer to Kochi Port Warehouse",
      entry_hash: "7b6035a1c8f92d4e6b7a09c3d5f8e1b2a4c6d93f8c1a9d47b26e05f1a8c2d9",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    }
  ],
  procurement: [
    {
      id: "pr1",
      pr_number: "PR-2026-001",
      po_number: "PO-2026-001",
      supplier_name: "CleanKerala Collection Network",
      status: "in_production",
      total_amount: 140000,
      note: "Urgent HDPE flakes batch for urban bench project",
      created_by_name: "Operations Manager",
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      items: [
        { id: "pri1", product_id: "p1", product_name: "Unsorted HDPE Baled Flakes", sku: "RAW-HDPE-01", requested_qty: 4000, received_qty: 0, unit_cost: 35, unit: "kg" }
      ],
      updates: [
        { id: "u1", stage: "po_created", note: "Finance approved and PO issued", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
        { id: "u2", stage: "in_production", note: "Sorting & baling in progress at supplier site", created_at: new Date(Date.now() - 86400000 * 1).toISOString() }
      ]
    }
  ],
  partnerRequests: [
    {
      id: "preq1",
      partner_id: "44444444-4444-4444-4444-444444444444",
      type: "fabrication",
      consumed_product_id: "p3",
      consumed_qty: 20,
      produced_product_id: "p4",
      produced_qty: 4,
      status: "pending",
      note: "Fabrication run of 4 EcoUrban park benches for smart city project",
      requested_by_name: "Rajesh (GreenCycle)",
      created_at: new Date(Date.now() - 86400000).toISOString()
    }
  ],
  discrepancies: [
    {
      id: "d1",
      product_id: "p1",
      location_id: "11111111-1111-1111-1111-111111111111",
      system_quantity: 5000,
      physical_quantity: 4920,
      variance: -80,
      reason: "Moisture evaporation during hot weather washing cycle",
      status: "pending",
      reported_by_name: "Operations Manager",
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    }
  ],
  deployedAssets: [
    {
      id: "da1",
      product_id: "p4",
      serial_number: "BNC-MD-2026-001",
      client_name: "Smart City Kochi",
      site_name: "Marine Drive Promenade",
      gps_latitude: 9.9816,
      gps_longitude: 76.2753,
      deployment_date: "2026-03-10",
      condition_rating: 5,
      photo_url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=600&q=80"
    }
  ],
  settings: {
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
  }
};

// ==========================================
// 1. AUTHENTICATION & PROFILE
// ==========================================

export async function loginUser(email, password) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      const { data: profile, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();
        
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: profile?.name || data.user.user_metadata?.name || email.split("@")[0],
        role: profile?.role || data.user.user_metadata?.role || "operations",
        partner_id: profile?.partner_id,
        location_id: profile?.location_id
      };
      
      return { token: data.session?.access_token, user };
    } catch (err) {
      console.warn("Supabase auth failed, trying demo user matching:", err.message);
    }
  }

  // Fallback demo credentials
  const found = mockData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (found) {
    const token = `mock-token-${found.id}-${Date.now()}`;
    return { token, user: found };
  }
  
  // Default fallback user if not found
  const demoUser = {
    id: "demo-user",
    email,
    name: email.split("@")[0].toUpperCase(),
    role: email.includes("admin") ? "admin" : email.includes("partner") ? "partner" : email.includes("finance") ? "finance" : "operations"
  };
  return { token: `mock-token-${Date.now()}`, user: demoUser };
}

export async function getCurrentProfile() {
  if (isSupabaseConfigured()) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        return {
          id: user.id,
          email: user.email,
          name: profile?.name || user.user_metadata?.name || user.email.split("@")[0],
          role: profile?.role || user.user_metadata?.role || "operations",
          partner_id: profile?.partner_id,
          location_id: profile?.location_id
        };
      }
    } catch (e) {
      console.warn("Could not fetch current Supabase user:", e);
    }
  }
  return null;
}

export async function logoutUser() {
  if (isSupabaseConfigured()) {
    try {
      await supabase.auth.signOut();
    } catch (e) {}
  }
  return { ok: true };
}

// ==========================================
// 2. MASTER DATA (Categories, Products, Locations, Partners)
// ==========================================

export async function fetchCategories() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error && data) return data;
  }
  return mockData.categories;
}

export async function createCategory(cat) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").insert([cat]).select().single();
    if (error) throw error;
    return data;
  }
  const newCat = { ...cat, id: `c_${Date.now()}` };
  mockData.categories.push(newCat);
  return newCat;
}

export async function updateCategory(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("categories").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  mockData.categories = mockData.categories.map(c => c.id === id ? { ...c, ...updates } : c);
  return mockData.categories.find(c => c.id === id);
}

export async function fetchProducts() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("products").select("*, category:categories(*)").order("name");
    if (!error && data) return data;
  }
  return mockData.products.map(p => ({
    ...p,
    category: mockData.categories.find(c => c.id === p.category_id)
  }));
}

export async function createProduct(prod) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("products").insert([prod]).select().single();
    if (error) throw error;
    return data;
  }
  const newProd = { ...prod, id: `p_${Date.now()}` };
  mockData.products.push(newProd);
  return newProd;
}

export async function updateProduct(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("products").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  mockData.products = mockData.products.map(p => p.id === id ? { ...p, ...updates } : p);
  return mockData.products.find(p => p.id === id);
}

export async function fetchLocations() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("locations").select("*").order("name");
    if (!error && data) return data;
  }
  return mockData.locations;
}

export async function createLocation(loc) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("locations").insert([loc]).select().single();
    if (error) throw error;
    return data;
  }
  const newLoc = { ...loc, id: `loc_${Date.now()}` };
  mockData.locations.push(newLoc);
  return newLoc;
}

export async function fetchPartners() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("partners").select("*").order("name");
    if (!error && data) return data;
  }
  return mockData.partners;
}

export async function createPartner(partner) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("partners").insert([partner]).select().single();
    if (error) throw error;
    return data;
  }
  const newP = { ...partner, id: `part_${Date.now()}` };
  mockData.partners.push(newP);
  return newP;
}

// ==========================================
// 3. DOUBLE-ENTRY LEDGER & INVENTORY CALCULATION
// ==========================================

export async function fetchLedgerEntries(limit = 100) {
  let entries = [];
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("ledger_entries")
      .select("*, product:products(*), from_location:locations!from_location_id(name), to_location:locations!to_location_id(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (!error && data) entries = data;
  } else {
    entries = mockData.ledger.slice(0, limit);
  }

  const prodMap = new Map(mockData.products.map(p => [p.id, p]));
  const locMap = new Map(mockData.locations.map(l => [l.id, l]));

  return entries.map(e => {
    const p = e.product || prodMap.get(e.product_id);
    const toLoc = e.to_location || locMap.get(e.to_location_id);
    const fromLoc = e.from_location || locMap.get(e.from_location_id);
    const locName = toLoc?.name || fromLoc?.name || "Central Processing Facility";
    const delta = e.delta !== undefined ? e.delta : (
      e.transaction_type === "CONSUME" || e.transaction_type === "DAMAGE" || e.transaction_type === "DEPLOY" || (e.from_location_id && !e.to_location_id)
        ? -Math.abs(e.quantity || 0)
        : Math.abs(e.quantity || 0)
    );

    return {
      ...e,
      txn_label: e.txn_label || (e.transaction_type ? e.transaction_type.toLowerCase().replace(/_/g, " ") : "Movement"),
      product_name: e.product_name || p?.name || "Unsorted HDPE Baled Flakes",
      product_sku: e.product_sku || p?.sku || "RAW-HDPE-01",
      location_name: e.location_name || locName,
      delta: delta,
      actor_name: e.actor_name || e.operator_name || "Operations Manager",
      note: e.note || e.notes || "",
      created_at: e.created_at || new Date().toISOString(),
    };
  });
}

export async function postLedgerEntry(entry) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("ledger_entries").insert([entry]).select().single();
    if (error) throw error;
    return data;
  }
  const newEntry = {
    ...entry,
    id: `l_${Date.now()}`,
    entry_number: 1000 + mockData.ledger.length + 1,
    entry_hash: `hash_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    created_at: new Date().toISOString()
  };
  mockData.ledger.unshift(newEntry);
  return newEntry;
}

export async function fetchInventoryBalances() {
  const [products, locations, ledger] = await Promise.all([
    fetchProducts(),
    fetchLocations(),
    fetchLedgerEntries(1000)
  ]);

  // Compute double-entry balances: Sum debits (to_location) minus credits (from_location)
  const balances = {};
  for (const p of products) {
    balances[p.id] = { product: p, total_qty: 0, by_location: {} };
    for (const loc of locations) {
      balances[p.id].by_location[loc.id] = 0;
    }
  }

  for (const entry of ledger) {
    const pid = entry.product_id;
    if (!balances[pid]) continue;
    const qty = Number(entry.quantity) || 0;
    
    // Inflow to destination location
    if (entry.to_location_id && balances[pid].by_location[entry.to_location_id] !== undefined) {
      balances[pid].by_location[entry.to_location_id] += qty;
    }
    // Outflow from origin location
    if (entry.from_location_id && balances[pid].by_location[entry.from_location_id] !== undefined) {
      balances[pid].by_location[entry.from_location_id] -= qty;
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
  let prs = [];
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase
      .from("procurement_requests")
      .select("*, items:procurement_items(*), updates:procurement_updates(*)")
      .order("created_at", { ascending: false });
    if (!error && data) prs = data;
  } else {
    prs = mockData.procurement;
  }

  return prs.map(p => ({
    ...p,
    number: p.po_number || p.pr_number || `PO-${p.id}`,
    po_number: p.po_number || p.pr_number || `PO-${p.id}`,
    requested_by: p.created_by_name || p.requested_by || "Operations Manager",
    total_cost: p.total_amount || p.total_cost || 0,
    items: (p.items || []).map(it => ({
      ...it,
      qty: it.requested_qty || it.qty || 0,
      unit: it.unit || "kg",
      unit_cost: it.unit_cost || 0,
      product_name: it.product_name || (mockData.products.find(prod => prod.id === it.product_id)?.name) || "Raw Material"
    }))
  }));
}

export async function createPurchaseRequest(prData) {
  if (isSupabaseConfigured()) {
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

  const newPR = {
    id: `pr_${Date.now()}`,
    pr_number: `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
    po_number: null,
    supplier_name: prData.supplier_name || "CleanKerala Collection Network",
    status: "requested",
    total_amount: 0,
    note: prData.note,
    created_by_name: "Operations",
    created_at: new Date().toISOString(),
    items: (prData.items || []).map((it, idx) => ({
      id: `pri_${idx}`,
      product_id: it.product_id,
      product_name: it.product_name || "Raw Material",
      requested_qty: it.qty,
      received_qty: 0,
      unit_cost: 0,
      unit: "kg"
    })),
    updates: []
  };
  mockData.procurement.unshift(newPR);
  return newPR;
}

export async function approveProcurementRequest(id, items, note) {
  const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  if (isSupabaseConfigured()) {
    const totalAmount = (items || []).reduce((sum, it) => sum + (it.qty * it.unit_cost), 0);
    await supabase.from("procurement_requests").update({
      po_number: poNumber,
      status: "po_created",
      total_amount: totalAmount
    }).eq("id", id);

    for (const it of items) {
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

  mockData.procurement = mockData.procurement.map(pr => {
    if (pr.id === id) {
      pr.status = "po_created";
      pr.po_number = poNumber;
      pr.updates.push({
        id: `up_${Date.now()}`,
        stage: "po_created",
        note: note || "Finance approved PO",
        created_at: new Date().toISOString()
      });
    }
    return pr;
  });
  return { ok: true };
}

export async function updateProcurementStage(id, stage, note) {
  if (isSupabaseConfigured()) {
    await supabase.from("procurement_requests").update({ status: stage }).eq("id", id);
    await supabase.from("procurement_updates").insert([{ request_id: id, stage, note }]);
    return { ok: true };
  }

  mockData.procurement = mockData.procurement.map(pr => {
    if (pr.id === id) {
      pr.status = stage;
      pr.updates.push({
        id: `up_${Date.now()}`,
        stage,
        note: note || `Stage updated to ${stage}`,
        created_at: new Date().toISOString()
      });
    }
    return pr;
  });
  return { ok: true };
}

export async function deliverProcurementOrder(id, locationId, receivedItems, note) {
  const pr = mockData.procurement.find(p => p.id === id);
  if (pr) {
    pr.status = "delivered";
    pr.updates.push({
      id: `up_${Date.now()}`,
      stage: "delivered",
      note: note || "Order received and stock updated",
      created_at: new Date().toISOString()
    });
  }

  // Create automatic double-entry ledger entries for delivered items
  for (const item of (receivedItems || [])) {
    await postLedgerEntry({
      transaction_type: "RECEIVE_RAW",
      product_id: item.product_id,
      from_location_id: "00000000-0000-0000-0000-000000000000",
      to_location_id: locationId,
      quantity: Number(item.received_qty),
      unit: item.unit || "kg",
      notes: `PO Delivery: ${pr?.po_number || pr?.pr_number || id}`,
      operator_name: "Operations"
    });
  }
  return { ok: true };
}

// ==========================================
// 5. PARTNER PORTAL & APPROVALS
// ==========================================

export async function fetchPartnerDashboard(partnerId, locationId) {
  const balances = await fetchInventoryBalances();
  const targetLocation = locationId || "44444444-4444-4444-4444-444444444444";
  
  const partnerStock = balances.map(b => ({
    product_id: b.product.id,
    sku: b.product.sku,
    name: b.product.name,
    unit: b.product.unit,
    group: b.product.category?.group,
    balance: b.by_location[targetLocation] || 0
  }));

  const requests = mockData.partnerRequests.filter(r => !partnerId || r.partner_id === partnerId);
  return { stock: partnerStock, requests };
}

export async function submitPartnerRequest(req) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("partner_requests").insert([req]).select().single();
    if (error) throw error;
    return data;
  }
  const newReq = {
    ...req,
    id: `preq_${Date.now()}`,
    status: "pending",
    created_at: new Date().toISOString()
  };
  mockData.partnerRequests.unshift(newReq);
  return newReq;
}

export async function fetchApprovals() {
  const pendingPRs = mockData.procurement.filter(p => p.status === "requested").map(p => ({
    id: p.id,
    type: "procurement",
    title: `Purchase Request ${p.pr_number}`,
    amount: p.total_amount,
    requested_by: p.created_by_name,
    created_at: p.created_at,
    raw: p
  }));

  const pendingPartner = mockData.partnerRequests.filter(r => r.status === "pending").map(r => ({
    id: r.id,
    type: r.type === "fabrication" ? "partner_fabrication" : "partner_material",
    title: r.type === "fabrication" ? "Partner Fabrication Run" : "Partner Material Requisition",
    requested_by: r.requested_by_name,
    created_at: r.created_at,
    raw: r
  }));

  const pendingDiscrepancies = mockData.discrepancies.filter(d => d.status === "pending").map(d => ({
    id: d.id,
    type: "discrepancy",
    title: `Physical Variance: ${d.variance > 0 ? "+" : ""}${d.variance} (${d.reason})`,
    requested_by: d.reported_by_name,
    created_at: d.created_at,
    raw: d
  }));

  return [...pendingPRs, ...pendingPartner, ...pendingDiscrepancies];
}

export async function resolveApproval(type, id, action, note) {
  if (type === "partner_fabrication" || type === "partner_material") {
    mockData.partnerRequests = mockData.partnerRequests.map(r => r.id === id ? { ...r, status: action } : r);
  } else if (type === "discrepancy") {
    mockData.discrepancies = mockData.discrepancies.map(d => d.id === id ? { ...d, status: action, resolution_notes: note } : d);
  } else if (type === "procurement") {
    mockData.procurement = mockData.procurement.map(p => p.id === id ? { ...p, status: action === "approved" ? "po_created" : "rejected" } : p);
  }
  return { ok: true };
}

// ==========================================
// 6. DISCREPANCIES & ASSETS & SETTINGS
// ==========================================

export async function fetchDiscrepancies() {
  let discs = [];
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("discrepancies").select("*, product:products(*), location:locations(*)").order("created_at", { ascending: false });
    if (!error && data) discs = data;
  } else {
    discs = mockData.discrepancies;
  }

  return discs.map(d => {
    const prod = d.product || mockData.products.find(p => p.id === d.product_id);
    const loc = d.location || mockData.locations.find(l => l.id === d.location_id);
    return {
      ...d,
      product: prod,
      product_name: prod?.name || d.product_name || "Unsorted HDPE Baled Flakes",
      product_sku: prod?.sku || d.product_sku || "RAW-HDPE-01",
      location: loc,
      location_name: loc?.name || d.location_name || "Central Processing Facility",
      balance: d.system_quantity || d.balance || 0,
      physical_balance: d.physical_quantity || (d.system_quantity || 0) + (d.variance || 0),
      delta: d.variance || (d.physical_quantity - d.system_quantity) || 0,
      reported_by: d.reported_by_name || d.reported_by || "Operations Manager",
      created_at: d.created_at || new Date().toISOString()
    };
  });
}

export async function reportDiscrepancy(disc) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("discrepancies").insert([disc]).select().single();
    if (error) throw error;
    return data;
  }
  const newDisc = {
    ...disc,
    id: `disc_${Date.now()}`,
    status: "pending",
    variance: disc.physical_quantity - disc.system_quantity,
    created_at: new Date().toISOString()
  };
  mockData.discrepancies.unshift(newDisc);
  return newDisc;
}

export async function fetchDeployedAssets() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("deployed_assets").select("*, product:products(*)").order("created_at", { ascending: false });
    if (!error && data) return data;
  }
  return mockData.deployedAssets.map(da => ({
    ...da,
    product: mockData.products.find(p => p.id === da.product_id)
  }));
}

export async function fetchSettings() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("settings").select("*").eq("id", "global").single();
    if (!error && data) return data;
  }
  return mockData.settings;
}

export async function updateSettings(updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("settings").update(updates).eq("id", "global").select().single();
    if (error) throw error;
    return data;
  }
  mockData.settings = { ...mockData.settings, ...updates };
  return mockData.settings;
}

export async function fetchUsers() {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!error && data) return data;
  }
  return mockData.users;
}

export async function updateUser(id, updates) {
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
  mockData.users = mockData.users.map(u => u.id === id ? { ...u, ...updates } : u);
  return mockData.users.find(u => u.id === id);
}
