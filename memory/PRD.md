# RecyclOps — Product Requirements & Build Log

## Original Problem Statement
Web-based, mobile-responsive Operations, Inventory & Production Management Platform for the full lifecycle of recycled-plastic production (granules → lumber/sheets → end products → deployment). Staff record events; the system handles inventory math, IDs, history, traceability. Core principle: **every inventory movement is an append-only ledger entry; stock is always derived, never edited.**

## Architecture
- **Backend:** FastAPI (`/app/backend`), split into `core.py` (JWT auth, bcrypt, object storage), `ledger.py` (post_entry, get_balance, discrepancy auto-open/clear), `seed.py` (demo data), `server.py` (routes). All routes under `/api`.
- **Frontend:** React 19 (`/app/frontend/src`), industrial dark tactical UI. AuthContext + localStorage JWT (Bearer). Pages: Login, Dashboard, Inventory, Ledger, MasterData, Users, Discrepancies, Boardroom (ClientView). Quick-action transactions via `ActionDialog.js`.
- **DB:** MongoDB. Ledger = append-only `transactions` collection; balances via aggregation. Simple master collections namespaced under `/api/master/{coll}`.
- **Storage:** Emergent Object Storage for photos (deploy/inspection). File download requires valid JWT.
- **Auth:** Credential-based, admin-provisioned, JWT + role guards. Roles: admin, operations, production, finance, partner, client.

## User Personas
- Admin (owner: saikrish9567@gmail.com), Operations, Production, Finance, Partner, Client. Demo accounts seeded (see /app/memory/test_credentials.md).

## Core Requirements (static)
- Ledger single source of truth; negative balances allowed → auto Discrepancy → cleared by correcting entry with reason.
- Categories carry tracking mode (bulk vs unique-ID); 3-level Category→Type→Product; auto SKUs.
- Role-gated access; Client = read-only boardroom (no ledger/cost/supplier).

## Implemented (2026-06)
- ✅ JWT auth, admin seeding, 5 demo role accounts, role-based nav + endpoint guards
- ✅ Master Data CRUD: categories (bulk/unique, sku_prefix, low-stock threshold), types, products (auto SKU), locations/suppliers/partners/customers
- ✅ Ledger-based inventory: transactions, production runs (linked consume+produce), transfers (out/in, same-loc rejected), location-aware balances
- ✅ Discrepancy auto-open on negative balance + resolve flow with adjusting entry
- ✅ Action-oriented Dashboard: category stat cards, 7 quick actions, Needs Attention, recent ledger
- ✅ Inventory list w/ search, Ledger table w/ search, Users management, Discrepancies panel
- ✅ Client Boardroom: production/volume charts, plastic diverted + CO₂ saved, deployed count (no cost/supplier)
- ✅ Object storage photo upload + geo-tag capture in Deploy action; auth-protected file serving
- ✅ In-app notifications (discrepancy alerts)
- Tested: backend 25/27 pytest pass (transfer-guard fix applied), frontend 100% smoke.

## Backlog (next)
- **P0 Procurement:** Purchase Request → Finance approval → PO status flow → Receiving increases stock
- **P0 Asset Tracking:** unique-ID per-item lifecycle (Manufactured→Inspected→Deployed→Maintained), inspection history, photos, Deployed Asset History
- **P1 Partner Portal:** partner dashboard (held material, production output), material requests + production reports gated by Ops approval
- **P1 Custom fields:** render category custom_fields in smart forms; per-item detail pages
- **P1 Approvals inbox:** pending approvals surfaced in Needs Attention with actions
- **P2 Reports:** exportable inventory/transaction CSV for Finance
- **P2:** low-stock settings per category UI; PWA install; deploy asset map view

## Next Tasks
1. Procurement module (PR/PO/Receiving)
2. Asset tracking for unique-ID categories with inspection/deployment history + photo gallery
3. Partner approval workflow
