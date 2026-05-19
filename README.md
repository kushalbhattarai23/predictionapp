# 🎯 Track Hub

Track Hub is a modular, full-stack productivity platform that combines media tracking, personal finance, group expense splitting, household management, inventory, quick commerce, QA bug tracking, image management, and administration tools in one app.

- 📺 **TV Universe Tracker** – Track shows, episodes, and fictional universes.
- 💰 **Finance Hub** – Manage wallets, transactions, budgets, reports, credits, transfers, scheduled payments, and balance reconciliation.
- 🎬 **Movie Tracker** – Organize watchlists, watched history, ratings, and notes.
- 🌌 **Shared Universe** – Combine Movies & TV Shows into unified cross-media timelines (e.g., MCU, Star Wars).
- 🧾 **SettleBill** – Split bills with groups, track balances, settle debts, share final calculations via public links, and manage wallet images per member.
- 🏠 **Household Ledger** – Manage shared household expenses, recurring bills, member balances, and balance summaries with settlement suggestions.
- 📦 **Inventory Tracker** – Track physical inventory, stock levels, purchases, consumption, and low-stock alerts.
- ⚡ **QuickCommerce** – 10-minute hyperlocal delivery e-commerce powered by the Inventory Tracker with OpenStreetMap-based rider tracking.
- 🖼️ **Images** – Personal media gallery with albums, favorites, and file management.
- 🐛 **QA Bug Tracker** – Kanban boards, workspaces, test cases (spreadsheet-style), and test coverage analytics.
- 🛠️ **Admin & Platform Tools** – Manage users/content, review requests, import movies, configure app access, and manage QC operations.

