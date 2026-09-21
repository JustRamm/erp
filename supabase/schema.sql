-- ==============================================================================
-- Carbon & Whale · IMS (Inventory & Lifecycle Management System)
-- Complete Production Supabase PostgreSQL Schema with RLS, Triggers & RPCs
-- ==============================================================================

-- 1. EXTENSIONS & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- User Roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'operations',
        'production',
        'finance',
        'partner',
        'client'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Material Tracking Mode
DO $$ BEGIN
    CREATE TYPE tracking_mode AS ENUM ('bulk', 'unique');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Material Group
DO $$ BEGIN
    CREATE TYPE material_group AS ENUM ('raw_material', 'product', 'end_product');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Procurement / Refining Stages
DO $$ BEGIN
    CREATE TYPE procurement_stage AS ENUM (
        'COLLECTION',
        'SORTING',
        'WASHING',
        'GRANULATION',
        'COMPOUNDING',
        'EXTRUSION',
        'QUALITY_CHECK',
        'STORAGE'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Ledger Transaction Types
DO $$ BEGIN
    CREATE TYPE transaction_type AS ENUM (
        'RECEIVE_RAW',
        'STAGE_ADVANCE',
        'MANUFACTURE',
        'TRANSFER',
        'DISCREPANCY_ADJUST',
        'DEPLOYMENT',
        'RETURN_RECYCLE'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Approval Status
DO $$ BEGIN
    CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;


-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- Partners / Collection Vendors / Fabricators
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    verified BOOLEAN NOT NULL DEFAULT true,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles / Users (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'operations',
    active BOOLEAN NOT NULL DEFAULT true,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    location_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Locations / Warehouses / Plants
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    kind TEXT NOT NULL DEFAULT 'warehouse', -- warehouse | factory | partner | client
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Master Categories (e.g. Granules, Composite Lumber, Public Furniture)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    tracking_mode tracking_mode NOT NULL DEFAULT 'bulk',
    unit TEXT NOT NULL DEFAULT 'kg',
    "group" material_group NOT NULL DEFAULT 'raw_material',
    sku_prefix TEXT NOT NULL UNIQUE,
    low_stock_threshold NUMERIC(12, 2) DEFAULT 100.00,
    custom_fields JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Types / Subcategories
CREATE TABLE IF NOT EXISTS public.product_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, name)
);

-- Products & SKUs
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_id UUID REFERENCES public.product_types(id) ON DELETE SET NULL,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL DEFAULT 'unit',
    tracking_mode tracking_mode NOT NULL DEFAULT 'bulk',
    reorder_level NUMERIC(12, 2) DEFAULT 50.00,
    unit_cost NUMERIC(12, 2) DEFAULT 0.00,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- System Settings & Permissions
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    app_name TEXT NOT NULL DEFAULT 'Carbon & Whale IMS',
    low_stock_alert BOOLEAN NOT NULL DEFAULT true,
    notify_email TEXT,
    notify_low_stock BOOLEAN NOT NULL DEFAULT true,
    notify_discrepancy BOOLEAN NOT NULL DEFAULT true,
    permissions JSONB NOT NULL DEFAULT '{
        "admin": ["*"],
        "operations": ["dashboard", "inventory", "ledger", "procurement", "master_data", "discrepancies", "approvals"],
        "production": ["dashboard", "inventory", "ledger", "procurement"],
        "finance": ["dashboard", "inventory", "ledger", "procurement", "approvals"],
        "partner": ["partner_portal"],
        "client": ["client_view"]
    }'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- 3. BATCHES & REFINING PIPELINE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number TEXT NOT NULL UNIQUE,
    partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
    plastic_type TEXT NOT NULL DEFAULT 'HDPE',
    initial_weight_kg NUMERIC(12, 2) NOT NULL,
    current_weight_kg NUMERIC(12, 2) NOT NULL,
    current_stage procurement_stage NOT NULL DEFAULT 'COLLECTION',
    source_location_id UUID REFERENCES public.locations(id),
    current_location_id UUID REFERENCES public.locations(id),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.batch_stage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
    from_stage procurement_stage NOT NULL,
    to_stage procurement_stage NOT NULL,
    input_weight_kg NUMERIC(12, 2) NOT NULL,
    output_weight_kg NUMERIC(12, 2) NOT NULL,
    waste_weight_kg NUMERIC(12, 2) GENERATED ALWAYS AS (input_weight_kg - output_weight_kg) STORED,
    energy_kwh NUMERIC(10, 2) DEFAULT 0.00,
    operator_id UUID REFERENCES public.profiles(id),
    inspection_notes TEXT,
    weighbridge_photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- 4. IMMUTABLE DOUBLE-ENTRY STOCK LEDGER
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number BIGSERIAL UNIQUE,
    transaction_type transaction_type NOT NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    from_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
    to_location_id UUID REFERENCES public.locations(id) ON DELETE RESTRICT,
    quantity NUMERIC(14, 4) NOT NULL CHECK (quantity > 0),
    unit TEXT NOT NULL DEFAULT 'kg',
    unit_cost NUMERIC(14, 2) DEFAULT 0.00,
    total_cost NUMERIC(14, 2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,
    operator_id UUID REFERENCES public.profiles(id),
    operator_name TEXT,
    reference_id TEXT,
    notes TEXT,
    proof_photo_url TEXT,
    gps_latitude NUMERIC(10, 7),
    gps_longitude NUMERIC(10, 7),
    entry_hash TEXT,
    previous_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_product_loc ON public.ledger_entries(product_id, from_location_id, to_location_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON public.ledger_entries(created_at DESC);


-- ==============================================================================
-- 5. PROCUREMENT & PURCHASE ORDERS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.procurement_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pr_number TEXT NOT NULL UNIQUE,
    po_number TEXT UNIQUE,
    supplier_id UUID REFERENCES public.partners(id),
    supplier_name TEXT,
    status TEXT NOT NULL DEFAULT 'requested', -- requested, rejected, po_created, sent, supplier_confirmed, in_production, shipped, in_transit, partially_delivered, delivered
    total_amount NUMERIC(14, 2) DEFAULT 0.00,
    note TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_by_name TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    destination_location_id UUID REFERENCES public.locations(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.procurement_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id),
    product_name TEXT,
    sku TEXT,
    unit TEXT NOT NULL DEFAULT 'kg',
    requested_qty NUMERIC(14, 4) NOT NULL,
    received_qty NUMERIC(14, 4) NOT NULL DEFAULT 0.00,
    unit_cost NUMERIC(14, 2) DEFAULT 0.00,
    total_cost NUMERIC(14, 2) GENERATED ALWAYS AS (requested_qty * COALESCE(unit_cost, 0)) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.procurement_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.procurement_requests(id) ON DELETE CASCADE,
    stage TEXT NOT NULL,
    note TEXT,
    updated_by_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- 6. PARTNER PORTAL & FABRICATION
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.partner_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES public.partners(id),
    type TEXT NOT NULL, -- 'material_request' | 'fabrication'
    product_id UUID REFERENCES public.products(id),
    quantity NUMERIC(14, 4),
    consumed_product_id UUID REFERENCES public.products(id),
    consumed_qty NUMERIC(14, 4),
    produced_product_id UUID REFERENCES public.products(id),
    produced_qty NUMERIC(14, 4),
    status approval_status NOT NULL DEFAULT 'pending',
    note TEXT,
    requested_by UUID REFERENCES public.profiles(id),
    requested_by_name TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);


-- ==============================================================================
-- 7. APPROVALS, DISCREPANCIES & ASSETS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.discrepancies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id),
    location_id UUID NOT NULL REFERENCES public.locations(id),
    system_quantity NUMERIC(14, 4) NOT NULL,
    physical_quantity NUMERIC(14, 4) NOT NULL,
    variance NUMERIC(14, 4) GENERATED ALWAYS AS (physical_quantity - system_quantity) STORED,
    reason TEXT NOT NULL,
    status approval_status NOT NULL DEFAULT 'pending',
    reported_by UUID REFERENCES public.profiles(id),
    reported_by_name TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'procurement', 'discrepancy', 'partner_material', 'partner_fabrication'
    amount NUMERIC(14, 2) DEFAULT 0.00,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status approval_status NOT NULL DEFAULT 'pending',
    requested_by UUID REFERENCES public.profiles(id),
    requested_by_name TEXT,
    approver_id UUID REFERENCES public.profiles(id),
    comments TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.deployed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    serial_number TEXT NOT NULL UNIQUE,
    batch_id UUID REFERENCES public.batches(id),
    client_name TEXT NOT NULL,
    site_name TEXT NOT NULL,
    gps_latitude NUMERIC(10, 7) NOT NULL,
    gps_longitude NUMERIC(10, 7) NOT NULL,
    deployment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    photo_url TEXT,
    warranty_expiry DATE,
    condition_rating INT DEFAULT 5 CHECK (condition_rating BETWEEN 1 AND 5),
    deployed_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ==============================================================================
