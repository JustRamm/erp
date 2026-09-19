# RecyclOps · Carbon & Whale IMS

Inventory & Lifecycle Management System (IMS) powered by **React** and **Supabase (PostgreSQL)**.

## Architecture Overview
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons (`/frontend`)
- **Database & Auth**: Supabase PostgreSQL + Row Level Security (`/supabase/schema.sql`)
- **Algorithms & Calculations Reference**: [`README_BACKEND_ALGORITHMS.md`](./README_BACKEND_ALGORITHMS.md)

## Quick Start

### 1. Run the Frontend
```bash
yarn --cwd frontend start
```
Open `http://localhost:3000` to access the application.

### 2. Connect Live Supabase
1. Run [`supabase/schema.sql`](./supabase/schema.sql) in your [Supabase SQL Editor](https://supabase.com/dashboard).
2. Add your credentials to `frontend/.env`:
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
```
