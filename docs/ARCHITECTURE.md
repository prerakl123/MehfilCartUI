# MehfilCart -- System Architecture and Implementation Plan

> **Version:** 0.2.0-draft
> **Last Updated:** 2026-02-21
> **Status:** Planning Phase

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [System Architecture](#2-system-architecture)
3. [User Roles and Access Control](#3-user-roles-and-access-control)
4. [Session Lifecycle](#4-session-lifecycle)
5. [Core Features Breakdown](#5-core-features-breakdown)
6. [Data Models](#6-data-models)
7. [API Contract](#7-api-contract)
8. [Real-time Communication](#8-real-time-communication)
9. [Security and Validation](#9-security-and-validation)
10. [Deployment and Infrastructure](#10-deployment-and-infrastructure)
11. [Phased Implementation Roadmap](#11-phased-implementation-roadmap)
12. [Companion Documents](#12-companion-documents)

---

## 1. Product Vision

**MehfilCart** is a collaborative, real-time food ordering platform designed for dine-in
experiences. Guests at a table scan a QR code, join a shared ordering session, and
collaboratively build an order from their mobile devices. A primary user (host) controls
session access, while restaurant admins and waitstaff manage orders from dedicated dashboards.

### Core Principles

- **Mobile-first**: Designed primarily for mobile viewports (responsive up to tablet).
- **Collaborative**: Multiple users at a table contribute to a single order with full attribution.
- **Controlled access**: Hierarchical permissions prevent unauthorized modifications.
- **Fool-proof sessions**: Timeouts, locks, and admin overrides ensure data integrity.
- **Real-time**: All participants see live updates as items are added or removed.

---

## 2. System Architecture

### High-Level Overview

```
+---------------------------------------------------------------------------+
|                           CLIENT LAYER                                    |
|                                                                           |
|  +----------------+  +----------------+  +----------------------------+  |
|  |  Guest App     |  |  Waiter App    |  |    Admin Dashboard         |  |
|  |  (Mobile Web)  |  |  (Mobile Web)  |  |    (Desktop / Tablet)      |  |
|  |  Next.js       |  |  Next.js       |  |    Next.js                 |  |
|  +-------+--------+  +-------+--------+  +-----------+----------------+  |
|          |                    |                        |                   |
+----------+--------------------+------------------------+-------------------+
           |                    |                        |
           v                    v                        v
+---------------------------------------------------------------------------+
|                           API LAYER                                       |
|                                                                           |
|  +---------------------------------------------------------------------+ |
|  |  RESTful API  (FastAPI / Python)                                     | |
|  |  + WebSocket Server (native WebSocket or Socket.IO) for real-time    | |
|  +---------------------------------------------------------------------+ |
|                                                                           |
+---------------------------------------------------------------------------+
           |                    |                        |
           v                    v                        v
+---------------------------------------------------------------------------+
|                           DATA LAYER                                      |
|                                                                           |
|  +----------------+  +----------------+  +----------------------------+  |
|  |  PostgreSQL    |  |  Redis         |  |  Object Storage (S3)      |  |
|  |  (Primary DB)  |  |  (Sessions,    |  |  (Menu images, QR codes)  |  |
|  |                |  |   Cache, OTP)  |  |                           |  |
|  +----------------+  +----------------+  +----------------------------+  |
|                                                                           |
+---------------------------------------------------------------------------+
```

### Technology Stack

| Layer              | Technology                    | Justification                                              |
|--------------------|-------------------------------|------------------------------------------------------------|
| **Frontend**       | Next.js 16 (App Router)       | SSR/SSG, file-based routing, excellent mobile performance  |
| **UI Library**     | React 19                      | Component-based, massive ecosystem                         |
| **Styling**        | Vanilla CSS + CSS Modules     | Full control, no extra build dependencies, scoped styles   |
| **State Mgmt**     | Zustand + React Query         | Lightweight global state + server-state caching            |
| **Backend API**    | FastAPI (Python 3.11+)        | Async-first, auto OpenAPI docs, Pydantic validation        |
| **Real-time**      | WebSocket (FastAPI native)    | Low-latency bidirectional comms; Socket.IO as alternative  |
| **Database**       | PostgreSQL                    | Relational integrity for orders, users, sessions           |
| **ORM**            | SQLAlchemy 2.0 + Alembic      | Mature ORM with migration support                          |
| **Cache/Sessions** | Redis                         | Fast session store, OTP storage, pub/sub for real-time     |
| **OTP Provider**   | Twilio / MSG91                | SMS OTP delivery (India-focused: MSG91 preferred)          |
| **Auth**           | JWT (access + refresh tokens) | Stateless API auth with token rotation                     |
| **Deployment**     | Docker + Vercel / Railway     | Scalable, cost-effective                                   |

### Repository Structure

| Repository       | Purpose            | Tech Stack                |
|------------------|---------------------|---------------------------|
| `MehfilCart`     | Backend API server  | Python, FastAPI, SQLAlchemy, Redis |
| `MehfilCartUI`   | Frontend web app    | Next.js, React, Vanilla CSS       |

For detailed internal architecture of each, see [Companion Documents](#12-companion-documents).

---

## 3. User Roles and Access Control

### Role Hierarchy

```
SUPER_ADMIN (Platform Owner)
    |
    +-- RESTAURANT_ADMIN (Restaurant Owner/Manager)
    |       |
    |       +-- WAITER / STAFF
    |       |
    |       +-- TABLE_HOST (Primary Guest at a session)
    |               |
    |               +-- TABLE_GUEST (Other guests at the session)
    |
    +-- (Future: Multi-restaurant support)
```

### Permission Matrix

| Action                        | Super Admin | Restaurant Admin | Waiter/Staff | Table Host  | Table Guest     |
|-------------------------------|:-----------:|:----------------:|:------------:|:-----------:|:---------------:|
| Platform Config               | Yes         | --               | --           | --          | --              |
| Restaurant CRUD               | Yes         | Yes (own)        | --           | --          | --              |
| Menu Management               | Yes         | Yes              | --           | --          | --              |
| Table/QR Management           | Yes         | Yes              | --           | --          | --              |
| View All Orders               | Yes         | Yes              | Yes (assigned)| --         | --              |
| Cancel Orders                 | Yes         | Yes              | Yes          | --          | --              |
| Edit Orders                   | Yes         | Yes              | --           | --          | --              |
| Session Time Config           | Yes         | Yes              | --           | --          | --              |
| Reopen Timed-out Session      | Yes         | Yes              | --           | --          | --              |
| Create Session (scan QR)      | --          | --               | --           | Yes         | --              |
| Allow/Deny Join Requests      | --          | --               | --           | Yes         | --              |
| Allow/Block Item Addition     | --          | --               | --           | Yes         | --              |
| Add Items to Cart             | --          | --               | --           | Yes         | Yes (if allowed)|
| Remove Own Items              | --          | --               | --           | Yes         | Yes             |
| Remove Others' Items          | --          | --               | --           | Yes         | --              |
| View Cart (who added what)    | --          | --               | --           | Yes         | Yes             |
| Submit Final Order            | --          | --               | --           | Yes         | --              |
| View Order Status             | --          | --               | --           | Yes         | Yes             |

### Viewing Capabilities per Role

| Role                 | What They Can See                                                                              |
|----------------------|------------------------------------------------------------------------------------------------|
| **Super Admin**      | Everything: all restaurants, all sessions, all orders, platform analytics                      |
| **Restaurant Admin** | Own restaurant's menu, tables, active/past sessions, orders, revenue reports, session configs  |
| **Waiter/Staff**     | Incoming orders (live feed), order details, table assignments, order status updates             |
| **Table Host**       | Menu, shared cart with attribution, pending join requests, session timer, order status          |
| **Table Guest**      | Menu, shared cart with attribution, own items (editable), order status                         |

---

## 4. Session Lifecycle

### State Machine

```
                    +----------------+
    QR Scan ------->|   CREATED      |  Host scans QR, verified via OTP
                    +-------+--------+
                            | Host confirms table
                            v
                    +----------------+
                    |   ACTIVE       |<---- Admin reopens (from TIMED_OUT)
                    |                |
                    |  - Guests      |  Guests scan QR -> join request -> Host approves
                    |    can join    |
                    |  - Items       |  Members add/remove items
                    |    editable    |
                    +-------+--------+
                            |
               +------------+------------+
               |            |            |
               v            v            v
        +----------+  +----------+  +-------------+
        |  LOCKED  |  | TIMED    |  |  SUBMITTED  |
        |          |  |   OUT    |  |             |
        | Host     |  |  Auto    |  | Order sent  |
        | locks    |  |  expiry  |  | to kitchen  |
        +----+-----+  +----+-----+  +------+------+
             |              |               |
             |              |               v
             |              |        +-------------+
             |              |        | IN_PROGRESS  |  Kitchen preparing
             |              |        +------+------+
             |              |               |
             v              v               v
        +-------------------------------------------+
        |            COMPLETED / CLOSED              |
        |  Session archived, data retained for       |
        |  analytics                                 |
        +-------------------------------------------+
```

### Session Rules

| Rule                            | Default              | Configurable By    |
|---------------------------------|----------------------|--------------------|
| Session timeout duration        | 45 minutes           | Restaurant Admin   |
| Max guests per session          | 8                    | Restaurant Admin   |
| Auto-lock before submission     | Enabled              | Restaurant Admin   |
| Timeout warning                 | 5 min before expiry  | System (fixed)     |
| Session reopen window           | 15 min after timeout | Restaurant Admin   |
| Idle timeout (no activity)      | 15 minutes           | Restaurant Admin   |

### Timeout Behavior

1. **Warning Phase**: 5 minutes before timeout, all session members receive a notification.
2. **Timeout**: Session moves to `TIMED_OUT` state. Cart is frozen (read-only).
3. **Reopen**: Restaurant Admin can reopen within the reopen window, resetting the timer.
4. **Expiry**: After the reopen window passes, session is auto-closed and archived.

---

## 5. Core Features Breakdown

### 5.1 QR Code and Table Onboarding

- Each table has a unique QR code encoding: `https://mehfilcart.app/join/{restaurant_id}/{table_id}`
- Scanning opens the web app (no install required; PWA capable).
- If no active session exists, the user becomes the **Host** (after OTP verification).
- If an active session exists, the user sends a **Join Request** (after OTP verification).

### 5.2 Phone Number + OTP Authentication

- **Flow**: Enter phone number -> Receive OTP via SMS -> Verify -> JWT issued.
- **OTP Rules**:
  - 6-digit numeric code.
  - Valid for 5 minutes.
  - Max 3 verification attempts per OTP.
  - Rate limit: 3 OTPs per phone number per 15 minutes.
  - Stored in Redis with TTL (never persisted to database).
- **JWT Tokens**:
  - Access token: 30 min expiry, stored in client memory.
  - Refresh token: 7 days expiry, stored in httpOnly cookie.

### 5.3 Menu Browsing

- Categories with horizontal scroll tabs (e.g., Starters, Main Course, Beverages).
- Item cards: image, name, price, veg/non-veg indicator, description, customization options.
- Search with debounced input.
- Dietary filters: Veg, Non-Veg, Vegan, Gluten-Free.

### 5.4 Collaborative Cart

- **Shared view**: All session members see the same cart.
- **Attribution**: Each item shows who added it (avatar + name).
- **Quantity controls**: +/- per item, per user.
- **Permissions**:
  - Guests can add/remove their own items (if allowed by Host).
  - Host can remove anyone's items.
  - Host can toggle `allowGuestAdditions` on/off.
- **Real-time sync**: Via WebSocket; additions/removals broadcast instantly.

### 5.5 Order Submission and Tracking

- Only the **Host** can submit the final order.
- Pre-submission review screen: itemized list, total, special instructions.
- Post-submission: order status tracked in real-time.
  - Statuses: `RECEIVED` -> `PREPARING` -> `READY` -> `SERVED` -> `COMPLETED`
- Guests see the status but cannot modify.

### 5.6 Waiter/Staff Dashboard

- **Live order feed**: New orders appear with sound/vibration alert.
- **Order cards**: Table number, items, special instructions, time elapsed.
- **Actions**: Mark status, cancel order (with reason).
- **Cannot edit items**: only view and cancel.
- Mobile-optimized (waiters use phones/tablets).

### 5.7 Restaurant Admin Dashboard

- **Menu Management**: CRUD for categories and items, image upload, pricing, availability toggle.
- **Table Management**: Add/edit/delete tables, regenerate QR codes.
- **Session Management**: View active sessions, reopen timed-out sessions, configure timeouts.
- **Order History**: Filterable by date, table, status. Revenue summaries.
- **Staff Management**: Add/remove waiter accounts.

---

## 6. Data Models

### Entity Relationship Diagram (Simplified)

```
+----------------+       +----------------+       +----------------+
|  Restaurant    |--1:N--|    Table        |--1:N--|   Session      |
+----------------+       +----------------+       +-------+--------+
                                                          |
                                                   +------+--------+
                                                   |               |
                                             1:N   |         1:N   |
                                                   v               v
                                          +--------------+  +------------+
                                          |SessionMember |  |   Order    |
                                          +--------------+  +------+-----+
                                                   |               |
                                                   |          1:N  |
                                                   |               v
+----------------+       +----------------+        |        +------------+
|     User       |--1:N--|  UserRole      |--------+        | OrderItem  |
+----------------+       +----------------+                 +------------+
                                                                   |
                               +----------------+                  |
                               |   MenuItem     |------------------+
                               +-------+--------+
                                       |
                               +-------+--------+
                               |   Category     |
                               +----------------+
```

### Key Models

#### User
```
id              UUID        PK
phone           VARCHAR(15) UNIQUE, NOT NULL
display_name    VARCHAR(50)
avatar_url      TEXT
created_at      TIMESTAMP
last_login_at   TIMESTAMP
is_blocked      BOOLEAN     DEFAULT false
```

#### Restaurant
```
id              UUID        PK
name            VARCHAR(100)
slug            VARCHAR(100) UNIQUE
address         TEXT
phone           VARCHAR(15)
logo_url        TEXT
config          JSONB       (session_timeout, max_guests, etc.)
created_at      TIMESTAMP
is_active       BOOLEAN
```

#### Table
```
id              UUID        PK
restaurant_id   UUID        FK -> Restaurant
label           VARCHAR(20) (e.g., "T1", "A5")
qr_code_url     TEXT
capacity        INT
is_active       BOOLEAN
```

#### Session
```
id              UUID        PK
table_id        UUID        FK -> Table
host_user_id    UUID        FK -> User
status          ENUM        (CREATED, ACTIVE, LOCKED, TIMED_OUT, SUBMITTED, IN_PROGRESS, COMPLETED, CLOSED)
allow_additions BOOLEAN     DEFAULT true
started_at      TIMESTAMP
expires_at      TIMESTAMP
closed_at       TIMESTAMP   NULLABLE
```

#### SessionMember
```
id              UUID        PK
session_id      UUID        FK -> Session
user_id         UUID        FK -> User
role            ENUM        (HOST, GUEST)
status          ENUM        (PENDING, APPROVED, REJECTED, LEFT)
joined_at       TIMESTAMP
```

#### Category
```
id              UUID        PK
restaurant_id   UUID        FK -> Restaurant
name            VARCHAR(50)
display_order   INT
icon            VARCHAR(50)
is_active       BOOLEAN
```

#### MenuItem
```
id              UUID        PK
category_id     UUID        FK -> Category
name            VARCHAR(100)
description     TEXT
price           DECIMAL(10,2)
image_url       TEXT
diet_type       ENUM        (VEG, NON_VEG, VEGAN, EGGETARIAN)
is_available    BOOLEAN
customizations  JSONB       (e.g., spice level, size options)
display_order   INT
```

#### Order
```
id              UUID        PK
session_id      UUID        FK -> Session
status          ENUM        (RECEIVED, PREPARING, READY, SERVED, COMPLETED, CANCELLED)
special_notes   TEXT
submitted_at    TIMESTAMP
submitted_by    UUID        FK -> User (host)
total_amount    DECIMAL(10,2)
cancelled_by    UUID        FK -> User NULLABLE
cancel_reason   TEXT        NULLABLE
```

#### OrderItem
```
id              UUID        PK
order_id        UUID        FK -> Order
menu_item_id    UUID        FK -> MenuItem
added_by        UUID        FK -> User
quantity        INT
unit_price      DECIMAL(10,2)
customizations  JSONB
notes           TEXT
```

---

## 7. API Contract

All API endpoints are served by the **FastAPI backend** (`MehfilCart` repository). The frontend
consumes these as a REST client. The API is versioned under `/api/v1/`.

### Authentication Endpoints

| Method | Endpoint                     | Description                |
|--------|------------------------------|----------------------------|
| POST   | `/api/v1/auth/request-otp`   | Send OTP to phone number   |
| POST   | `/api/v1/auth/verify-otp`    | Verify OTP, return JWT     |
| POST   | `/api/v1/auth/refresh`       | Refresh access token       |
| POST   | `/api/v1/auth/logout`        | Invalidate refresh token   |

### Session Endpoints

| Method | Endpoint                                       | Description                          |
|--------|------------------------------------------------|--------------------------------------|
| POST   | `/api/v1/sessions`                             | Create new session (Host)            |
| GET    | `/api/v1/sessions/{id}`                        | Get session details                  |
| PATCH  | `/api/v1/sessions/{id}`                        | Update session (lock, toggle adds)   |
| POST   | `/api/v1/sessions/{id}/join`                   | Request to join session              |
| PATCH  | `/api/v1/sessions/{id}/members/{member_id}`    | Approve/reject join request          |
| POST   | `/api/v1/sessions/{id}/reopen`                 | Reopen timed-out session (Admin)     |
| DELETE | `/api/v1/sessions/{id}`                        | Close/end session                    |

### Cart Endpoints

| Method | Endpoint                                        | Description                      |
|--------|------------------------------------------------|----------------------------------|
| GET    | `/api/v1/sessions/{id}/cart`                   | Get current cart                 |
| POST   | `/api/v1/sessions/{id}/cart/items`             | Add item to cart                 |
| PATCH  | `/api/v1/sessions/{id}/cart/items/{item_id}`   | Update quantity/customization    |
| DELETE | `/api/v1/sessions/{id}/cart/items/{item_id}`   | Remove item from cart            |

### Order Endpoints

| Method | Endpoint                            | Description                         |
|--------|-------------------------------------|-------------------------------------|
| POST   | `/api/v1/sessions/{id}/orders`      | Submit order from cart              |
| GET    | `/api/v1/orders`                    | List orders (filtered by role)      |
| GET    | `/api/v1/orders/{id}`               | Get order details                   |
| PATCH  | `/api/v1/orders/{id}/status`        | Update order status (Staff)         |
| POST   | `/api/v1/orders/{id}/cancel`        | Cancel order (Staff/Admin)          |

### Menu Endpoints

| Method | Endpoint                                       | Description                   |
|--------|------------------------------------------------|-------------------------------|
| GET    | `/api/v1/restaurants/{id}/menu`                | Get full menu                 |
| GET    | `/api/v1/restaurants/{id}/categories`          | Get categories                |
| POST   | `/api/v1/restaurants/{id}/menu/items`          | Create menu item (Admin)      |
| PATCH  | `/api/v1/menu/items/{id}`                      | Update menu item (Admin)      |
| DELETE | `/api/v1/menu/items/{id}`                      | Delete menu item (Admin)      |

### Admin Endpoints

| Method | Endpoint                            | Description                     |
|--------|-------------------------------------|---------------------------------|
| GET    | `/api/v1/admin/dashboard`           | Dashboard stats                 |
| GET    | `/api/v1/admin/tables`              | List tables                     |
| POST   | `/api/v1/admin/tables`              | Create table + generate QR      |
| PATCH  | `/api/v1/admin/tables/{id}`         | Update table                    |
| GET    | `/api/v1/admin/staff`               | List staff members              |
| POST   | `/api/v1/admin/staff`               | Add staff member                |
| DELETE | `/api/v1/admin/staff/{id}`          | Remove staff member             |
| PATCH  | `/api/v1/admin/config`              | Update restaurant config        |

---

## 8. Real-time Communication

### WebSocket Events

#### Server -> Client

| Event                       | Payload                      | Description                              |
|-----------------------------|------------------------------|------------------------------------------|
| `cart:item-added`           | `{ item, addedBy }`         | New item added to cart                   |
| `cart:item-removed`         | `{ itemId, removedBy }`     | Item removed from cart                   |
| `cart:item-updated`         | `{ item, updatedBy }`       | Item quantity/customization changed       |
| `session:member-joined`     | `{ member }`                | New member joined                        |
| `session:member-left`       | `{ memberId }`              | Member left the session                  |
| `session:join-request`      | `{ user }`                  | New join request (Host only)             |
| `session:status-changed`    | `{ status }`                | Session status update                    |
| `session:additions-toggled` | `{ allowed }`               | Host toggled additions                   |
| `session:timeout-warning`   | `{ remainingSeconds }`      | 5 min before expiry                      |
| `order:status-updated`      | `{ orderId, status }`       | Order status changed                     |
| `order:cancelled`           | `{ orderId, reason }`       | Order cancelled                          |

#### Client -> Server

| Event                      | Payload                                      | Description               |
|----------------------------|----------------------------------------------|---------------------------|
| `cart:add-item`            | `{ menuItemId, quantity, customizations }`   | Add item                  |
| `cart:remove-item`         | `{ cartItemId }`                             | Remove item               |
| `cart:update-item`         | `{ cartItemId, quantity }`                   | Update quantity           |
| `session:approve-member`   | `{ memberId }`                               | Approve join (Host)       |
| `session:reject-member`    | `{ memberId }`                               | Reject join (Host)        |

### Room Strategy

- Each session gets a WebSocket room: `session:{sessionId}`
- Staff gets a room per restaurant: `staff:{restaurantId}`
- Admin gets a room per restaurant: `admin:{restaurantId}`

---

## 9. Security and Validation

### Authentication Security

- OTP stored in Redis with TTL (5 min); never persisted to the database.
- Rate limiting on OTP requests (3 per phone per 15 min).
- JWT signed with RS256 (asymmetric keys).
- Refresh tokens stored in httpOnly, secure, sameSite cookies.
- CSRF protection via double-submit cookie pattern.

### Authorization Middleware (Backend)

```
Every API request passes through:
  1. JWT Verification       -> Is the token valid?
  2. User Resolution        -> Load user from DB/cache.
  3. Role Check             -> Does the user's role permit this action?
  4. Resource Ownership     -> Does the user own/belong to this session/restaurant?
  5. Session State Check    -> Is the session in a valid state for this action?
```

### Input Validation

- All inputs validated server-side using Pydantic schemas (FastAPI).
- Phone numbers validated against E.164 format.
- Parameterized queries only (no raw SQL).
- File uploads: type checking, size limits.

### Session Security

- Session IDs are UUIDs (not sequential).
- Table IDs in QR codes are signed to prevent tampering.
- Sessions auto-expire; no indefinite open sessions.
- WebSocket connections authenticated via JWT handshake.

---

## 10. Deployment and Infrastructure

### Phase 1 (MVP / Development)

- **Frontend**: Local dev with `next dev`, deploy to **Vercel**.
- **Backend**: Local FastAPI with `uvicorn`, deploy to **Railway** or **Render**.
- **Database**: Railway PostgreSQL or Supabase.
- **Redis**: Upstash Redis (serverless, free tier).
- **OTP**: MSG91 / Twilio (sandbox mode initially).

### Phase 2 (Production)

- **Frontend**: Vercel with Edge functions.
- **Backend**: Dockerized FastAPI, deployed to AWS ECS or Railway.
- **Database**: AWS RDS PostgreSQL or Supabase Pro.
- **Redis**: AWS ElastiCache or Upstash Pro.
- **CDN**: Vercel Edge / CloudFront for static assets.
- **Monitoring**: Sentry (errors), Datadog (infrastructure).

---

## 11. Phased Implementation Roadmap

### Phase 1 -- Foundation (Weeks 1-3)

- [x] Backend project initialization (FastAPI + Uvicorn + uv)
- [x] Frontend project initialization (Next.js + React + ESLint)
- [ ] Backend: database models, migrations (SQLAlchemy + Alembic)
- [ ] Frontend: design system (CSS tokens, typography, color palette)
- [ ] Frontend: UI primitives (Button, Input, Modal, Badge, Spinner, Toast)
- [ ] Frontend: landing page (mobile-first)
- [ ] Frontend: auth flow screens (Login, OTP Verification -- UI only, mock API)
- [ ] Frontend: basic layout components (Header, BottomNav)

### Phase 2 -- Guest Experience (Weeks 4-6)

- [ ] Frontend: QR landing page (`/join/[restaurantId]/[tableId]`)
- [ ] Frontend: menu browsing with category tabs, search, filters
- [ ] Frontend: cart view with user attribution
- [ ] Frontend: session timer component
- [ ] Frontend: host controls (toggle additions, manage members)
- [ ] Frontend: mock data integration for all guest screens

### Phase 3 -- Backend API (Weeks 7-9)

- [ ] Backend: auth API (OTP request/verify, JWT issuance)
- [ ] Backend: session CRUD API
- [ ] Backend: cart API (CRUD items)
- [ ] Backend: menu API (read-only for guests, CRUD for admin)
- [ ] Backend: WebSocket integration for cart/session events
- [ ] Backend: admin and staff API endpoints

### Phase 4 -- Integration and Staff (Weeks 10-12)

- [ ] Frontend: connect to live backend APIs (replace mocks)
- [ ] Frontend: WebSocket integration
- [ ] Frontend: order submission + tracking flow
- [ ] Frontend: staff order feed (live dashboard)
- [ ] Frontend: staff order actions (status update, cancel)

### Phase 5 -- Admin and Polish (Weeks 13-15)

- [ ] Frontend: admin dashboard (stats, charts)
- [ ] Frontend: menu management CRUD screens
- [ ] Frontend: table management + QR display
- [ ] Frontend: session management (view, reopen, configure)
- [ ] Frontend: staff account management
- [ ] Frontend: settings page (session configs)

### Phase 6 -- Hardening and Launch (Weeks 16-18)

- [ ] End-to-end testing (Playwright)
- [ ] Security audit: OWASP top 10 checks
- [ ] Performance optimization: Lighthouse score > 90
- [ ] PWA setup: service worker, offline fallback, install prompt
- [ ] Production deployment
- [ ] Monitoring and alerting setup

---

## 12. Companion Documents

| Document                    | Location                                         | Scope                                        |
|-----------------------------|--------------------------------------------------|----------------------------------------------|
| **Frontend Architecture**   | `MehfilCartUI/docs/FRONTEND_ARCHITECTURE.md`     | Next.js project structure, components, state |
| **Backend Architecture**    | `MehfilCart/docs/BACKEND_ARCHITECTURE.md`         | FastAPI project structure, models, services  |

---

## Future Considerations (Post-MVP)

- **Payment Integration**: Online payment split per user.
- **Multi-restaurant Support**: Platform marketplace model.
- **Order History**: Past orders, re-order functionality.
- **Loyalty/Rewards**: Points system, repeat customer discounts.
- **AI Recommendations**: "Others at your table also liked..." suggestions.
- **Analytics Dashboard**: Heatmaps of popular items, peak hours, avg session time.
- **Multi-language Support**: i18n for Hindi, English, regional languages.
- **Accessibility**: WCAG 2.1 AA compliance.
- **Push Notifications**: Web push for order status updates.
