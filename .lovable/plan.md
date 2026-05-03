## School Management System Upgrade

Transform Lishna into a classroom platform with teacher/student roles, assignments, and grade tracking — while polishing animations and credits.

### 1. Database (new migration)

Add a `teacher` value to the existing `app_role` enum, then create:

- **classes** — `id`, `teacher_id` (uuid), `name` (text), `class_code` (text unique, 6-char), `created_at`. RLS: teachers manage their own; anyone authenticated can SELECT by code (for joining).
- **class_members** — `id`, `class_id`, `student_id`, `joined_at`. Unique on (class_id, student_id). RLS: students insert themselves; teacher of class + member student can read.
- **assignments** — `id`, `class_id`, `teacher_id`, `title`, `type` ('assignment' | 'test'), `word_ids` (int[]) referencing the 200-word dictionary, `due_at` (nullable), `created_at`. RLS: teacher manages own; class members can read.
- **assignment_submissions** — `id`, `assignment_id`, `student_id`, `score` (int), `total` (int), `details` (jsonb — per-word correct/wrong), `submitted_at`. Unique on (assignment_id, student_id). RLS: student inserts/views own; teacher of parent class views all.

Helper security-definer function `is_class_teacher(_class_id, _user_id)` to avoid RLS recursion.

Class code generation: 6-char uppercase alphanumeric, generated client-side with retry on collision.

### 2. Roles & access

- Reuse existing `user_roles` + `has_role()` pattern. New role: `teacher`.
- Add a "Become a teacher" toggle in Settings (self-assign teacher role for beta — simple insert into `user_roles`). Note this for later admin-gated upgrade.
- Students = any authenticated user without teacher role.

### 3. New pages & routes

- `/classes` — role-aware hub:
  - Teacher view: list of own classes with codes, "Create class" dialog, click → `/classes/:id` dashboard.
  - Student view: list of joined classes + "Join with code" input.
- `/classes/:id` — Teacher dashboard:
  - Class info + shareable code (copy button).
  - Members list with their scores per assignment.
  - Assignments list + "Create assignment/test" dialog (pick title, type, word multi-select from the 200-word dictionary).
- `/classes/:id/student` — Student class view: list of active assignments, click to start.
- `/assignment/:id` — Student takes the assignment (reuses Quiz logic, but locked to the assignment's `word_ids`); on finish writes a row to `assignment_submissions` and redirects to a results screen.

Add nav entry (icon: GraduationCap-like) for "כיתות" — replace one less-used item or add as 6th item; recommended: keep current 5 nav items and surface "כיתות" as a card on Home + link in Settings (avoids overcrowding mobile bottom nav).

### 4. Hooks

- `useClasses()` — list/create/join.
- `useClass(id)` — class detail, members, assignments.
- `useAssignments(classId)` and `useSubmissions(assignmentId)`.
- `useUserRole()` — wraps `user_roles` query, exposes `isTeacher`.

### 5. Quiz reuse for assignments

Refactor `Quiz.tsx` minimally to accept an optional `wordIds` prop/route-state. When present: skip random selection, use those words, on completion call submission insert instead of (or in addition to) normal points logic.

### 6. Animations & polish (Framer Motion)

- Wrap `<Routes>` with `AnimatePresence` + a `PageTransition` component (fade + subtle y-slide, 200ms).
- Add `whileTap={{ scale: 0.97 }}` to primary action buttons across Home, Classes, Assignment screens.
- Respect `prefers-reduced-motion`.

### 7. Footer credits

Create `<Footer />` component: fixed-position above the bottom nav (so it doesn't overlap), text "כל הזכויות שמורות לנועם כהן ולדניאל תורתי", muted small text. Render on Home and Settings only. Ensure it sits above the bottom nav with proper padding so content isn't clipped.

### 8. Analytics

Vercel `<Analytics />` already mounted in `App.tsx` — it auto-tracks route changes via React Router. New pages are tracked automatically; no extra work needed. Verify by spot-checking after deploy.

### 9. SEO & accessibility

- Each new page: unique `<title>`, meta description, h1, semantic landmarks.
- All buttons: `aria-label` where icon-only; touch targets ≥44px.
- Class code: `role="status"` + copy button with aria-label.

### Out of scope / follow-ups

- Bulk teacher invitations, CSV export of grades, assignment deadlines enforcement, push notifications. Can add later.

### Open question

Should the teacher role be **self-serve** (any user toggles it on in Settings — fast for beta) or **admin-granted only** (safer, but you'd need to grant it manually for each teacher)? Default in this plan: self-serve for beta with a clear note to lock down later.
