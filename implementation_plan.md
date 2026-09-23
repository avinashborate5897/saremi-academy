# Security Audit & Hardening Plan - Saremi Academy

## Security Threat Model

### 1. Application & Component Purpose
- **System**: Saremi Academy Online Conservatory
- **Tech Stack**: React 18, Vite, Node.js / Express backend (`server.ts`), Firebase Firestore & Authentication, Agora RTC Web SDK & Token Builder, Razorpay Payment Gateway API & Webhooks.
- **Trust Boundaries**:
  - Unauthenticated Web Visitors <-> Public Portal & Trial Bookings
  - Authenticated Students <-> Student Learning Portal & Private Student Data
  - Authenticated Faculty/Teachers <-> Faculty Studio, Student Evaluations & Class Rosters
  - Authenticated Staff/Admins <-> Admin Console & Financial/CRM Records
  - Client Browser <-> Backend Express Server (`/api/*`)
  - External Services (Razorpay, Agora, Firebase) <-> Backend Server

### 2. Entry Points & Untrusted Inputs
- `POST /api/create-razorpay-order`: `orderId`, `amount`, `currency`, `customerEmail`, `customerName`.
- `POST /api/verify-razorpay-payment`: `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`, `orderId`.
- `POST /api/webhook/razorpay`: `x-razorpay-signature` header, raw request body.
- `POST /api/agora/token`: `channelName`, `uid`, `role`, `classId`, `userId`.
- `POST /api/check-package-access`: `studentId`, `packageData`.
- `POST /api/validate-resource-access`: `studentId`, `resourceType`, `packageData`.
- Firestore Client Writes: Direct client SDK calls across `users`, `bookings`, `trial_bookings`, `orders`, `enrollments`, `classes`, `live_classes`, `assignments`, `practices`, `messages`.

### 3. Vulnerabilities Identified & Severity Assessment

| ID | Area | Vulnerability | Severity | CWE |
|---|---|---|---|---|
| SEC-01 | Firebase Rules | **User Role Privilege Escalation**: `match /users/{userId}` allows the document owner to update any field without restricting `role`, `isAdmin`, or `super_admin`. Regular users can self-elevate to admin or super_admin. | **CRITICAL** | CWE-269 / CWE-284 |
| SEC-02 | Firebase Rules | **Sensitive PII Data Exposure**: `trial_bookings` and `bookings` collections have `allow read: if true;`, exposing students' names, phone numbers, email addresses, and booking notes to unauthenticated scrapers. | **HIGH** | CWE-200 / CWE-359 |
| SEC-03 | Firebase Rules | **Unrestricted Order Creation & Tampering**: `orders` has `allow create: if isAuthenticated() || true;` allowing unauthenticated order spoofing, and allows students to update order data directly. | **HIGH** | CWE-284 |
| SEC-04 | Firebase Rules | **Student Data Isolation / IDOR**: `assignments`, `practices`, `submissions`, `messages` allow any authenticated user to read and edit assignments, voice logs, and private messages of other students. | **HIGH** | CWE-639 / IDOR |
| SEC-05 | Firebase Rules | **Rules Syntax Error on Create**: `classes` and `live_classes` evaluate `resource.data` on `create` operations (where `resource` is null), risking runtime permission failures. | **MEDIUM** | CWE-703 |
| SEC-06 | Payment Verification | **Timing Attack in Signature Verification**: String comparison (`generatedSignature === payload.razorpaySignature`) in payment verification and webhook processing leaks cryptographic timing information. | **HIGH** | CWE-208 |
| SEC-07 | Payment Verification | **Sandbox Simulation Bypass in Production**: `handleVerifyRazorpayPayment` defaults to auto-verifying unverified orders if `RAZORPAY_KEY_SECRET` is unset, without strictly guarding against production execution. | **HIGH** | CWE-393 / CWE-305 |
| SEC-08 | Webhook Security | **Webhook Signature Bypass**: If `webhookSecret` is set and signature header is missing or empty, webhook processing does not enforce signature presence. | **HIGH** | CWE-347 |
| SEC-09 | Agora Token Security | **Unauthenticated Token Generation & Channel Spoofing**: `/api/agora/token` accepts arbitrary channel names without sanitization regex, allows negative or non-integer UIDs, and lacks role validation. | **MEDIUM** | CWE-285 / CWE-20 |
| SEC-10 | Secrets & Configuration | **Exposed Secrets in `.env.example`**: Literal live Agora App ID and Certificate strings were committed in `.env.example`. | **MEDIUM** | CWE-798 / CWE-200 |
| SEC-11 | Server Access Control | **Insecure Default in Package Check**: `/api/check-package-access` defaulted missing `packageData` to `24 sessions` and granted access instead of rejecting with `inactive_subscription`. | **MEDIUM** | CWE-1188 |

---

## Remediation & Verification Plan

### Phase 1: Harden Firebase Security Rules (`firestore.rules`)
- Prevent user role privilege escalation by forbidding non-admin users from altering `role`, `isStaff`, `isAdmin`, `super_admin`, or `permissions` fields on update.
- Ensure initial user creation restricts roles to `student`, `parent`, or `visitor`.
- Restrict `trial_bookings` and `bookings` read access to staff/admins or the owning student/email.
- Secure `orders`, `enrollments`, and `transactions` creation to authenticated users matching the record's user ID.
- Restrict `assignments`, `practices`, and `messages` read/write access to student owner, assigned teacher, or admin.
- Fix `classes` and `live_classes` rules to use `request.resource.data` on create.
- Deploy updated rules using `deploy_firebase`.

### Phase 2: Secure Payment & Webhook Verification (`src/server/apiHandlers.ts`)
- Replace string comparisons with constant-time `crypto.timingSafeEqual` with buffer length validation.
- Guard sandbox simulation so it strictly fails with 403 in `production` if keys are missing.
- Require and enforce `x-razorpay-signature` in webhook processing whenever a webhook secret is configured.
- Add input validation on `amount` (> 0, finite), `currency`, and `orderId`.

### Phase 3: Secure Agora RTC Token Generation (`server.ts`)
- Validate and sanitize `channelName` against `^[a-zA-Z0-9_-]{3,64}$`.
- Validate `uid` is an integer between 1 and 4294967295.
- Validate `role` to strictly either `publisher` or `subscriber`.
- Guard `classId` and require identity presence.

### Phase 4: Secure Access Control Defaults & Secrets Sanitization
- Fix `handleCheckPackageAccess` to fail closed (deny access) when no valid package data or active enrollment is provided.
- Sanitize `.env.example` so credentials are placeholder strings.

---

## Verification Plan

### Security Verification
- **Security Scan**: Inspect all newly created and modified files for common CWE vulnerabilities (XSS, injection, exposed secrets, missing auth boundaries). Resolve any detected issues immediately.
- **Security Audit**: Audit the implementation against the component's threat model (`## Security Threat Model`). Document all findings, dispositions, and remediations in `walkthrough.md` using the `generate-security-audit-report` skill.
- **Regression Check**: Run `compile_applet` and test server endpoints to ensure zero breaking changes to legitimate students and staff.
