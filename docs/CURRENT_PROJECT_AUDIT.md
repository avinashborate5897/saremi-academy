# Saremi Academy — Current Project Audit
**Generated:** 2026-09-15  
**Project:** Saremi Academy (Live 1:1 Online Music Academy & Emporium)  
**App ID:** `c90769ac-5275-4615-8a42-e2adcd24bc9c`

---

## 1. Frontend Framework
- **Core Library:** React 19 (`react` ^19.0.1, `react-dom` ^19.0.1)
- **Bundler & Dev Server:** Vite 6.2.3 (`vite`, `@vitejs/plugin-react` ^5.0.4)
- **Language:** TypeScript 5.8.2 (`typescript`, `tsconfig.json` targeting ES2022, bundler module resolution)
- **Animation:** Motion (`motion` ^12.23.24)

## 2. Backend Framework
- **Runtime:** Node.js (ESM type module enabled)
- **Server:** Express 4.21.2 (`express`, `@types/express` ^4.17.21) defined in `server.ts`
- **Development Integration:** Custom Vite plugin (`apiPlugin` in `vite.config.ts`) that mounts API route handlers directly onto Vite's internal Connect dev server during local development, ensuring parity between `npm run dev` and `npm run start` (`server.ts`).

## 3. Database
- **Provider:** Google Cloud Firestore (via Firebase Web SDK v12.19.0)
- **Instance ID:** `ai-studio-c90769ac-5275-4615-8a42-e2adcd24bc9c`
- **Collections Active:**
  - `/users/{userId}`: Student, Teacher, Parent, Admin user profiles, enrollments, saved addresses, notifications.
  - `/courses/{courseId}`: Course catalog with curriculum, teacher bios, session rates, levels.
  - `/products/{productId}`: Physical instrument accessories, practice packs, course bundles, gift cards.
  - `/orders/{orderId}`: Orders with line items, physical shipping addresses, tracking history, Razorpay references.
  - `/bookings/{bookingId}`: 1:1 free placement trial sessions, student notes, Google Meet links.

