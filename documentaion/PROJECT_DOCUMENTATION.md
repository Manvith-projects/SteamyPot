# Steamy Pot – Project Documentation

## 1. Introduction
- **Project Title:** Steamy Pot
- **Team Members:** _Add names/roles (e.g., Product, Frontend, Backend, QA)_

## 2. Project Overview
- **Purpose:** Multi-role food ordering and delivery platform (users, restaurants, drivers, admins) with ordering, real-time status tracking, payments, and reviews.
- **Goals:** Smooth Swiggy/Zomato-like UX, reliable order lifecycle, role-specific dashboards, INR-first pricing.
- **Key Features:** Restaurant discovery, menu browsing, cart and checkout, offers, payments (COD/card/UPI states), live order status timeline, driver assignment, reviews/replies, admin oversight with metrics and moderation.

## 3. Architecture
- **Stack:** MERN + Socket.io; REST for core flows, sockets for realtime notifications.
- **Frontend (React + Vite):**
  - Routing via React Router; role-guarded routes through `ProtectedRoute`.
  - Global state via `AuthContext` (JWT hydration) and `ToastContext` (toasts).
  - Pages for users (restaurants list/menu/cart/checkout/orders/profile), restaurants (dashboard/orders), drivers (dashboard), admin (dashboard with search/filters), shared landing/auth.
  - Styling: TailwindCSS; API access through Axios client with `/api` base.
- **Backend (Node.js + Express):**
  - Controllers per domain (auth, user, restaurant, cart, order, driver, admin, payments, offers, reviews, catalog).
  - Middlewares: JWT `protect`, role gates (`isAdmin`, `isRestaurant`, `isDriver`, `isUser`, `isAdminOrRestaurant`), `validateBody`, pagination, async error wrapper, centralized error handler.
  - Socket.io gateway for authenticated rooms (`user:{id}`, `role:{role}`).
- **Database (MongoDB + Mongoose):**
  - User: username, email, role, approval (restaurants), cuisines/tags, fees, ETA, ratings, open/online flags, blocked.
  - FoodItem: name, description, price, imageUrl, restaurantId.
  - Cart: userId, restaurantId (single-restaurant cart), items {foodId, name, price, quantity}.
  - Order: userId, restaurantId, items, subtotal/discount/deliveryFee/total, offerCode, deliveryAddress, paymentMethod/status/reference, driverId, driverAcceptance, status timeline (placed→confirmed→preparing→out_for_delivery→delivered/cancelled), statusHistory, replacement/support notes.
  - Driver: userId, online flag, currentOrderId.
  - Address, Offer, Review present for ancillary flows.

## 4. Setup Instructions
- **Prerequisites:** Node.js 18+, MongoDB instance, npm.
- **Clone & Install:**
  ```bash
  git clone <repo-url>
  cd "FINAL YEAR/STEAMY POT"
  ```
- **Server setup:**
  ```bash
  cd server
  npm install
  # create .env
  MONGO_URI=<mongodb-connection-string>
  JWT_SECRET=<strong-secret>
  PORT=5000 # optional
  npm run dev   # nodemon
  # or
  npm start
  ```
- **Client setup:**
  ```bash
  cd client
  npm install
  npm run dev   # http://localhost:5173
  ```
- **Proxy:** Vite proxies `/api` and `/socket.io` to the server in dev.
- **Seed (optional):** `node scripts/seed.js` from `server/` after reviewing contents.

