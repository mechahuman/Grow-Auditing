# Admin Portal — Team Members Section Update

## Objective
Refine the "Team Members" section (`section === 'members'`) of the Admin Dashboard to improve organization, provide deeper insights into user activity, and introduce quality-of-life management features.

## Core Requirements

1. **Separated Role Displays**
   - Split the current unified list into two distinct, clearly labeled sections: **Administrators** and **Team Members**.
   - Use visual hierarchy (e.g., distinct tables, glassmorphism card grids, or clean dividers) to easily differentiate between the roles.

2. **Last Login / Activity Logs**
   - Display a "Last Active" or "Last Logged In" timestamp for every user.
   - *Implementation Detail:* Ensure we have a reliable way to track this (e.g., a `last_seen_at` column updated via middleware/login).
   - Display the time in a relative, human-readable format (e.g., "2 hours ago", "Yesterday") with the exact time shown on hover.

3. **Registration Timestamp**
   - Clearly display the exact date and time the account was created/registered by the admin.
   - Use a clean, formatted date string (e.g., `Oct 12, 2026 at 4:30 PM`).

---

## Suggested Enhancements & Minimalistic Features
*(These small, efficient features will greatly improve admin workflow)*

4. **Status Indicators (Visual Badges)**
   - Add sleek colored pill badges or glowing dots next to names:
     - 🟢 **Online/Active** (Logged in recently)
     - 🟡 **Offline** (Hasn't logged in for >24h)
     - 🔴 **Deactivated** (Currently suspended/inactive)

5. **Quick-Action Dropdown Menu**
   - Replace bulky buttons with a sleek "three-dot" (⋮) dropdown menu on each user row containing:
     - *Edit Role* (Toggle Admin ↔ Member)
     - *Deactivate / Reactivate Account*
     - *Remove Account*

6. **Lead Contribution Summary**
   - Display a small metric (e.g., `14 Leads`) directly in the team member's row. This saves the admin from having to cross-reference the main dashboard to see who is performing well.

7. **Search & Filter Bar**
   - Add a minimalistic search input at the top of the section to quickly filter users by Name or Email.
   - Include a simple toggle to "Show Deactivated Members" to keep the default active list clutter-free.

8. **Modern UI/UX Adherence**
   - Ensure the new layout perfectly matches the premium dark-mode aesthetics, glassmorphism, and hover animations recently applied to the main dashboard.