-- 8. TRIGGERS & RPC FUNCTIONS
-- ==============================================================================

-- SHA-256 Tamper-Evident Ledger Hasher Trigger
CREATE OR REPLACE FUNCTION fn_hash_ledger_entry()
RETURNS TRIGGER AS $$
DECLARE
    v_prev_hash TEXT;
BEGIN
    SELECT entry_hash INTO v_prev_hash
    FROM public.ledger_entries
    WHERE id != NEW.id
    ORDER BY entry_number DESC
    LIMIT 1;

    NEW.previous_hash := COALESCE(v_prev_hash, 'GENESIS_BLOCK_0000000000000000');
    NEW.entry_hash := encode(
        digest(
            CONCAT(
                NEW.transaction_type, '|',
                NEW.product_id, '|',
                NEW.from_location_id, '|',
                NEW.to_location_id, '|',
                NEW.quantity, '|',
                COALESCE(NEW.operator_id::text, ''), '|',
                NEW.created_at, '|',
                NEW.previous_hash
            ),
            'sha256'
        ),
        'hex'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_hasher ON public.ledger_entries;
CREATE TRIGGER trg_ledger_hasher
BEFORE INSERT ON public.ledger_entries
FOR EACH ROW EXECUTE FUNCTION fn_hash_ledger_entry();


-- Real-time Stock Balance Function
CREATE OR REPLACE FUNCTION get_stock_balance(p_product_id UUID, p_location_id UUID DEFAULT NULL)
RETURNS NUMERIC AS $$
DECLARE
    v_inflows NUMERIC;
    v_outflows NUMERIC;
BEGIN
    SELECT COALESCE(SUM(quantity), 0) INTO v_inflows
    FROM public.ledger_entries
    WHERE product_id = p_product_id
      AND (p_location_id IS NULL OR to_location_id = p_location_id);

    SELECT COALESCE(SUM(quantity), 0) INTO v_outflows
    FROM public.ledger_entries
    WHERE product_id = p_product_id
      AND (p_location_id IS NULL OR from_location_id = p_location_id);

    RETURN (v_inflows - v_outflows);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to automatically handle new Auth signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, active)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'operations'::user_role),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_stage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procurement_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployed_assets ENABLE ROW LEVEL SECURITY;

