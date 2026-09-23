# Saremi Academy — Target Architecture Specification
**Status:** Approved & Living Architecture Blueprint  
**Domain:** Production-Grade Mobile-First Music Learning Platform  

---

## 1. High-Level Conceptual Structure

```
                         Public Website (Marketing, Store & Public Pages)
                                                │
                                    Authentication & RBAC
                                                │
                 ┌────────────────┬─────────────┴────────────┬────────────────┐
                 │                │                           │                │
            Student App      Parent Portal              Teacher Portal    Admin & Staff
            (Mobile-First)   (Child Progress & Billing) (Classes/Studio)  (Academic/Finance)
                 │                │                           │                │
                 └────────────────┴─────────────┬─────────────┴────────────────┘
                                                │
                                      Core Platform Engine
             ┌──────────────────────────────────┼──────────────────────────────────┐
             │                                  │                                  │
     Academics & LMS                    Live Studio & Practice             Commerce & Records
  - 1:1 & Group Courses               - Real-Time Live Classroom        - Razorpay Orders
  - Graded Certification Curriculum   - Tuner, Metronome & Drone        - Physical Accessories
  - Assignments & Video Feedback      - Practice Habit & Riyaaz Log     - Transactional Notifications
  - Masterclasses & Recitals          - Audio Waveform Recorder         - Attendance & Audit Logs
```

---

## 2. Frontend Architecture

### 2.1 Principles
- **Mobile-First Responsive Layouts**: Native mobile app ergonomics with bottom navigation bars, touch-friendly sheets, swipeable tabs, and desktop expansions (sidebars and bento grids) on `lg` screens.
- **Micro-Portal Separation**: Distinct layouts for:
  1. `Public`: High-converting public pages, catalog, emporium store, trial scheduler.
  2. `Student App` (`/app/*`): Daily riyaaz tracker, class join button, assignments, progress meters, badges.
  3. `Teacher Portal` (`/teacher-app/*`): Student rosters, calendar availability, assignment grading, class notes.
  4. `Parent Portal` (`/parent-app/*`): Child attendance, teacher notes, progress report cards, tuition fee payments.
  5. `Admin Panel` (`/admin/*`): Multi-department operations (Academics, Sales Leads, Classes, Payments, Reports).

### 2.2 Route Architecture & Tree
```
/                                   -> Public Landing with Solfège Audio & Featured Courses
/courses                            -> Public Course Catalog with discipline & level filters
/course/:slug                       -> Public Course Detail & Syllabus
/teachers                           -> Faculty & Gurus directory
/teacher/:id                        -> Teacher Profile & Credentials
/pricing                            -> Graded Class Packages & Subscription plans
/free-trial                         -> 1:1 Placement Diagnostic Trial Booking
/masterclasses                      -> Guest Maestro Live Masterclasses
/events                             -> Annual Student Recitals & Festivals
/tools                              -> Interactive Swara Player, Tuner & Tanpura Drone
/blog                               -> Conservatory pedagogy, music theory, and riyaaz articles
/contact                            -> Academy inquiries & branch support
/faq                                -> Frequently asked questions
/certifications                     -> 4-Pillar Conservatory Grading Milestones

/app                                -> Student Dashboard (Daily Riyaaz, Next Class)
/app/learn                          -> Enrolled Syllabus & Curriculum Materials
/app/classes                        -> Scheduled 1:1 Live Classes & Recordings
/app/practice                       -> Practice Studio (Tuner, Metronome, Tanpura Drone)
/app/assignments                    -> Submissions, Audio Feedback & Teacher Notes
/app/progress                       -> Skill Mastery, Attendance, & Riyaaz Streaks
/app/events                         -> Upcoming Recitals & Auditions
/app/masterclasses                  -> Enrolled Maestro Masterclasses
/app/certificates                   -> Issued Graded Diplomas & Verified Badges
/app/payments                       -> Tuition Subscriptions, Invoices, & Store Orders
/app/messages                       -> Direct Student-Teacher Message Board
/app/profile                        -> Student Bio, Instrument Preferences & Shipping Info

/teacher-app                        -> Teacher Overview & Daily Schedule
/teacher-app/classes                -> Live Class Launcher & Attendance Logger
/teacher-app/students               -> Student Performance Cards & Learning Profiles
/teacher-app/assignments            -> Audio/Video Homework Review & Grading
/teacher-app/availability           -> Calendar Booking Slot Configuration
/teacher-app/messages               -> Student & Parent Direct Communications

/parent-app                         -> Parent Dashboard (Family View)
/parent-app/children                -> Child Profiles & Instrument Enrollments
/parent-app/classes                 -> Upcoming Schedule & Attendance History
/parent-app/progress                -> Teacher Diagnostic Feedback & Exam Readiness
/parent-app/payments                -> Family Tuition Fees, Invoices & Payment History

/admin                              -> Executive Command Center
/admin/students                     -> Student Directory & Enrollment Lifecycle
/admin/teachers                     -> Faculty Directory, Allocation & Onboarding
/admin/courses                      -> Curriculum Management & Pricing
/admin/classes                      -> Live Class Scheduling & Substitution
/admin/payments                     -> Razorpay Transactions, Refunds & Revenue Metrics
/admin/leads                        -> Trial Booking Leads & Conversion Pipeline
/admin/events                       -> Public Masterclasses & Concert Planning
/admin/masterclasses                -> Masterclass Roster & Ticketing
/admin/content                      -> Public Blog, Testimonials & CMS
/admin/reports                      -> Academic Progress & Financial Health
/admin/settings                     -> Academy Configuration & RBAC Assignment
```

