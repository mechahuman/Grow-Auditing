# 🛡️ GROW Admin Portal — Complete Specification

## Overview
The Admin Portal is a **completely separate experience** from the Team Member Dashboard. Admins have full control over:
- Team member management & role assignment
- Lead oversight & reassignment
- Product access control (whitelist management)
- Analytics & insights

---

## 🎨 UI/UX Architecture

### Left Sidebar Navigation
A persistent left sidebar with:
- **GROW Logo** (top)
- Main navigation items
- Team member badge (showing active members)
- Admin controls

**Sidebar Sections:**
```
┌─────────────────────┐
│  🏢 GROW ADMIN      │
├─────────────────────┤
│ 📊 Dashboard        │
│ 👥 Team Members     │
│ 📋 Lead Management  │
│ 📈 Analytics        │
│ 🔐 Access Control   │
│ 📝 Activity Log      │
├─────────────────────┤
│ ⚙️  Settings        │
│ 🚪 Sign Out         │
└─────────────────────┘
```

---

## 📋 Detailed Feature Breakdown

### 1. **Dashboard** (Main Landing Page)
**Purpose:** Quick overview of system health

**Key Metrics Cards:**
- 🟢 **Total Team Members**: Count + trending (↑/↓)
- 📊 **Total Leads**: Overall count
- ✅ **Completed Leads**: Leads with status != 'new' or 'draft'
- 🔄 **In Progress Leads**: Leads actively being reviewed
- 👤 **Active Members (Today)**: Team members who logged in today
- ⏳ **Pending Enrichments**: Leads waiting to be enriched

**Charts & Visualizations:**
- **Lead Status Distribution** (pie chart): new, in_progress, completed, closed
- **Team Activity Heatmap**: Who's been active in the last 7 days
- **Lead Score Distribution** (histogram): Score 1-5 distribution

**Quick Actions:**
- "View All Team Members" button
- "View All Leads" button
- "Add New Team Member" button

---

### 2. **Team Members Management**
**Purpose:** Control who can access the product & their roles

#### A. Team Member List
**Table Columns:**
- 📷 **Avatar/Initials**: Visual identifier
- 👤 **Name**: Full name
- 📧 **Email**: Google email address
- 🎭 **Role**: Admin / Member (with role badge)
- 📊 **Leads Assigned**: Count (e.g., "12 leads")
- ✅ **Status**: Active / Inactive
- 📅 **Joined Date**: When whitelisted
- ⏰ **Last Active**: Last login timestamp
- 🎛️ **Actions**: Edit, View Details, Deactivate

#### B. Whitelist Google Accounts (Add New Member)
**Modal/Form:**
```
┌─────────────────────────────────┐
│ Add Team Member                 │
├─────────────────────────────────┤
│ Google Email *                  │
│ [________________@gmail.com]     │
│                                 │
│ Full Name *                     │
│ [________________]              │
│                                 │
│ Role *                          │
│ [Dropdown: Admin / Member]      │
│                                 │
│ [ ] Send Welcome Email          │
│                                 │
│  [Cancel]  [Add Member]         │
└─────────────────────────────────┘
```

**Features:**
- ✅ Email validation (must be Gmail or whitelisted domain)
- 🎭 Role assignment (Admin / Member)
- 📧 Optional welcome email
- ✅ Auto-verify email is not already in system
- 🔍 Search existing members

#### C. Member Details Panel
When clicking on a team member:
- Full profile info
- Leads count breakdown (completed / draft / in progress)
- Last 5 activities (timeline)
- Change role (Admin ↔️ Member)
- Deactivate/Reactivate button
- View all their leads (linked to Lead Management)

---

### 3. **Lead Management**
**Purpose:** Oversight of all leads without editing capability