-- Helper to check user role
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Universal Read for Authenticated Users on Master Data & Settings
CREATE POLICY "Allow authenticated read master data" ON public.locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read categories" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read product types" ON public.product_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read partners" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read settings" ON public.settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read deployed assets" ON public.deployed_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read ledger" ON public.ledger_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read procurement" ON public.procurement_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read procurement items" ON public.procurement_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read procurement updates" ON public.procurement_updates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read partner requests" ON public.partner_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read discrepancies" ON public.discrepancies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read approvals" ON public.approval_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read batches" ON public.batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);

-- Admin / Staff Insert & Update Policies
CREATE POLICY "Allow staff write master data" ON public.categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write product types" ON public.product_types FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write products" ON public.products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write locations" ON public.locations FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write partners" ON public.partners FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write settings" ON public.settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write ledger" ON public.ledger_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow staff write procurement" ON public.procurement_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write procurement items" ON public.procurement_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write procurement updates" ON public.procurement_updates FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write partner requests" ON public.partner_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write discrepancies" ON public.discrepancies FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write approvals" ON public.approval_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write deployed assets" ON public.deployed_assets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write batches" ON public.batches FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow staff write profiles" ON public.profiles FOR ALL TO authenticated USING (true);


-- ==============================================================================
-- 10. DEFAULT SEED DATA
-- ==============================================================================