---

## 3. Backend Architecture

### 3.1 Node / Express Server (`server.ts`)
- Serves as the secure reverse-proxy boundary.
- **Core Endpoints:**
  - `POST /api/create-razorpay-order`: Authoritative amount calculation, currency configuration, receipt generation.
  - `POST /api/verify-razorpay-payment`: Server-side HMAC SHA-256 signature verification.
  - `POST /api/webhook/razorpay`: Asynchronous idempotency worker for payment capture.
  - `POST /api/send-email`: Transactional notification worker for class links and order receipts.
  - `POST /api/generate-meeting-token`: Secure provider token generation for live video classrooms.

---

## 4. Database Architecture (Google Cloud Firestore)

### Collections & Entity Relationship Schema
- `users/{uid}`
  - Role: `visitor | student | parent | teacher | academic_coordinator | sales | finance | admin | super_admin`
  - Profile metadata, phone, timezone, notification settings, linked children (for parents), assigned teachers (for students).
- `courses/{courseId}`
  - Title, discipline, level (`Foundation`, `Developing`, `Proficient`, `Advanced`), tuition tiers, teacher IDs.
- `classes/{classId}`
  - StudentId, teacherId, courseId, scheduledAt, status (`scheduled`, `completed`, `rescheduled`, `cancelled`), meetingUrl, lessonNotes, recordingUrl.
- `assignments/{assignmentId}`
  - StudentId, teacherId, classId, title, instructions, audioSubmissionUrl, status (`pending`, `reviewed`), teacherAudioFeedbackUrl, grade.
- `practices/{practiceId}`
  - StudentId, instrument, durationMinutes, exercisesPracticed, notes, date.
- `orders/{orderId}`
  - UserId, customerName, customerEmail, lineItems, orderType (`physical`, `digital`, `mixed`), status, Razorpay IDs, shippingAddress.
- `bookings/{bookingId}`
  - Customer details, instrument, preferredSlot, status (`pending`, `confirmed`, `completed`), assignedTeacherId, meetingUrl.
- `masterclasses/{masterclassId}`
  - Title, maestroName, date, fee, enrolledUserIds, streamUrl.
- `certificates/{certificateId}`
  - StudentId, courseTitle, gradeLevel, issuedDate, verificationCode, certificatePdfUrl.

---

## 5. Authentication & Authorization Architecture (RBAC)

### 5.1 Authentication Flow
- Handled client-side via Firebase Auth (`signInWithEmailAndPassword`, `signInWithPopup(GoogleAuthProvider)`).
- Session synchronized with Firestore user document.
- Auth custom claims or Firestore profile role field determines privilege level.

### 5.2 RBAC Permission Matrix
| Role | Public Pages | Student Portal | Parent Portal | Teacher Portal | Admin Panel | System Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| `visitor` | ✅ Read | ❌ | ❌ | ❌ | ❌ | ❌ |
| `student` | ✅ Read | ✅ Full | ❌ | ❌ | ❌ | ❌ |
| `parent` | ✅ Read | ❌ | ✅ Full | ❌ | ❌ | ❌ |
| `teacher` | ✅ Read | ❌ | ❌ | ✅ Full | ❌ | ❌ |
| `academic_coordinator` | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ✅ Academic | ❌ |
| `sales` | ✅ Read | ❌ | ❌ | ❌ | ✅ Leads/Trials | ❌ |
| `finance` | ✅ Read | ❌ | ❌ | ❌ | ✅ Payments | ❌ |
| `admin` | ✅ Read | ✅ Read | ✅ Read | ✅ Read | ✅ Full | ❌ |
| `super_admin` | ✅ Read | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ✅ Full |

---

## 6. Real-Time Architecture
- Utilizes Firestore's native `onSnapshot()` listeners for:
  - **Live Order Tracking**: Instant shipment status transitions.
  - **Classroom Status**: Notification when teacher initiates a live session.
  - **Direct Messages**: Real-time communication between student and instructor.
  - **Admin Lead Feeds**: Real-time ticker of incoming trial requests.

---

## 7. File Storage Architecture
- Cloud Storage bucket layout:
  - `/students/{studentId}/assignments/{assignmentId}/*`: Audio recordings, sheet music uploads.
  - `/teachers/{teacherId}/materials/*`: Pedagogical guides, backing tracks.
  - `/certificates/{certificateId}/*`: Verified diplomas with tamper-proof signatures.
  - `/products/{productId}/*`: Digital product downloads and high-resolution catalog images.

---

## 8. Payment Architecture
- **Provider:** Razorpay (India & Global multi-currency support).
- **Subunits:** Automatic calculation in smallest currency unit (Paise for INR, Cents for USD).
- **Payment Verification:** HMAC SHA-256 verification on backend before marking orders or tuition fees as confirmed.