#### A. Global Leads List
**Table Columns:**
- 🔗 **Lead Name**: Channel name (clickable → opens review)
- 👤 **Assigned To**: Which team member is working on it
- 🎬 **YouTube Handle**: @channel
- 📊 **Subscribers**: Subscriber count
- ⭐ **Score**: Lead score (1-5)
- 📈 **Views (Last 10)**: Avg views metric
- 📋 **Status**: new / in_progress / completed / closed
- 📅 **Created**: Date added
- 🎛️ **Actions**: View Review, Reassign, Delete

**Filters:**
- Status (dropdown multi-select)
- Team Member (who it's assigned to)
- Score Range (1-5)
- Date Range (created)
- Search by lead name or handle

#### B. Lead Review View (Read-Only)
When admin clicks "View Review":
- 📋 **Full lead data**: All fields (non-editable)
- 📝 **AI Remarks Draft**: Original AI analysis
- ✏️ **Final Remarks**: Team member's edited version
- 🎨 **All Classification**: Category, content style, monetization
- 💡 **Strengths/Concerns/Data Gaps**: Array display
- 📊 **Scoring Breakdown**: All factors visualized
- 🔗 **YouTube Data**: Fetch date, video count, etc.
- 📸 **Channel Thumbnail**: Visual preview

**Admin Actions (In Review):**
- ✅ View all data
- 🔄 Reassign to another member
- 🗑️ Delete lead
- 💬 Leave internal notes (admin-only comments)
- 🔗 Open in new tab (to YouTube channel)

#### C. Bulk Operations
**Bulk Actions Toolbar** (appears when multiple leads selected):
- ✅ Select all
- 🗑️ Delete Selected (with confirmation)
- 🔄 Reassign to... (dropdown)
- 📊 Export Selected (CSV)

---

### 4. **Analytics & Insights** (Suggested Feature)
**Purpose:** Data-driven insights for product improvement

**Sections:**

#### A. Team Performance
- **Leads per Member**: Bar chart (who's most productive)
- **Completion Rate**: % of leads completed vs total
- **Avg Time to Complete**: Days from creation to completion
- **Quality Score**: Avg lead score assigned by member

#### B. Lead Insights
- **Category Distribution**: Pie chart of lead categories
- **Monetization Types**: Common monetization models found
- **Subscriber Range Distribution**: Where most leads fall
- **Status Breakdown**: How many at each stage
- **S2V Ratio Insights**: Engagement patterns

#### C. Growth Metrics
- **Leads Added Over Time**: Line chart (last 30 days)
- **Team Growth**: New members over time
- **Completion Velocity**: Leads completed per week
- **Avg Lead Score Trend**: Quality improving/declining?

---

### 5. **Access Control (Whitelist Management)**
**Purpose:** Centralized control over who can use the product

**Features:**
- ✅ **View All Whitelisted Emails**: Table with:
  - Email address
  - Role (Admin / Member)
  - Status (Active / Pending / Blocked)
  - Joined date
  - Actions (Change Role, Block, Delete)

- ✅ **Bulk Whitelist Upload** (Suggested):
  - CSV upload: `email, name, role`
  - Preview before importing
  - Error handling for duplicates

- ✅ **Block/Unblock Users**: Prevent access without deleting
  - Blocked users see "Access Denied" instead of /unauthorized

- ✅ **Invite Links** (Suggested):
  - Generate invite link: `groww-auditing-tool.vercel.app/invite?code=xyz`
  - One-time use or expiring invites
  - Track who joined via which invite

---

### 6. **Activity Log** (Suggested Feature)
**Purpose:** Audit trail for compliance

**Displays:**
- 📝 All admin actions (who made changes, when, what)
- 👤 Team member login history
- 📋 Lead creation/deletion/reassignment history
- 🎭 Role changes
- 🔐 Whitelist additions/removals
- 💬 Lead note additions

**Filters:**
- Date range
- Action type (login, create, delete, reassign, etc.)
- User (who performed action)
- Resource (which lead/member affected)

---

## 🎯 Unique Feature Suggestions

### 1. **Lead Performance Insights**
Show which team member finds the best quality leads:
- Member X has avg score: 4.2/5
- Member Y has avg score: 3.8/5
- Recognize top performers

### 2. **Duplicate Detection**
- Alert admin if same YouTube channel is added multiple times
- Show which member added each duplicate

### 3. **Enrichment Failure Log**
- Track which leads failed enrichment
- Show error messages
- Allow re-enrichment attempt

### 4. **Team Member Workload Balancing**
- Show lead assignment distribution
- Suggest who should take new leads (least loaded)
- Auto-balance option (admin click)

### 5. **Lead Scoring Trends**
- Show if team is finding higher quality leads over time
- Category trends (e.g., "Tech category leads are scoring 0.5 higher")

### 6. **Export & Reporting**
- Export all leads as CSV/Excel
- Generate monthly reports (PDF)
- Scheduled email reports

### 7. **Team Member Onboarding Checklist**
- First-time setup wizard
- Walkthrough of platform
- Sample lead to practice with

### 8. **Internal Notes & Commenting**
- Admin can leave notes on leads visible only to admins
- Use case: "This creator's channel seems suspicious, review carefully"

### 9. **Lead Scoring Audit**
- See all leads with score < 2
- Identify potential quality issues
- Flag for team review

### 10. **API Integration Status** (if applicable)
- YouTube API quota usage
- Google Sheets sync status
- Claude API usage/cost tracking

---

## 🔐 Permissions Matrix

| Action | Member | Admin |
|--------|--------|-------|
| View own leads | ✅ | ✅ |
| Create leads | ✅ | ✅ |
| Enrich leads | ✅ | ✅ |
| Edit lead remarks | ✅ | ✅ |
| View all leads | ❌ | ✅ |
| Reassign leads | ❌ | ✅ |
| Delete leads | ❌ | ✅ |
| Whitelist members | ❌ | ✅ |
| Assign roles | ❌ | ✅ |
| View team analytics | ❌ | ✅ |
| View activity log | ❌ | ✅ |
| Deactivate members | ❌ | ✅ |
| View member data | ❌ | ✅ |
| Leave admin notes | ❌ | ✅ |

---

## 📐 Responsive Design
- **Sidebar**: Collapses on mobile (hamburger menu)
- **Tables**: Horizontal scroll on mobile
- **Modals**: Full-screen on mobile
- **Charts**: Stack vertically on smaller screens

---

## 🎨 Design Consistency
- Keep the **same glassmorphism UI** as member dashboard
- Use **same color scheme** (purple/pink gradients)
- **Same typography & spacing**
- Maintain **brand consistency**

---

## 🚀 Implementation Priority

**Phase 1 (MVP):**
- Dashboard with basic metrics
- Team Members list & whitelist
- Lead Management (view, reassign, delete)
- Access Control tab

**Phase 2:**
- Lead Review viewer
- Bulk operations
- Activity Log

**Phase 3:**
- Analytics & Insights
- Advanced features (Suggestions above)
- Export/Reporting

---

## 📊 Sample Admin Page Structure

```
┌──────────────────────────────────────────────────┐
│  🛡️ ADMIN PORTAL                                │
├─────────────┬──────────────────────────────────┤
│  Sidebar    │  Main Content Area               │
│             │                                   │
│ 📊 Dash     │  [Metrics Cards]                 │
│ 👥 Members  │  [Charts]                        │
│ 📋 Leads    │  [Quick Actions]                 │
│ 📈 Analytics│                                   │
│ 🔐 Access   │                                   │
│ 📝 Activity │                                   │
│             │                                   │
│ ⚙️ Settings │                                   │
│ 🚪 Sign Out │                                   │
└─────────────┴──────────────────────────────────┘
```

---

## ✅ Summary
This admin portal transforms your app from a **simple tool** into a **complete team management system**. Admins gain:
- Full visibility into team activities
- Control over product access
- Data-driven insights
- Oversight without micromanagement
- Audit trail for compliance

The design keeps the beautiful glassmorphic aesthetic while adding powerful administrative capabilities.