🌐 [Live Demo](https://aitrackerhub.netlify.app)

---

## ✨ Complete Functionality Overview

## 1) Authentication & Account
- Email/password sign up and login
- Google OAuth sign-in
- Password reset flow
- Protected routes for authenticated modules
- User profile management (name, avatar, password)
- Role-aware access (user/admin) via dedicated `user_roles` table
- Per-user data isolation with Supabase Row-Level Security (RLS)

## 2) Public Discovery (No Login Required)
- Browse public TV shows
- Open public show detail pages
- Browse public universes
- Open public universe detail pages
- Browse public shared universes (mixed movie + TV timelines)
- Browse and view public movie universes
- View shared final calculation pages (SettleBill public links)
- SEO/legal support pages: Terms, Privacy Policy, Sitemap

## 3) TV Shows Module
- Dashboard for TV tracking
- Personal show library (**My Shows**)
- Show detail pages with season/episode progress
- Episode watch/unwatch tracking
- Universe management and timeline-style organization
- Private universes for personal organization
- Public TV shows and public universe browsing from inside the TV module
- Universe dashboard views

## 4) Finance Module

### Wallets
- Create and manage multiple wallets/accounts
- Wallet detail pages with transaction history
- Wallet analytics with spending/income trends
- Multi-currency support (NPR, USD, etc.)

### Transactions
- Add/edit/delete transactions
- Batch/multiple transaction entry
- Categorize income and expenses
- Track cashflow over time
- OCR-based transaction extraction via Supabase Edge Functions

### Categories
- Category list and management
- Category detail view with spending breakdown

### Transfers
- Record transfers between wallets/accounts

### Budgets
- Create category budgets
- Compare planned vs actual spending

### Credits (Loans)
- Track money lent/borrowed
- Repayment and outstanding balance tracking

### Scheduled Payments
- Configure recurring/scheduled expenses, income, and transfers
- Automatic execution with notification support

### Balance Month (Reconciliation)
- Wallet balance reconciliation across time periods
- Compare opening (1st day) and closing (last day) balances per month
- Auto-calculated totals across all wallets
- Balance consistency checks (closing → opening mismatch detection)
- Dual calendar support: Nepali (Baishak, Jestha, etc.) and Gregorian (Jan, Feb, etc.)
- Pull balances from existing wallet transactions and transfers

### Reports & Insights
- Finance reports and chart-based summaries
- Spending trend views by period/category
- Nepali date-based reports
- Month-vs-month comparison

### Organization/Company Context
- Company/organization-level finance pages
- Collaboration-ready structure via organization provider

### Notifications
- Finance/system notifications page
- Real-time notification bell with unread count

### Export
- CSV and Excel export utilities for finance data

## 5) Movie Tracker Module
- Movie dashboard with stats, recently watched, and chart visualizations
- Personal movie library (**My Movies**) with status filters (Watchlist, Watching, Watched, Dropped)
- Movie detail pages with poster, metadata, rating, notes, and watch status
- Mark movies as watched/unwatched from any page
- Personal ratings (1–10 star input) and notes/reviews
- Favorite toggle and rewatch count tracking
- **Movie Universe system** – organize movies into franchise timelines (e.g., MCU, Star Wars)
  - Create, edit, delete universes (public or private)
  - Add/remove movies and arrange in timeline order
  - Universe detail page with watch progress bar, analytics charts (status breakdown, genre distribution, rating distribution), and per-movie watched toggle
  - View button on public universes for easy access
- Universe membership display on movie detail pages with direct links
- Add movies to universes directly from the movie detail page
- Public movie discovery and public universe browsing with view action
- Movie analytics page (watched per year, genre breakdown, rating distribution via Recharts)
- CSV import with downloadable sample template and manual entry support
- Filter by status, genre, year, universe, and rating

## 6) Shared Universe Module
- **Cross-media universe system** – combine Movies and TV Shows into unified timelines
- Shared Universe Dashboard with stats (total universes, public/private counts, media items)
- Create universes with title, description, visibility (public/private), and cover image
- Add movies and TV shows to a single timeline with custom ordering and phase grouping
- Timeline view organized by phases (e.g., Phase 1, Phase 2)
- Per-item watch status tracking and progress calculation
- Universe detail page with media timeline, poster thumbnails, and type badges
- Public shared universe browsing at `/public/shared-universes`
- Accessible from homepage, top navigation, and sidebar
- Example universes: MCU (Iron Man + Agent Carter + Loki), Star Wars (movies + Clone Wars + Rebels)

## 7) SettleBill Module
- SettleBill gated by app-level enablement
- Overview dashboard with totals and recent activity
- Networks (groups) list and creation page
- Network detail page with members management
- **Add multiple members at once** – bulk member entry form with add-row controls
- **Add members from existing networks** with search by name, email, or source network
- Invite members by email with pending invitation tracking
- Bills list, create, detail, and edit pages
- Standard bills with payer, participants, total amount, currency, and optional discount
- **Itemized bill creation** with per-item member assignments and quantity-based distribution
  - Distribution dialog with presets (0, 0.25, 0.5, 1) and colored member badges
  - Optional bill image upload with OCR-based item extraction (Supabase Edge Function)
- Mark individual splits as paid/unpaid; auto-settle bill when all splits are cleared
- Debt simplification page (who should pay whom — minimum transactions)
- **Transitive settlement payments** – marking a simplified payment (e.g., A → C) automatically
  resolves the underlying chain (A → B and B → C) by walking the debt graph (BFS pathfinding)
  and greedily settling intermediate splits
- **Final amount calculation** with detailed breakdown:
  - Per-member item subtotals with quantity/rate breakdowns
  - Payable/receivable summary
  - Optimized settlement suggestions (minimum transactions)
  - Aggregates data across **all bills** in the network (not just the first)
- **Public link sharing** for final calculations with:
  - Attached bill images (upload new, select from existing, gallery, or wallet images)
  - Member avatar display
  - Currency formatting
  - Shareable URL with copy-to-clipboard
  - Public final calculation page renders all network bills, not just the first
- **Final Calculations management page** (`/settlebill/final-calculations`)
  - Lists every public link the current user has created across all their networks
  - Search, copy URL, open in new tab, and delete share links
- **Member wallet images** – upload and manage payment QR/wallet images per member
  - Cross-network wallet image discovery (images follow members across networks by email)
  - Payer-only wallet image filtering in final calculation
- **Bulk settlement actions** – mark all splits between a debtor/creditor pair as paid/unpaid
- SettleBill settings page (currency, display preferences, CSV import/export)
- OCR-ready backend support via Supabase Edge Functions (`extract-bill-ocr`)

## 8) Household Ledger Module
- Create and manage households (networks)
- Household dashboard with quick-access navigation
- Monthly ledger with edit/delete support for entries
- **Balance summary** with:
  - Per-member total paid vs total owed tracking
  - Net balance calculation (positive = owed money, negative = owes money)
  - Suggested settlements (minimum transactions algorithm)
- Recurring expenses with manual execution
- Household-specific categories management
- Activity feed / audit log
- Analytics with spending breakdowns
- Per-household currency settings
- **CSV import** with downloadable sample template (title, amount, paid_by_email, date, notes)

## 9) Inventory Tracker Module
- Inventory dashboard with total items, low-stock alerts, total value, and category distribution chart
- Full CRUD for inventory items (add, edit, delete, archive)
- Item fields: name, category, quantity, unit, min stock threshold, purchase price, selling price, location, expiry date, notes
- **Sellable items** – mark items as available for delivery (QuickCommerce integration)
  - Selling price, discount price, product description, images, and tags
  - Max order quantity configuration
- Store management (multiple stores with address and color coding)
- Inventory categories management (create, edit, delete with color/icon)
- Stock transaction history (stock added, consumed, adjusted, transferred, sold)
- Automatic quantity adjustment on transaction creation
- Low-stock alerts displayed on dashboard
- Analytics with value-by-category, stock distribution, and consumption trends (Recharts)
- Currency selection in inventory settings
- CSV export for items and transactions
- **CSV import** with downloadable sample template (name, quantity, unit, min_stock, purchase_price, location, notes)
- Household integration support (shared inventory per household)

## 10) QuickCommerce Module (10-Minute Delivery)
- Customer storefront with product grid, search, category filter, and stock indicators
- Product detail pages with images, price, discount, quantity selector, and add-to-cart
- Shopping cart with quantity management, stock validation, and subtotal calculation
- Checkout with address entry, map-based location selection (Leaflet/OpenStreetMap), and delivery eligibility check (3km radius)
- Order tracking page with live rider location on map, delivery progress, and status updates
- Order history for customers
- Rider dashboard with assigned deliveries, status updates, and navigation map
- Rider GPS tracking with 5-second location updates
- Admin order management with status updates and rider assignment
- Admin rider management (create riders, toggle availability, track location)
- Admin dispatch page with live map showing riders, orders, and store locations
- Admin store settings with map-based store location management and currency selector
- QC analytics dashboard with orders/day, revenue trend, status distribution, and avg order value (Recharts)
- Automatic inventory deduction on order confirmation (SALE transaction type)
- Delivery eligibility based on Haversine distance calculation
- Order statuses: pending → confirmed → preparing → rider_assigned → picked_up → on_the_way → delivered / cancelled

## 11) Images Module
- Personal image gallery with grid view
- Upload images to Supabase Storage
- Album management (create, organize, set cover image)
- Favorite/unfavorite images
- Public/private album visibility
- Image selection for use in other modules (SettleBill bill attachments, wallet images)

## 12) QA Bug Tracker Module
- QA dashboard with workspace overview
- **Workspaces** – create and manage QA workspaces with member access control
  - Invite members and manage roles
  - Workspace detail page with boards, test cases, and coverage links
- **Kanban boards** – visual bug tracking with drag-and-drop-ready lists
  - Create boards per workspace
  - Add/edit/delete lists and cards
  - Card modal with full details: title, description, priority, severity, bug type, environment, module, labels, due date
  - Steps to reproduce, expected/actual results
  - Card comments and attachments (file upload to Supabase Storage)
  - Card activity log
  - Assign cards to workspace members
- **Test Cases** – spreadsheet-style test case management
  - Columns: ID, title, module, steps, expected result, actual result, status, priority
  - Inline editing with `Enter` to save and `Ctrl+Enter` for newline
  - Status tracking: Pass, Fail, Blocked, Not Run
  - Filter by module and status
  - Live coverage bar in header (pass rate calculation)
  - Landing page with workspace selection
- **Test Coverage** – module-level test coverage analytics
  - Per-module pass rate with progress bars
  - Execution rate tracking
  - Overall workspace coverage summary
  - Landing page with workspace selection

## 13) Requests & Feedback
- Dedicated requests page for feature requests / content requests

## 14) Admin Module
- Admin dashboard
- Admin users management page
- Admin content management page
- Admin add-show workflow
- Admin public tools page
- **Admin movie import** – bulk import movies from the admin panel
- **QC admin pages** – orders, riders, dispatch, store settings, and analytics

## 15) Platform & UX Capabilities
- Modular app architecture (apps can be enabled/disabled per user via settings)
- Theme support (dark/light) with system preference detection
- Responsive layout with shared app shell (sidebar + bottom navigation + top header navigation)
- Secondary bottom navigation for sub-module pages
- Toast notifications for user feedback (Sonner)
- Query caching/state management with React Query
- Native mobile support with Capacitor (Android project included)
- Native app handler + deep-link support hooks
- Push notification integration hooks
- Multi-currency support with user preferences
- Nepali date converter integration
- OpenStreetMap integration with Leaflet for maps and geolocation
- SEO support with React Helmet Async and dynamic page metadata from database
- Organization/company switcher for multi-tenant contexts

---

## 🧰 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack React Query
- React Hook Form + Zod resolvers
- Recharts for analytics
- React Helmet Async for SEO
- Leaflet + react-leaflet for OpenStreetMap integration
- Framer Motion (animations)
- Sonner (toast notifications)

### Backend / Data
- Supabase (PostgreSQL, Auth, RLS, Storage)
- Supabase Edge Functions (OCR, transaction extraction)
- Row-Level Security with helper functions (`has_role`, `is_active_member`, `is_network_admin`, etc.)

### Mobile
- Capacitor (Android)

### Tooling
- ESLint
- TypeScript
- PostCSS + Tailwind pipeline

---

## 📂 Project Structure

```text
/
├── public/                     # Static assets
├── android/                    # Capacitor Android project
├── supabase/                   # Migrations, SQL, edge functions
│   └── functions/              # Edge functions (OCR, etc.)
├── src/
│   ├── apps/
│   │   ├── admin/              # Admin app pages/components
│   │   ├── authentication/     # Login/signup/profile/settings pages
│   │   ├── finance/            # Finance module (dashboard, transactions, wallets, budgets, balance-month, etc.)
│   │   ├── household/          # Household ledger module (ledger, balance, recurring, analytics, settings, CSV import)
│   │   ├── images/             # Images module (gallery, albums, favorites)
│   │   ├── movies/             # Movies module (dashboard, library, universes, analytics, import)
│   │   ├── public/             # Public discovery module
│   │   ├── inventory/          # Inventory tracker module (dashboard, items, categories, transactions, analytics, settings, CSV import)
│   │   ├── qa/                 # QA Bug Tracker module (workspaces, boards, kanban, test cases, test coverage)
│   │   ├── quick-commerce/     # QuickCommerce module (storefront, cart, checkout, orders, rider tracking, admin, analytics)
│   │   ├── settlebill/         # SettleBill module (networks, bills, itemized, simplify, final calculation, public sharing)
│   │   ├── shared-universe/    # Shared Universe module (cross-media timelines combining movies + TV shows)
│   │   └── tv-shows/           # TV tracker module (shows, universes, episodes)
│   ├── components/             # Shared UI and layout components
│   │   ├── Layout/             # App shell (sidebar, header, footer, bottom nav)
│   │   ├── Auth/               # Auth guards (RequireAuth, RequireAdmin, RequireSettleBillEnabled)
│   │   ├── notifications/      # Notification bell and badges
│   │   ├── ui/                 # shadcn/ui component library
│   │   └── admin/              # Admin-specific components
│   ├── config/                 # App/route configs, currencies
│   ├── contexts/               # Theme, organization providers
│   ├── hooks/                  # Data and behavior hooks (50+)
│   ├── integrations/           # External integrations (Supabase client + types)
│   ├── lib/                    # Shared library helpers
│   ├── pages/                  # Global pages (landing, legal, admin routes)
│   ├── types/                  # Type definitions
│   ├── utils/                  # Utility helpers (CSV, Excel, date converter, slugify, type adapters)
│   ├── App.tsx                 # Main route map
│   └── main.tsx                # App entry point
├── capacitor.config.ts         # Capacitor configuration
├── package.json
└── README.md
```

---

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables (create `.env` based on project needs):
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```
4. Run development server:
   ```bash
   npm run dev
   ```

### Useful Commands
- `npm run dev` – Start local development server
- `npm run build` – Build production bundle
- `npm run build:dev` – Build with development mode
- `npm run lint` – Run ESLint
- `npm run preview` – Preview production build locally

---

## 📄 License

This project is open source and available under the MIT License.
