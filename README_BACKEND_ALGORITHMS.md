# RecyclOps ERP · Business Logic & Algorithms Reference

This document preserves the complete mathematical models, state machines, business algorithms, ledger logic, and workflows from the original backend implementation.

---

## 1. Immutable Double-Entry Stock Ledger

### 1.1 Core Invariant
Stock balance is **never stored as an editable integer or mutable field**. It is always computed in real-time as the algebraic sum of all ledger movements:

$$\text{Stock Balance}(P, L) = \sum \text{Debits (Inflows to } L) - \sum \text{Credits (Outflows from } L)$$

### 1.2 Transaction Types & Algebraic Signs
| Transaction Type | UI Action | Direction / Delta Sign | Description |
| :--- | :--- | :---: | :--- |
| `RECEIVE_RAW` / `purchased` | PO Delivery / Raw Inflow | `+` (Inflow) | Raw materials received at location |
| `manufactured` | Production Output | `+` (Inflow) | Finished or refined products produced |
| `consumed` | Production Input | `-` (Outflow) | Raw materials or lumber consumed in run |
| `transfer_in` / `transfer_out` | Stock Transfer | `+` (Dest) / `-` (Src) | Inter-location stock movement |
| `partner_sent` / `partner_received` | Partner Dispatch | `-` (Wh) / `+` (Partner) | Material sent to external fabricator |
| `deployed` | Asset Deployment | `-` (Outflow) | Public space assets installed on site |
| `returned` | Recycling Return | `+` (Inflow) | End-of-life recycled asset returned |
| `damaged` / `sold` | Write-off / Sale | `-` (Outflow) | Material scrapped or sold |
| `adjusted` | Discrepancy Correction | `+/-` (Explicit sign) | Reconciliation adjustment |

### 1.3 Total Cost Calculation
$$\text{Total Cost} = \text{Quantity} \times \text{Unit Cost}$$

### 1.4 SHA-256 Tamper-Evident Hash Chaining Algorithm
Every ledger entry computes a cryptographic block hash chaining back to the previous entry:
$$\text{Hash}_n = \text{SHA256}(\text{Type} \parallel \text{ProductID} \parallel \text{FromLoc} \parallel \text{ToLoc} \parallel \text{Qty} \parallel \text{OperatorID} \parallel \text{Timestamp} \parallel \text{Hash}_{n-1})$$

---

## 2. Procurement & 8-Stage Refining Lifecycle

### 2.1 State Transition Sequence
```
[requested] 
     │ (Finance adds Unit Cost & Approves)
     ▼
[po_created] ──► [sent] ──► [supplier_confirmed] ──► [in_production] 
                                                              │
[delivered] ◄── [partially_delivered] ◄── [in_transit] ◄── [shipped]
     │
     └──► (Triggers automatic RECEIVE_RAW ledger entry to increase stock)
```

### 2.2 Yield & Waste Calculation in Refining Pipeline
For every stage transition (Collection -> Sorting -> Washing -> Granulation -> Compounding -> Extrusion -> Quality Check -> Storage):
$$\text{Waste (kg)} = \text{Input Weight (kg)} - \text{Output Weight (kg)}$$
$$\text{Stage Yield \%} = \left( \frac{\text{Output Weight}}{\text{Input Weight}} \right) \times 100$$

---

## 3. Partner Portal & Fabrication Conversion

### 3.1 Fabrication Run Conversion
When an authorized fabrication partner converts company lumber into end products (e.g., 20 planks into 4 park benches):
1. **Material Consumption**: Partner location stock of `consumed_product_id` decreases by `consumed_qty`.
2. **Finished Good Yield**: Partner location stock of `produced_product_id` increases by `produced_qty`.
3. **Approval Gate**: Fabrication requests submitted by partner require Operations Manager review before ledger commitment.

---

## 4. Discrepancy & Variance Reconciliation

### 4.1 Variance Formula
$$\text{Variance} = \text{Physical Stock Count} - \text{System Calculated Stock}$$
- If $\text{Variance} < 0$: Shortage / Evaporation / Contamination.
- If $\text{Variance} > 0$: Excess / Unrecorded intake.

### 4.2 Two-Person Rule for Adjustments
1. **Operations**: Proposes quantity correction and provides reason.
2. **Finance / Admin**: Approves proposed correction.
3. Upon approval, an `adjusted` ledger entry is posted with $\Delta = \text{Variance}$ and the discrepancy status transitions from `pending_approval` to `resolved`.

---

## 5. SKU Generation & Counter Logic
$$\text{SKU} = \text{Category Prefix} + \text{"-"} + \text{Padded Counter}$$
- Example: Prefix `RAW` with sequence 1 $\rightarrow$ `RAW-0001`
- Example: Prefix `PEL` with sequence 42 $\rightarrow$ `PEL-0042`
- Example: Prefix `BNC` with sequence 10 $\rightarrow$ `BNC-0010`

---

## 6. Role-Based Access Control (RBAC) Matrix

| Module / Permission | Admin | Operations | Production | Finance | Partner | Client |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Raise Purchase Request** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve PO / Add Unit Cost** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Production Run (Consume/Produce)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Stock Transfer** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Deploy Assets (GPS Tracking)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Propose Stock Correction** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Approve Discrepancy** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Master Data (Categories/SKUs)** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **User & Settings Management** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Partner Portal (Subcontracting)** | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Client View (Public Space Assets)**| ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
