
The user wants a comprehensive plan to evolve the current mock dashboard into the real LiveShop SaaS product described in the project knowledge — a multi-tenant Channelize.io alternative with Supabase backend, MediaMTX streaming, e-commerce integrations, and creator simulcasting.

The current state is a static UI prototype (mock data in `dashboard-data.ts`). I need to plan the path from prototype → production-shaped app. Given the scope is huge (10+ Edge Functions, 9 tables, RLS, MediaMTX, OAuth, webhooks), I'll break it into phases the user can approve incrementally rather than dumping everything into one build.

## Comprehensive Implementation Plan

### Phase 0 — Foundation (Lovable Cloud + Auth)
Enable Lovable Cloud (Supabase). Set up:
- Auth: email + Google sign-in, sign-up/sign-in pages, protected route wrapper around `/` dashboard
- `profiles` table auto-created on signup via trigger
- `app_role` enum + `user_roles` table + `has_role()` security definer function (per role matrix: admin, workspace_admin, streamer, moderator, analyst, creator, viewer)
- Replace the always-on Index page with auth-gated routing

### Phase 1 — Multi-tenancy Schema
Migrations for core tables with RLS:
- `tenants` (slug, plan, branding, media_mtx creds)
- `workspaces` (tenant_id, slug, settings)
- `workspace_members` (workspace_id, user_id, role)
- Tenant/workspace context provider on the frontend (active workspace selector in TopBar replacing the mock dropdown)
- Auto-provision default tenant + workspace on first signup via Edge Function

### Phase 2 — Streams & Control Room (Real)
- `streams` table (workspace_id, status, media_mtx_path, viewer_count, simulcast_targets)
- `stream_products` table
- Edge Functions: `POST /streams/start`, `POST /streams/end`, `GET /media-mtx/auth`
- Wire `ShowsPage` to real CRUD; wire `ControlRoomPage` "Go Live" button to start endpoint and display real RTMP URL + stream key
- Video player component (Video.js + hls.js for HLS, fallback WebRTC) for viewer preview

### Phase 3 — Realtime Chat
- `chat_messages` table with RLS (read all, delete = moderators)
- Replace mock chat in Control Room with Supabase Realtime channel subscription
- Presence tracking for viewer count

### Phase 4 — Shoppable Videos & Storage
- `shoppable_videos` table + Supabase Storage bucket `{tenant_slug}/{workspace_slug}/`
- Wire `VideosPage` upload zone to real Storage upload with product markers JSON

### Phase 5 — E-commerce Integrations
- `ecommerce_integrations` table (encrypted credentials)
- Edge Functions: `POST /products/sync`, `POST /webhooks/shopify`, `POST /webhooks/woocommerce`
- Real product picker in Control Room sourced from synced catalog
- Cart link generator with attribution params

### Phase 6 — Creators & Simulcast
- `creator_accounts` table (encrypted OAuth tokens for YouTube/Twitch/FB/TikTok/Kick)
- OAuth connect flows via Edge Functions
- `POST /creator/simulcast/start` pushing RTMP to connected platforms
- Wire `SimulcastPage` to manage real destinations

### Phase 7 — API Keys & Workspace Invites
- `api_keys` table (hashed, scoped)
- Edge Functions: `POST /api-keys/generate`, `POST /workspaces/invite` (signed JWT email link)
- Wire Overview page API key UI + Hosts/Members management

### Phase 8 — Analytics & Polish
- `GET /creator/analytics` Edge Function aggregating cross-platform stats
- Replace mock OverviewPage stats with real queries
- Plan/quota enforcement (starter/pro/enterprise limits)

### Out of Scope for Lovable (note for user)
Per the knowledge file, these need external infra:
- **MediaMTX server** (RTMP ingest + HLS/WebRTC) — must be self-hosted with auth webhook pointing to our Edge Function
- **BullMQ + Upstash Redis** for transcoding/bulk sync queues
- **Ably** if chat exceeds 200 msg/sec
- **Stripe Connect** for creator commission payouts (can add via Lovable Stripe integration)

### Recommended Starting Point
Phase 0 + Phase 1 in the first build (auth + multi-tenancy + role system) — this is the foundation everything else depends on. Each subsequent phase is one approved build.

### Clarifying questions before I start
I'll ask the user which phase to tackle first and confirm a couple of decisions.
