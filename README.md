# Steamy Pot

Multi-role food ordering platform with React + Vite on the client and Node.js + Express + MongoDB + Socket.io on the server. Supports customers, restaurants, drivers, and admins with role-specific dashboards, order lifecycle management, and basic payment state tracking.

## Tech Stack
- Client: React 18, Vite, React Router, Axios, Socket.io client, TailwindCSS.
- Server: Node.js, Express, MongoDB via Mongoose, Socket.io, JWT auth, bcrypt password hashing, rate limiting, CORS, morgan logging.
- Transport: REST over HTTPS for most flows, Socket.io for realtime channels.

## Repo Layout
- `client/` – React app (routing, contexts, pages, Tailwind styles).
- `server/` – Express API, Socket.io gateway, MongoDB models, business logic.
- `server/scripts/seed.js` – optional seeding utility (run manually when needed).

## Getting Started
1) Prereqs: Node 18+ and access to a MongoDB database.
2) Server setup:
   - `cd server`
   - `npm install`
   - Create `.env` with:
     - `MONGO_URI=<mongodb connection string>`
     - `JWT_SECRET=<strong secret>`
     - `PORT=5000` (optional; defaults to 5000)
   - `npm run dev` (nodemon) or `npm start`.
3) Client setup:
   - `cd client`
   - `npm install`
   - `npm run dev` (defaults to http://localhost:5173). Vite proxies API calls to `/api`, so run the server alongside the client.
4) Build client for prod: `npm run build` then serve `client/dist` behind a reverse proxy that also forwards `/api` and `/socket.io` to the server.

## Core Concepts
- Roles: `user`, `restaurant`, `driver`, `admin` (self-signup allowed for user/restaurant/driver; admin is manual only).
- Auth: email/password with JWT (7d expiry). Tokens required for protected REST endpoints and for Socket.io handshake auth.
- Rate limiting: 100 requests / 15 minutes on `/api/*`.
- Validation & errors: shared `asyncHandler` wrapper plus `validateBody` middleware on key routes; centralized `errorHandler` and `notFound` handlers.

## Data Model Highlights
- User: email, password hash, role, approval flag (restaurants), cuisines/tags, deliveryFee, ETA, rating stats, isOpen (restaurants), isOnline (drivers), isBlocked.
- FoodItem: name, description, price, restaurantId.
- Cart: userId, restaurantId (enforces one-restaurant cart), items [{foodId, name, price, quantity}].
- Order: userId, restaurantId, items, totals (subtotal/discount/deliveryFee/total), offerCode, deliveryAddress, paymentMethod/status, paymentReference, driverId, driverAcceptance, status timeline (placed → confirmed → preparing → out_for_delivery → delivered/cancelled) with timestamps and history.
- Driver: userId, isOnline, currentOrderId.
- Addresses, Offers, Reviews exist in the controllers/models (see `server/models` and `server/controllers`).

## API Overview (base path `/api`)
- Auth (`/auth`): `POST /register`, `POST /login`.
- User (`/user`): `GET /profile`, `GET /orders`, CRUD addresses.
- Catalog (`/catalog`): public `GET /restaurants`, `GET /restaurants/:id/menu`, `GET /food`.
- Restaurant (`/restaurant`): restaurant-only menu CRUD, open/closed toggle, metrics.
- Cart (`/cart`): user-only add/update/remove items, fetch cart.
- Orders (`/orders`):
  - Users: `POST /` place order, `GET /` list own orders.
  - Restaurants: `GET /restaurant` list inbound, `POST /:id/restaurant/accept|reject`.
  - Status: `PATCH /:id/status` (role-checked), `PATCH /:id/assign-driver` (admin/restaurant).
- Driver (`/driver`): driver online toggle, get assigned orders, update status, accept/decline assignment; admin/restaurant can list available drivers.
- Offers (`/offers`): public list/validate; authenticated create/update.
- Reviews (`/reviews`): list restaurant reviews, create review, restaurant replies.
- Admin (`/admin`): paginate users/restaurants/orders/food; approve restaurants; edit/delete food; set roles; block/unblock users; platform metrics.
- Payments (`/payments`): user-only payment status/confirm/fail per order.
- Health: `GET /health` returns `{ status: "ok" }`.

## Frontend Routing
- Landing and auth: `/`, `/login`, `/register`.
- User-protected: `/restaurants`, `/restaurants/:id`, `/cart`, `/checkout`, `/orders`, `/profile`.
- Restaurant-protected: `/dashboard/restaurant`, `/dashboard/restaurant/orders`.
- Admin-protected: `/dashboard/admin`.
- Driver-protected: `/dashboard/driver`.
- `ProtectedRoute` guards routes by role; `AuthContext` hydrates user from `/user/profile` when a token exists; `ToastContext` centralizes toasts.

## Ordering & Delivery Flow (happy path)
1) User registers/logs in → token stored locally and attached on API + Socket.io.
2) User browses catalog (public) → adds items to cart → places order via `POST /orders`.
3) Restaurant sees incoming order (`GET /orders/restaurant`) → accepts/rejects → updates status through allowed transitions (see `utils/orderStatus.js`). `applyStatusTimestamps` stamps key transitions.
4) Admin/restaurant assigns a driver (`PATCH /orders/:id/assign-driver`), or drivers see assignments and accept/decline.
5) Driver sets online, updates delivery status (`/driver/orders/:id/status`); `releaseDriver` frees them when order closes.
6) Payments: start as `pending`; user can `confirm` (mark paid) or `fail` an order payment; COD supported via status only.
7) Users and restaurants can exchange reviews/replies per restaurant.

## Realtime
- Socket.io server initializes in `server/socket.js`; clients authenticate using the JWT in `auth` payload. Connections join two rooms: `user:{id}` and `role:{role}` for targeted broadcasting. (Event names/payloads are not yet defined in this repo—extend `initSocket` as needed.)

## Deployment Notes
- Serve client build and proxy `/api` and `/socket.io` to the Express server. Ensure environment secrets are injected server-side; client currently assumes same-origin API at `/api`.
- If Mongo or server endpoints change, update Vite proxy or `client/src/api/client.js` baseURL.

## Maintenance Tips
- Use `server/scripts/seed.js` for local bootstrap data (verify content before running).
- Keep JWT secret rotated and rate limits tuned for production traffic.
- Review role checks when adding new routes; unauthorized transitions are blocked via `VALID_TRANSITIONS` in `utils/orderStatus.js`.
