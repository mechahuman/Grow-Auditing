# Admin Portal Implementation Roadmap

## Implementation Strategy
Build incrementally with full testing at each stage. Features will be integrated one after another.

---

## Phase 1: Foundation & Dashboard (Current)
Redesign the basic admin layout with sidebar and dashboard metrics.

**Tasks:**
- [ ] Create new admin layout with left sidebar
- [ ] Build dashboard with key metrics cards
- [ ] Verify styling matches existing glassmorphism theme
- [ ] Test responsive design

**Deliverable:** Basic admin dashboard structure

---

## Phase 2: Lead Performance Insights
Show team member performance based on lead quality.

**Database Queries Needed:**
- Calculate avg lead score per team member
- Count total leads per member
- Track lead quality trends

**UI Components:**
- Performance cards (Member name, avg score, trend indicator)
- Leaderboard table (sortable by score, completion rate)
- Top performers recognition badge

**Testing:**
- Verify calculations are correct
- Test with sample data (multiple members, various scores)
- Check performance with large datasets

---

## Phase 3: Duplicate Detection
Alert admin about duplicate YouTube channels.

**Database Logic:**
- Query leads grouped by youtube_channel_id
- Identify duplicates (same channel_id, multiple leads)
- Track which member added each duplicate
- Store creation dates for comparison

**UI Components:**
- Duplicate detection dashboard section
- Table showing: Channel name, Members who added it, Dates
- Merge/consolidate options
- History of duplicates

**Testing:**
- Add test data with known duplicates
- Verify detection works
- Test merge functionality
- Check data integrity after operations

---

## Phase 4: Lead Scoring Trends
Analyze if team is finding higher quality leads over time.

**Database Queries:**
- Leads grouped by created_at (weekly/monthly)
- Avg score trends over time
- Category-wise score averages
- Comparison: current week vs previous week

**UI Components:**
- Line chart: Lead score trend over 30/90 days
- Category breakdown (Tech, Finance, Gaming, etc.)
- Trend indicators (up/down)
- Comparison stats

**Testing:**
- Test with 30/60/90 day ranges
- Verify calculations are accurate
- Test with different categories
- Check chart rendering

---

## Phase 5: Internal Notes & Commenting
Admins can leave private notes on leads.

**Database Changes:**
- Create new table: lead_admin_notes
  - id (uuid)
  - lead_id (uuid, fk)
  - admin_id (uuid, fk)
  - content (text)
  - created_at (timestamptz)
  - updated_at (timestamptz)

**UI Components:**
- Notes section in lead review panel
- Add note button + textarea modal
- Display existing notes with timestamps
- Edit/delete own notes
- Notes visible only to admins

**Testing:**
- Test CRUD operations (Create, Read, Update, Delete)
- Verify only admins see notes
- Test with multiple notes on same lead
- Check timestamps are accurate

---

## Phase 6: Lead Scoring Audit
Identify leads with low scores for quality review.

**UI Components:**
- Audit dashboard section
- Filter: Score range (1.0 - 2.5)
- Table: Lead name, score, assigned member, creation date
- Action: Flag for review, Re-enrich option
- Comments from admins

**Database:**
- Mark leads for review (new status: flagged_for_review)
- Store who flagged and when
- RLS: Only admins can flag

**Testing:**
- Test filtering by score range
- Verify correct leads are shown
- Test flag functionality
- Check that flagged leads are tracked

---

## Phase 7: Export & Reporting
Export leads and generate reports.

**Features:**
- CSV Export
  - All leads or filtered subset
  - Include: Name, channel, score, status, assigned member, date
  
- PDF Monthly Report
  - Summary stats
  - Charts/graphs
  - Team performance
  - Lead distribution
  
- Scheduled Email Reports
  - Admin settings page to configure
  - Send weekly/monthly summaries
  - Track delivery status

**Database:**
- Store export history
- Log report generation
- Track email sends

**Testing:**
- Export small dataset (10 leads)
- Export large dataset (1000+ leads)
- Verify CSV formatting
- Test PDF generation
- Test email delivery
- Check file downloads work

---

## Phase 8: API Integration Status
Show system health metrics.

**Metrics to Track:**
- YouTube API quota usage (API calls used / daily limit)
- Google Sheets sync status (last sync time, success/failure)
- Claude API usage (tokens used, estimated cost)

**Database:**
- Create new table: api_usage_logs
  - service (youtube, sheets, claude)
  - operation (enrich, sync, export)
  - timestamp
  - status (success/failure)
  - cost/tokens used

**UI Components:**
- API Status dashboard
- Cards showing: Service, Usage %, Last sync, Status
- Historical charts (daily usage trends)
- Alert if quota getting low

**Testing:**
- Verify calculations from logs
- Test with real API calls
- Check status updates in real-time
- Test alerts trigger correctly

---

## Phase 9: Full Test Suite
Comprehensive testing of all features together.

**Integration Testing:**
- Test all features working together
- Performance testing with full dataset
- Load testing (multiple admins accessing simultaneously)
- Security testing (verify RLS policies work)

**User Acceptance Testing:**
- Manual testing of all workflows
- Edge case testing
- Mobile responsiveness
- Browser compatibility

---

## Implementation Order
1. Phase 1: Dashboard Foundation
2. Phase 2: Lead Performance Insights
3. Phase 3: Duplicate Detection
4. Phase 4: Lead Scoring Trends
5. Phase 5: Internal Notes & Commenting
6. Phase 6: Lead Scoring Audit
7. Phase 7: Export & Reporting
8. Phase 8: API Integration Status
9. Phase 9: Full Test Suite

---

## Testing Checklist Template
For each phase:

```
Feature: [Feature Name]
Status: [ ] Not Started [ ] In Progress [ ] Complete

Database Tests:
- [ ] Queries return correct data
- [ ] Performance is acceptable
- [ ] No SQL errors

UI Tests:
- [ ] Components render correctly
- [ ] Responsive on mobile/tablet/desktop
- [ ] Styling matches design system

Functional Tests:
- [ ] Main workflow works end-to-end
- [ ] Edge cases handled
- [ ] Error states display properly

Integration Tests:
- [ ] Works with other features
- [ ] RLS policies enforced
- [ ] No conflicts with existing code

Performance Tests:
- [ ] Loads in < 2 seconds
- [ ] Handles large datasets
- [ ] No memory leaks
```

---

## Notes
- No emojis in production code
- Clean, readable SQL queries
- Proper error handling
- TypeScript type safety
- RLS policies for all database operations
- Comprehensive testing before moving to next phase

