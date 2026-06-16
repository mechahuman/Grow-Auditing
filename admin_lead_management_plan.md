# Admin Lead Management - Implementation Plan

## 1. Overview
The Lead Management section in the Admin Dashboard is designed to provide a comprehensive, bird's-eye view of all leads in the system while enabling efficient lead distribution among team members. The interface is split into two primary functional areas: a Global Leads View and a Team & Reassignment View.

## 2. Core Functional Requirements

### 2.1 Global Leads View (Left Panel)
This section serves as the master directory for all leads within the system.

*   **Comprehensive Lead List:** Displays all leads currently existing in the system at once (Strictly List View only).
*   **Search & Filtering:** Robust search functionality with top-bar dropdown filters (All subs, All scores, All members).
*   **Enrichment Details Access (Strictly Read-Only):** Admins can view the full, enriched review page for any lead. Because data is pre-retrieved by team members, this view is strictly for display. **Do NOT include "Re-Enrich" or "Edit" buttons.**
    *   **Simple Audit Trail:** The details view includes a history log showing when the lead was reassigned and by whom, ensuring accountability.
*   **Ownership Visibility:** Each lead explicitly displays the name of the team member it is currently assigned to.

### 2.2 Team & Reassignment View (Right Panel)
This section is dedicated to team management and lead distribution.

*   **Team Member Roster:** Displays a list of all active team members.
    *   **Workload/Capacity Indicators:** Next to each team member, display a visual badge showing their total assigned leads (e.g., "John Doe - 12 Leads") to assist admins in load balancing.
*   **Member-Specific Lead Queues:** Admins can view the specific leads assigned to any individual team member.
*   **Lead Reassignment Engine:** 
    *   **Single & Bulk Reassignment:** Admins can easily reassign a single lead or select multiple leads simultaneously to reassign them in bulk to a different team member.
    *   **Data Isolation:** Upon reassignment, the entire lead information is removed from the previous team member's dashboard and immediately becomes accessible on the current team member's dashboard.

## 3. Strict UI/UX & Layout Constraints
*   **100% Zoom Visibility (No Scrolling):** The entire Enriched Review Form for a lead must be visible at once on a standard screen at 100% default zoom. 
    *   *Requirement:* You must use a highly compact, multi-column dashboard layout (e.g., 3 or 4 columns) rather than stacking sections vertically.
    *   *Design Elements:* Use smaller fonts, tight padding, and compact cards to ensure all data points (Stats, Score, AI Insights, Strengths/Considerations, Final Notes) fit neatly on one screen without requiring the admin to scroll.
*   **Aesthetics:** Professional, sleek, dark-mode theme with vibrant neon accents (purple/pink) using cards and pills to organize the dense data.

## 4. Implementation Guidelines for AI Assistant (e.g., Claude Code)
*When implementing these features, please follow a systematic, step-by-step approach. Do not generate all code at once. Build and test iteratively.*

1.  **Step 1: UI Shell & Layout:** Create the split-panel layout (Left: Global Leads, Right: Team View) using a responsive, modern grid/flexbox system. Ensure the design is clean and minimalistic.
2.  **Step 2: State Management & Types:** Set up the frontend state to handle the list of all leads, team members, and the mapping between them. Define clear TypeScript interfaces (if applicable) for Leads and Team Members.
3.  **Step 3: Global Leads Implementation:** Build the left panel components (List, Search input, Lead Card component). Implement the search filtering logic.
4.  **Step 4: Lead Details View:** Create the read-only view for the enriched lead data that opens when an admin clicks on a lead (e.g., a slide-over panel or modal). Include the UI for the simple audit trail log.
5.  **Step 5: Team View Implementation:** Build the right panel components showing team members and their respective leads. Incorporate the workload/capacity badges.
6.  **Step 6: Reassignment Logic:** Implement the reassignment action. This could be a clean dropdown menu on the lead card or a drag-and-drop interface, but must support bulk selection (e.g., checkboxes). Ensure the state updates correctly so the leads move from User A to User B seamlessly on the UI.
7.  **Step 7: API/Database Integration:** Connect the UI to the backend. Replace frontend state mutations with actual API calls to fetch leads, team members, and execute the reassignment mutation on the database.