## 4. ORM / Data Access Layer
- **Pattern:** Typed repository and service layer in `src/lib/firestoreService.ts` utilizing native Firestore modular SDK (`collection`, `doc`, `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `onSnapshot`, `query`, `where`).
- **Schema Blueprint:** `firebase-blueprint.json` documenting entities, indexes, and validation rules.
- **Error Handling:** Centralized `handleFirestoreError` with contextual error messages for UI alerts.

## 5. Authentication
- **Provider:** Firebase Authentication (`firebase/auth`)
- **Supported Methods:**
  - Email & Password (`signInWithEmailAndPassword`, `createUserWithEmailAndPassword`)
  - Google Sign-In Popup (`GoogleAuthProvider`, `signInWithPopup`)
  - Password Reset Email (`sendPasswordResetEmail`)
- **State Synchronization:** `src/context/AuthContext.tsx` handles listener `onAuthStateChanged`, auto-creates initial Firestore profile for new accounts, and resolves user role (`student` vs `admin`).

## 6. Routing
- **Current Pattern:** Single-page client-side state router in `src/App.tsx` utilizing `currentView` (`'home' | 'courses' | 'shop' | 'dashboard' | 'tracking' | 'admin'`).
- **Target Upgrade:** Full path-based routing architecture with browser history, clean URLs, deep linking, and layout shells for Public, Student App, Teacher Portal, Parent Portal, and Admin Console.

## 7. Styling System
- **Engine:** Tailwind CSS v4 (`@tailwindcss/vite` v4.1.14, `@import "tailwindcss";` in `src/index.css`)
- **Palette Identity:**
  - Deep Midnight Indigo (`#121829` / `#0C2340`)
  - Warm Acoustic Brass (`#D49A3D` / `#8C6428`)
  - Pure Linen Canvas (`#FAF8F5`)
  - Emerald Accents for active studio indicators (`#059669`)
- **Typography:**
  - Headings: *Fraunces* (Google Fonts serif with optical size variations)
  - Body & UI: *Plus Jakarta Sans* (geometric clean sans-serif)

## 8. UI Component Library
- **Library:** Bespoke custom component library built with Tailwind CSS utility classes and `lucide-react` icons (^0.546.0).
- **Interactive Audio:** Custom Web Audio API synthesizer for the Solfège swara scale (`Sa, Re, Ga, Ma, Pa, Dha, Ni, Sa'`) and Tanpura acoustic drone harmonic loop.

## 9. Existing API Structure
Mounted in `server.ts` and `vite.config.ts`:
- `GET /api/health`: Health status, runtime timestamp, payment provider indicator.
- `POST /api/create-razorpay-order`: Generates server-side Razorpay order ID, receipt ID, subunit pricing, and customer metadata. Supports simulated mode when credentials are not yet configured.
- `POST /api/verify-razorpay-payment`: Validates Razorpay HMAC SHA-256 signature using `RAZORPAY_KEY_SECRET`.
- `POST /api/webhook/razorpay`: Verifies `x-razorpay-signature` and processes asynchronous order fulfillment.
- `POST /api/send-email`: Server-side transactional notification dispatcher.

## 10. Existing Environment Variables
Declared in `.env.example`:
- `GEMINI_API_KEY`: Model capabilities (server-side).
- `APP_URL`: Canonical application hosting URL.
- `RAZORPAY_KEY_ID`: Razorpay public key ID.
- `RAZORPAY_KEY_SECRET`: Razorpay secret key.
- `RAZORPAY_WEBHOOK_SECRET`: Webhook verification secret.
- `TRANSACTIONAL_EMAIL_API_KEY`: Email delivery provider key.

## 11. Existing Deployment Configuration
- **Host Environment:** Cloud Run sandboxed container.
- **Port Requirement:** Reverse proxy binding exclusively to port `3000` on `0.0.0.0`.
- **Scripts:**
  - `dev`: `vite --port=3000 --host=0.0.0.0`
  - `build`: `vite build`
  - `start`: `node server.ts`
- **Rules Deployment:** Automated rule deployment via `deploy_firebase` targeting `firestore.rules`.

## 12. Existing Assets
- High-fidelity curated photography for instruments (vocal microphone, Steinway grand piano, acoustic guitar, handmade Varanasi tabla).
- Real audio synthesis oscillators for pitches 261.63 Hz (C4) through 523.25 Hz (C5) with rich overtones.

## 13. Existing Pages & Views
1. **Public Website:**
   - Hero with interactive sound bar
   - Discipline showcase (Vocals, Piano, Guitar, Tabla)
   - Methodology & 4-Pillar Conservatory Pedagogy
   - Student Testimonials
   - Storefront preview
2. **Courses Catalog:** Search, discipline filters (Vocals, Piano, Guitar, Tabla), level filter, detailed curriculum modal.
3. **Emporium Store:** Physical and digital products, category filters, stock tracking, and instant add-to-cart.
4. **Cart Drawer & Checkout:** Multi-item cart drawer with automatic physical vs digital shipping calculation, address form, and Razorpay checkout integration.
5. **Real-Time Order Tracking:** Firestore `onSnapshot` live stepper showing delivery status.
6. **Learner Dashboard:** 1:1 scheduled classes with Google Meet links, order history, profile and address management, notification preferences.
7. **Staff Admin Console:** Fulfillment status switcher, booking approvals, catalog updates, email dispatch log.

## 14. Existing Reusable Components
- `Navbar.tsx`: Main brand navigation with cart count badge and user avatar.
- `Footer.tsx`: Comprehensive footer with discipline links, store directory, credentials, and legal disclaimers.
- `SoundBar.tsx`: Playable octave synth and tanpura drone.
- `CoursesCatalog.tsx`: Course grid with filter chips and curriculum modal.
- `Shop.tsx`: Product grid with detail modal and type badges.
- `CartDrawer.tsx`: Slide-over cart with live subtotal calculation.
- `CheckoutModal.tsx`: Razorpay checkout modal with simulation fallback.
- `BookingModal.tsx`: Free 1:1 trial booking form with date and slot selection.
- `AuthModal.tsx`: Firebase auth dialog for email/password and Google login.
- `Dashboard.tsx`: Comprehensive user portal.
- `OrderTracking.tsx`: Real-time order progress timeline.
- `AdminPanel.tsx`: Full staff management dashboard.
- `Testimonials.tsx`: Learner feedback and conservatory highlights.

## 15. Existing Forms
- User Registration / Sign In Form (`AuthModal.tsx`)
- Password Reset Request Form (`AuthModal.tsx`)
- Free 1:1 Placement Trial Booking Form (`BookingModal.tsx`)
- Physical Goods Shipping Address Form (`CheckoutModal.tsx`)
- Profile Info & Notification Settings Form (`Dashboard.tsx`)
- Store Product Catalog Add Form (`AdminPanel.tsx`)
- Live Classroom Meeting Link Assignment Form (`AdminPanel.tsx`)

## 16. Existing Payment Functionality
- Powered by **Razorpay** (supporting UPI, Cards, NetBanking, and Digital Wallets).
- Server-authoritative order creation (`/api/create-razorpay-order`).
- Server-side signature verification (`/api/verify-razorpay-payment`).
- Real-time Firestore order state progression from `order_placed` to `payment_confirmed` or `enrolled`.

## 17. Existing User Management
- Stored under `/users/{uid}` in Firestore.
- AuthContext provides user session, role resolution (`isStaffAdmin`), and profile updating.
- Admin designated at `avinashborate5897@gmail.com`.

## 18. Existing Admin Functionality
- Gated tabbed interface in `AdminPanel.tsx`.
- Real-time order status stepper (placed, preparing, shipped, out for delivery, delivered, enrolled).
- 1:1 trial booking management with meeting link assignment and confirmation email triggers.
- Product inventory creation.
- Transactional notification log review.