INSERT INTO public.settings (id, app_name, low_stock_alert, notify_low_stock, notify_discrepancy)
VALUES ('global', 'Carbon & Whale · IMS', true, true, true)
ON CONFLICT (id) DO NOTHING;

-- Locations
INSERT INTO public.locations (id, name, code, kind)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Central Processing Facility', 'CPF-01', 'factory'),
    ('22222222-2222-2222-2222-222222222222', 'Kochi Port Warehouse', 'WH-KCH', 'warehouse'),
    ('33333333-3333-3333-3333-333333333333', 'Bangalore Logistics Hub', 'WH-BLR', 'warehouse'),
    ('44444444-4444-4444-4444-444444444444', 'GreenCycle Partner Facility', 'PRT-RC1', 'partner'),
    ('55555555-5555-5555-5555-555555555555', 'Marine Drive Deployment Site', 'SITE-MD', 'client'),
    ('00000000-0000-0000-0000-000000000000', 'External / Supplier / Market', 'EXT-SUP', 'supplier')
ON CONFLICT (id) DO NOTHING;

-- Categories
INSERT INTO public.categories (id, name, tracking_mode, unit, "group", sku_prefix, low_stock_threshold)
VALUES
    ('ca111111-1111-1111-1111-111111111111', 'Raw Recycled Flakes', 'bulk', 'kg', 'raw_material', 'RAW', 500.00),
    ('ca222222-2222-2222-2222-222222222222', 'Plastic Granules / Pellets', 'bulk', 'kg', 'product', 'PEL', 300.00),
    ('ca333333-3333-3333-3333-333333333333', 'Composite Lumber Boards', 'bulk', 'piece', 'product', 'LMB', 50.00),
    ('ca444444-4444-4444-4444-444444444444', 'Public Space Park Benches', 'unique', 'unit', 'end_product', 'BNC', 5.00),
    ('ca555555-5555-5555-5555-555555555555', 'Recycled Waste Bins', 'unique', 'unit', 'end_product', 'BIN', 10.00)
ON CONFLICT (id) DO NOTHING;

-- Products
INSERT INTO public.products (id, category_id, sku, name, unit, tracking_mode, reorder_level, unit_cost)
VALUES
    ('de111111-1111-1111-1111-111111111111', 'ca111111-1111-1111-1111-111111111111', 'RAW-HDPE-01', 'Unsorted HDPE Baled Flakes', 'kg', 'bulk', 1000.00, 35.00),
    ('de222222-2222-2222-2222-222222222222', 'ca222222-2222-2222-2222-222222222222', 'PEL-PP-01', 'Extruded PP Pellet (Black)', 'kg', 'bulk', 500.00, 75.00),
    ('de333333-3333-3333-3333-333333333333', 'ca333333-3333-3333-3333-333333333333', 'LMB-COMP-2M', '2-Meter Composite Planks', 'piece', 'bulk', 100.00, 450.00),
    ('de444444-4444-4444-4444-444444444444', 'ca444444-4444-4444-4444-444444444444', 'BNC-ECO-01', 'EcoUrban Park Bench (3-Seater)', 'unit', 'unique', 10.00, 4800.00),
    ('de555555-5555-5555-5555-555555555555', 'ca555555-5555-5555-5555-555555555555', 'BIN-DUAL-01', 'Smart Dual Segregation Bin', 'unit', 'unique', 15.00, 2200.00)
ON CONFLICT (id) DO NOTHING;

-- Partners
INSERT INTO public.partners (id, name, contact_person, phone, email, verified, rating)
VALUES
    ('44444444-4444-4444-4444-444444444444', 'GreenCycle Fabricators Ltd', 'Rajesh Menon', '+91 98765 43210', 'rajesh@greencycle.in', true, 4.90),
    ('aa111111-1111-1111-1111-111111111111', 'CleanKerala Collection Network', 'Ananya Nair', '+91 94470 12345', 'ananya@cleankerala.org', true, 4.80)
ON CONFLICT (id) DO NOTHING;