## 5. Folder Structure
- **client/** – React app (routing, contexts, pages, Tailwind config).
- **server/** – Express API, Socket.io, controllers, middleware, models, routes, utils, scripts.
- **server/scripts/seed.js** – optional bootstrap data.
- **README.md** – quickstart overview.

## 6. Running the Application
- **Frontend:** from `client/` run `npm run dev` (or `npm run build` for prod bundle).
- **Backend:** from `server/` run `npm run dev` (nodemon) or `npm start`.
- Ensure MongoDB is reachable and env vars are set; run both servers together in dev.

## 7. API Documentation (base path `/api`)
Auth uses JWT bearer tokens; protected routes require `Authorization: Bearer <token>`.

### Auth (`/auth`)
- POST `/register` – body: `{ username, email, password, role? }` → `{ token, user }`.
- POST `/login` – body: `{ email, password }` → `{ token, user }`.

### User (`/user`)
- GET `/profile` – me profile.
- GET `/orders` – list my orders.
- GET `/addresses` – list saved addresses.
- POST `/addresses` – body: `{ line1?, city?, ... }` string fields; stores single-string address in current code.
- PATCH `/addresses/:id` – update address.
- DELETE `/addresses/:id` – remove address.

### Catalog (`/catalog`)
- GET `/restaurants` – public restaurant list (filters in query: search, cuisine, page, limit).
- GET `/restaurants/:id/menu` – menu for a restaurant.
- GET `/food` – all food items (public browse/search).

### Cart (`/cart`)
- GET `/` – get current cart (single-restaurant enforced).
- POST `/add` – body: `{ foodId, quantity? }` quantity defaults to 1; merges if same restaurant.
- PATCH `/item` – body: `{ foodId, quantity }` to set quantity.
- DELETE `/item/:foodId` – remove one item.

### Orders (`/orders`)
- POST `/` – place order; body: `{ restaurantId, items: [{foodId, quantity}], deliveryAddress, paymentMethod, offerCode? }` (items resolved to price/name server-side).
- GET `/` – list my orders.
- GET `/restaurant` – restaurant inbound orders (protected restaurant).
- POST `/:id/restaurant/accept` – restaurant accepts order.
- POST `/:id/restaurant/reject` – restaurant rejects order.
- PATCH `/:id/assign-driver` – admin/restaurant assigns driver; body: `{ driverId }`.
- PATCH `/:id/status` – role-checked status transition; body: `{ status }`.

### Payments (`/payments`)
- GET `/:orderId/status` – user payment status.
- POST `/:orderId/confirm` – mark paid (e.g., after gateway success).
- POST `/:orderId/fail` – mark failed; body: `{ reference }`.

### Restaurant (`/restaurant`)
- POST `/food` – create menu item; body: `{ name, description?, price, imageUrl? }`.
- GET `/menu` – restaurant’s own menu.
- PATCH `/food/:id` – update item.
- DELETE `/food/:id` – delete item.
- GET `/open` – current open flag.
- PATCH `/open` – toggle open; body: `{ isOpen }`.
- GET `/metrics` – restaurant metrics (orders, revenue, etc.).

### Driver (`/driver`)
- PATCH `/online` – body: `{ isOnline }` toggle.
- GET `/available` – list available drivers (admin/restaurant).
- GET `/orders` – driver’s assigned orders.
- PATCH `/orders/:id/status` – driver updates status (e.g., out_for_delivery, delivered).
- POST `/orders/:id/accept` – driver accepts assignment.
- POST `/orders/:id/decline` – driver declines.

### Offers (`/offers`)
- GET `/` – list offers.
- POST `/validate` – body: `{ code }` validate and return discount info.
- POST `/` – create offer (auth required; adjust roles as needed).
- PATCH `/:id` – update offer.

### Reviews (`/reviews`)
- GET `/restaurant/:restaurantId` – list reviews for a restaurant.
- POST `/` – create review; body: `{ restaurantId, rating, comment }`.
- PATCH `/:id/reply` – restaurant reply; body: `{ reply }`.

### Admin (`/admin`)
- GET `/users` – paginated users; query: `page, limit, search, role, isBlocked`.
- GET `/restaurants` – paginated restaurants; query: `page, limit, search, approval, isOpen`.
- PATCH `/restaurants/:id/approve` – approve restaurant.
- GET `/orders` – paginated all orders; query: `page, limit, status, paymentStatus, restaurantId, userId`.
- POST `/orders/:id/replace` – create replacement order; body: `{ supportNote, newTotal? }` (reuses items and links `replacesOrderId`).
- GET `/food` – paginated food items; query: `page, limit, search, restaurantId`.
- PATCH `/food/:id` – admin update food.
- DELETE `/food/:id` – delete food.
- PATCH `/users/:id/role` – body: `{ role }`.
- PATCH `/users/:id/block` – block user.
- PATCH `/users/:id/unblock` – unblock user.
- GET `/metrics` – platform metrics snapshot.

### Health
- GET `/health` – `{ status: "ok" }`.

_Example responses (typical):_
- Success list: `{ data: [...], page, totalPages, total }` for paginated admin endpoints.
- Auth success: `{ token, user }`.
- Order object: `{ _id, status, items, subtotal, discount, deliveryFee, total, paymentStatus, driverId, statusHistory, createdAt, updatedAt }`.
- Error: `{ message }` with appropriate HTTP status.

## 8. Authentication & Authorization
- JWT issued on login/register; sent in `Authorization` header for protected routes and Socket.io auth payload.
- Roles: `user`, `restaurant`, `driver`, `admin`; middleware gates resources accordingly.
- Tokens expire in 7d (from code defaults); refresh by re-login.

## 9. User Interface
- Landing, login/register forms; restaurant catalog and menu; cart with inline quantity controls; checkout; orders page with horizontal status timeline and ETA; restaurant dashboard; driver dashboard; admin dashboard with search/filters and replacement orders.
- _Add screenshots/GIFs here when available._

## 10. Testing
- Manual testing via Postman collection `server/SteamyPot.postman_collection.json`.
- Automated tests not yet implemented; recommend adding Jest/Supertest for API and React Testing Library for UI.

## 11. Screenshots / Demo
- _Add hosted demo link or embed images/GIFs illustrating key flows (browse → cart → checkout → track order)._ 

## 12. Known Issues
- Requires running server and MongoDB locally; no offline mode.
- Realtime notifications via Socket.io not fully wired for all status changes (room events to be extended).
- Payment flow uses status toggles; integrate real gateway for production.

## 13. Future Enhancements
- Push realtime events for every status change (user/restaurant/driver rooms), and delivery ETA back-end calc.
- Payment gateway integration (UPI/card), webhooks, and receipt emails.
- Restaurant onboarding flow with document checks; driver verification.
- Rich analytics dashboards (heatmaps, churn) and alerting.
- Native mobile apps or PWA features (push notifications, offline cart).
