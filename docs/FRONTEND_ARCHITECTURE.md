# MehfilCart -- Frontend Architecture

> **Repository:** `MehfilCartUI`
> **Version:** 0.2.0-draft
> **Last Updated:** 2026-02-21
> **Status:** Planning Phase

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Routing and Page Layout](#4-routing-and-page-layout)
5. [Component Architecture](#5-component-architecture)
6. [State Management](#6-state-management)
7. [API Client Layer](#7-api-client-layer)
8. [Real-time Integration](#8-real-time-integration)
9. [Authentication Flow](#9-authentication-flow)
10. [Design System](#10-design-system)
11. [Key UI Screens](#11-key-ui-screens)
12. [Error Handling](#12-error-handling)
13. [Performance Considerations](#13-performance-considerations)
14. [Testing Strategy](#14-testing-strategy)
15. [Frontend-Specific Roadmap](#15-frontend-specific-roadmap)

---

## 1. Overview

The MehfilCart frontend is a **Next.js 16** web application built with **React 19**. It is a
mobile-first progressive web app (PWA) that serves three distinct user audiences:

1. **Guests**: Scan QR, join sessions, browse menus, add items to the collaborative cart.
2. **Waitstaff**: View live incoming orders, update order status, cancel orders.
3. **Admins**: Manage menus, tables, sessions, staff, and view analytics.

The frontend is a **pure UI consumer**. All business logic, authorization enforcement, and
data persistence are handled by the backend (`MehfilCart` -- FastAPI). The frontend's role
is to present data, capture user intent, and relay it to the API.

### Responsibility Boundary

| Concern                        | Frontend  | Backend  |
|--------------------------------|:---------:|:--------:|
| UI rendering and interaction   | Yes       | --       |
| Input format validation        | Yes       | Yes      |
| Authorization enforcement      | --        | Yes      |
| UI-level visibility (show/hide)| Yes       | --       |
| Business logic execution       | --        | Yes      |
| Session timeout enforcement    | --        | Yes      |
| Session timer display          | Yes       | --       |
| Real-time event handling       | Yes       | Yes      |
| Token storage (access)         | Yes       | --       |
| Token issuance and validation  | --        | Yes      |

---

## 2. Technology Stack

| Category           | Technology                | Notes                                     |
|--------------------|---------------------------|--------------------------------------------|
| Framework          | Next.js 16 (App Router)   | File-based routing, SSR/SSG, API routes    |
| UI Library         | React 19                  | Component model, hooks                     |
| Styling            | Vanilla CSS + CSS Modules | Scoped styles, no external CSS framework   |
| State Management   | Zustand                   | Lightweight global state for auth, session, cart |
| Server State       | React Query (TanStack)    | API data fetching, caching, background refetch |
| WebSocket Client   | Native WebSocket / Socket.IO client | Real-time session/cart events      |
| HTTP Client        | Native `fetch`            | Wrapped in a thin API client utility       |
| Linting            | ESLint + eslint-config-next | Code quality                             |
| Package Manager    | npm                       | Lock file: `package-lock.json`             |
| Node.js            | v22.x (Maintenance LTS)  | Runtime for dev server and build           |

---

## 3. Project Structure

```
MehfilCartUI/
|-- docs/
|   |-- ARCHITECTURE.md              # System-level architecture (shared)
|   +-- FRONTEND_ARCHITECTURE.md     # This document
|
|-- public/                           # Static assets (favicon, images)
|
|-- src/
|   |-- app/                          # Next.js App Router pages
|   |   |-- layout.js                 # Root layout (providers, fonts, meta)
|   |   |-- page.js                   # Landing page
|   |   |-- globals.css               # Global design tokens and resets
|   |   |
|   |   |-- (auth)/
|   |   |   |-- login/page.js         # Phone number entry
|   |   |   +-- verify/page.js        # OTP verification
|   |   |
|   |   |-- join/
|   |   |   +-- [restaurantId]/
|   |   |       +-- [tableId]/
|   |   |           +-- page.js       # QR code landing -> session create/join
|   |   |
|   |   |-- session/
|   |   |   +-- [sessionId]/
|   |   |       |-- layout.js         # Session layout (timer bar, header)
|   |   |       |-- page.js           # Session home (cart overview)
|   |   |       |-- menu/page.js      # Browse and add items
|   |   |       |-- cart/page.js      # Collaborative cart view
|   |   |       |-- order/page.js     # Order status tracking
|   |   |       +-- members/page.js   # Manage join requests (Host only)
|   |   |
|   |   |-- staff/
|   |   |   |-- layout.js             # Staff layout
|   |   |   |-- orders/page.js        # Live order feed
|   |   |   +-- orders/[orderId]/page.js  # Order detail
|   |   |
|   |   +-- admin/
|   |       |-- layout.js             # Admin layout (sidebar navigation)
|   |       |-- page.js               # Dashboard
|   |       |-- menu/page.js          # Menu management
|   |       |-- tables/page.js        # Table management
|   |       |-- sessions/page.js      # Active sessions
|   |       |-- orders/page.js        # Order history
|   |       |-- staff/page.js         # Staff management
|   |       +-- settings/page.js      # Restaurant configuration
|   |
|   |-- components/
|   |   |-- ui/                       # Primitives: Button, Input, Modal, Badge, Spinner, Toast
|   |   |-- layout/                   # Header, Sidebar, BottomNav, PageContainer
|   |   |-- menu/                     # MenuCard, CategoryTabs, SearchBar, DietBadge
|   |   |-- cart/                     # CartItem, CartSummary, UserBadge
|   |   |-- order/                    # OrderCard, StatusBadge, Timeline
|   |   |-- session/                  # SessionTimer, MemberList, JoinRequestCard
|   |   +-- admin/                    # AdminTable, StatCard, Charts
|   |
|   |-- hooks/
|   |   |-- useAuth.js                # Auth operations (OTP request, verify, logout)
|   |   |-- useCart.js                # Cart CRUD operations
|   |   |-- useSession.js            # Session create, join, manage
|   |   |-- useSocket.js             # WebSocket lifecycle management
|   |   +-- useTimer.js              # Countdown timer for session expiry display
|   |
|   |-- lib/
|   |   |-- api.js                    # Thin fetch wrapper with auth header injection
|   |   |-- socket.js                 # WebSocket client setup and event helpers
|   |   +-- utils.js                  # Formatting, display helpers
|   |
|   |-- stores/
|   |   |-- authStore.js              # Zustand: user, accessToken, isAuthenticated
|   |   |-- sessionStore.js           # Zustand: active session, members, timer
|   |   +-- cartStore.js             # Zustand: cart items with user attribution
|   |
|   +-- constants/
|       |-- roles.js                  # Role enums (labels only, for UI visibility)
|       |-- statuses.js               # Session and order status enums (display values)
|       +-- config.js                 # Frontend config (API URL, socket URL)
|
|-- .gitignore
|-- eslint.config.mjs
|-- jsconfig.json
|-- next.config.mjs
|-- package.json
+-- package-lock.json
```

---

## 4. Routing and Page Layout

### Route Groups

| Route Group         | Purpose                      | Layout                         |
|---------------------|------------------------------|--------------------------------|
| `(auth)/`           | Login and OTP verification   | Minimal (no nav bars)          |
| `join/`             | QR code landing              | Minimal (welcome screen)       |
| `session/`          | Guest experience             | Session layout (timer + nav)   |
| `staff/`            | Waiter/staff dashboard       | Staff layout (top bar)         |
| `admin/`            | Restaurant admin panel       | Admin layout (sidebar + top)   |

### Layout Hierarchy

```
Root Layout (layout.js)
  |-- Providers (Auth, QueryClient, Socket)
  |-- Font loading (Google Fonts)
  |-- Global meta tags
  |
  |-- (auth) Layout
  |   +-- Minimal chrome, centered card
  |
  |-- Session Layout (session/[sessionId]/layout.js)
  |   |-- Session timer bar (top)
  |   |-- Header with session info
  |   +-- Bottom navigation (Menu | Cart | Order | Members)
  |
  |-- Staff Layout (staff/layout.js)
  |   |-- Top bar with restaurant name
  |   +-- Content area
  |
  +-- Admin Layout (admin/layout.js)
      |-- Collapsible sidebar navigation
      |-- Top bar with user info
      +-- Content area
```

---

## 5. Component Architecture

### Design Principles

1. **Presentational vs Container**: Components are either UI-only (presentational) or data-aware
   (containers that use hooks). Keep them separated where possible.
2. **Single Responsibility**: Each component does one thing well.
3. **CSS Modules**: Each component gets its own `.module.css` file for scoped styling.
4. **No inline styles**: All styling through CSS classes.
5. **Prop-driven**: Components are configured through props, not internal logic.

### Component Categories

#### UI Primitives (`components/ui/`)
Generic, reusable building blocks with no domain knowledge.
- `Button` -- primary, secondary, ghost, danger variants; loading state
- `Input` -- text, phone, OTP; with label, error message
- `Modal` -- overlay dialog with header, body, footer
- `Badge` -- status indicators, count badges
- `Spinner` -- loading indicator
- `Toast` -- notification messages (success, error, warning, info)
- `Avatar` -- user initials or image
- `Card` -- container with optional header/footer

#### Layout Components (`components/layout/`)
Structural components used for page framing.
- `Header` -- app title, back button, action buttons
- `BottomNav` -- mobile tab navigation for session pages
- `Sidebar` -- collapsible navigation for admin
- `PageContainer` -- max-width wrapper with padding

#### Domain Components (`components/menu/`, `cart/`, `order/`, `session/`, `admin/`)
Feature-specific components tied to business concepts.
- `MenuCard` -- item display with image, price, diet indicator, add button
- `CategoryTabs` -- horizontal scrolling category filter
- `CartItem` -- item in cart with quantity controls and user attribution
- `CartSummary` -- total, item count, submit button
- `OrderCard` -- order summary for staff view
- `StatusBadge` -- colored badge for order/session status
- `SessionTimer` -- countdown display with warning states
- `MemberList` -- list of session members with roles
- `JoinRequestCard` -- pending request with approve/reject actions

---

## 6. State Management

### Strategy

Three state categories are managed differently:

| Category         | Tool          | Purpose                                           |
|------------------|---------------|---------------------------------------------------|
| **Global UI**    | Zustand       | Auth state, active session, cart (needs to persist across pages) |
| **Server Data**  | React Query   | API responses with caching, refetching, pagination |
| **Local UI**     | React useState | Component-local state (modals, form inputs)        |

### Zustand Stores

#### `authStore.js`
```
State:
  user          -- Current user object (null if logged out)
  accessToken   -- JWT access token (in memory only)
  isAuthenticated -- Derived boolean
  isLoading     -- Auth operation in progress

Actions:
  setUser(user)
  setAccessToken(token)
  logout()
```

#### `sessionStore.js`
```
State:
  session       -- Active session object
  members       -- Array of session members
  timeRemaining -- Seconds until session expires (for display)

Actions:
  setSession(session)
  setMembers(members)
  addMember(member)
  removeMember(memberId)
  updateTimeRemaining(seconds)
  clearSession()
```

#### `cartStore.js`
```
State:
  items         -- Array of cart items: { id, menuItem, addedBy, quantity, customizations }

Actions:
  addItem(item)
  removeItem(itemId)
  updateQuantity(itemId, quantity)
  clearCart()

Computed:
  getTotal()        -- Sum of (price * quantity) for all items
  getItemsByUser()  -- Items grouped by addedBy user
```

---

## 7. API Client Layer

### Architecture

```
Components/Hooks
      |
      v
  React Query (useQuery / useMutation)
      |
      v
  api.js (fetch wrapper)
      |
      v
  Backend API (FastAPI at MehfilCart)
```

### `lib/api.js` Responsibilities

- Prepend the base URL from config.
- Set `Content-Type: application/json` by default.
- Inject the access token from `authStore` into the `Authorization` header.
- Parse JSON responses.
- On 401: attempt a silent token refresh via `/api/v1/auth/refresh`; retry original request.
- On failure: throw structured errors that React Query can handle.

### What the API Client Does NOT Do

- No authorization checks (the backend enforces those).
- No business logic (pure data transport).
- No caching (React Query handles that).

---

## 8. Real-time Integration

### Connection Lifecycle (managed by `useSocket` hook)

1. User authenticates -> `useSocket` opens a WebSocket connection with the JWT in handshake.
2. User enters a session -> hook emits `join:session` to subscribe to the session room.
3. Incoming events (`cart:item-added`, `session:member-joined`, etc.) update Zustand stores.
4. User leaves session -> hook emits `leave:session` and closes the room subscription.
5. User logs out -> WebSocket connection is fully closed.

### Event -> Store Mapping

| Incoming Event                | Store Updated        | Action                              |
|-------------------------------|----------------------|-------------------------------------|
| `cart:item-added`             | `cartStore`          | `addItem(payload.item)`             |
| `cart:item-removed`           | `cartStore`          | `removeItem(payload.itemId)`        |
| `cart:item-updated`           | `cartStore`          | `updateQuantity(...)`               |
| `session:member-joined`       | `sessionStore`       | `addMember(payload.member)`         |
| `session:member-left`         | `sessionStore`       | `removeMember(payload.memberId)`    |
| `session:status-changed`      | `sessionStore`       | `setSession(...)`                   |
| `session:additions-toggled`   | `sessionStore`       | Update session `allowAdditions`     |
| `session:timeout-warning`     | `sessionStore`       | `updateTimeRemaining(...)`          |
| `order:status-updated`        | React Query cache    | Invalidate order query              |
| `order:cancelled`             | React Query cache    | Invalidate order query              |

---

## 9. Authentication Flow

### User Flow

```
[Landing Page]
      |
      v
[Login Page] -- Enter phone number
      |
      v
[API: POST /auth/request-otp] -- Backend sends SMS
      |
      v
[Verify Page] -- Enter 6-digit OTP
      |
      v
[API: POST /auth/verify-otp] -- Returns { accessToken, user }
      |                          Sets refresh token as httpOnly cookie
      v
[authStore.setUser(user)]
[authStore.setAccessToken(token)]
      |
      v
[Redirect to session/join or dashboard based on entry context]
```

### Token Management

- **Access token**: Stored in Zustand (memory). Lost on page refresh (intentional).
- **Refresh token**: Stored as httpOnly secure cookie by the backend. Sent automatically.
- **On page load**: The app calls `/api/v1/auth/refresh` to recover the session silently.
- **On 401**: The API client intercepts, calls refresh, retries the original request once.

---

## 10. Design System

### Principles

- Mobile-first responsive design (breakpoints: 480px, 768px, 1024px).
- Dark mode support via CSS custom properties and `prefers-color-scheme`.
- Consistent spacing scale (4px base unit).
- Typography: Google Font (e.g., Inter or Outfit), with a clear hierarchy.

### CSS Custom Properties (defined in `globals.css`)

```
Categories of tokens to define:
  --color-*          : Primary, secondary, accent, surface, text, error, success, warning
  --font-*           : Family, size scale (xs through 2xl), weight, line-height
  --spacing-*        : 1 through 16 (multiples of 4px)
  --radius-*         : sm, md, lg, full
  --shadow-*         : sm, md, lg
  --z-*              : dropdown, modal, toast, overlay
  --transition-*     : fast, normal, slow
```

### Responsive Approach

- Base styles are mobile (< 480px).
- `@media (min-width: 480px)` for larger phones.
- `@media (min-width: 768px)` for tablets / staff devices.
- `@media (min-width: 1024px)` for admin desktop layouts.

---

## 11. Key UI Screens

| Screen                  | Route                                   | Primary Users    | Key Components                              |
|-------------------------|-----------------------------------------|------------------|---------------------------------------------|
| Landing                 | `/`                                     | All              | Hero, CTA buttons                           |
| Login                   | `/login`                                | All              | PhoneInput, Button                          |
| OTP Verification        | `/verify`                               | All              | OTPInput, Timer, Button                     |
| QR Landing              | `/join/[rid]/[tid]`                     | Guests           | SessionInfo, JoinButton                     |
| Menu Browser            | `/session/[sid]/menu`                   | Guests           | CategoryTabs, MenuCard, SearchBar           |
| Collaborative Cart      | `/session/[sid]/cart`                   | Guests           | CartItem, CartSummary, UserBadge            |
| Order Tracker           | `/session/[sid]/order`                  | Guests           | StatusBadge, Timeline                       |
| Member Management       | `/session/[sid]/members`                | Host             | MemberList, JoinRequestCard                 |
| Staff Order Feed        | `/staff/orders`                         | Waitstaff        | OrderCard, StatusBadge                      |
| Staff Order Detail      | `/staff/orders/[oid]`                   | Waitstaff        | OrderDetail, StatusControls                 |
| Admin Dashboard         | `/admin`                                | Admin            | StatCard, Charts                            |
| Admin Menu Management   | `/admin/menu`                           | Admin            | AdminTable, MenuForm                        |
| Admin Table Management  | `/admin/tables`                         | Admin            | AdminTable, QRGenerator                     |
| Admin Settings          | `/admin/settings`                       | Admin            | ConfigForm                                  |

---

## 12. Error Handling

### Strategy

| Error Type          | Handling                                                          |
|---------------------|-------------------------------------------------------------------|
| Network failure     | Toast notification + retry prompt; React Query auto-retry (3x)   |
| API 4xx errors      | Display error message from API response in the relevant form/card |
| API 401             | Silent token refresh; if refresh fails, redirect to login         |
| API 403             | Toast: "You do not have permission"; redirect if needed           |
| API 5xx errors      | Toast: "Something went wrong"; log to Sentry                     |
| WebSocket disconnect| Auto-reconnect with exponential backoff; show "Reconnecting..." banner |
| Form validation     | Inline field-level errors; prevent submission until valid         |

---

## 13. Performance Considerations

- **SSR/SSG**: Use static generation for menu pages (ISR with revalidation).
- **Code splitting**: Next.js automatic per-route code splitting.
- **Image optimization**: Next.js `<Image>` component for menu item images.
- **Lazy loading**: Dynamic imports for admin charts and heavy components.
- **Debounced search**: Prevent excessive API calls during menu search.
- **Optimistic updates**: Cart operations update the local store immediately; reconcile on API response.
- **Bundle size**: Avoid large dependencies; prefer lightweight libraries.

---

## 14. Testing Strategy

| Level              | Tool              | Coverage Target                              |
|--------------------|-------------------|----------------------------------------------|
| Unit tests         | Jest + RTL        | Utility functions, hooks, individual components |
| Integration tests  | Jest + RTL        | Page-level rendering with mocked API          |
| E2E tests          | Playwright        | Critical user flows (login, add to cart, order)|
| Visual regression  | Playwright screenshots | Key screens across viewports               |

---

## 15. Frontend-Specific Roadmap

### Phase 1: Foundation
- [ ] Design system: `globals.css` with all CSS custom properties
- [ ] UI primitives: Button, Input, Modal, Badge, Spinner, Toast, Avatar, Card
- [ ] Layout components: Header, BottomNav, Sidebar, PageContainer
- [ ] Landing page (mobile-first)
- [ ] Auth screens: Login and OTP Verification (UI only, mock data)

### Phase 2: Guest Experience
- [ ] QR landing page with session detection
- [ ] Menu browsing: CategoryTabs, MenuCard, SearchBar, DietBadge
- [ ] Cart view: CartItem, CartSummary, UserBadge grouping
- [ ] Session timer component
- [ ] Host controls: toggle additions, member management
- [ ] Mock data layer for all guest screens

### Phase 3: API Integration
- [ ] Install and configure Zustand and React Query
- [ ] Connect auth flow to backend API
- [ ] Connect menu, cart, session to backend API
- [ ] WebSocket integration for real-time events

### Phase 4: Staff and Admin
- [ ] Staff order feed (live dashboard)
- [ ] Staff order detail and status controls
- [ ] Admin dashboard with stats
- [ ] Admin menu, table, staff, session management screens
- [ ] Admin settings page

### Phase 5: Polish
- [ ] PWA setup (service worker, manifest, install prompt)
- [ ] Dark mode support
- [ ] Accessibility audit (keyboard nav, screen reader labels)
- [ ] Lighthouse optimization (target > 90)
- [ ] E2E test suite for critical flows
