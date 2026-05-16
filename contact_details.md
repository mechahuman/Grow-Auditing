# Contact Details Feature Implementation Guide

This document outlines the step-by-step implementation for adding the "Contact Details" extraction and display feature to the GROW Audit Tool. Feed these instructions to a coding agent to build the feature accurately.

## 1. Goal
Retrieve and display contact information (Email, Instagram, Twitter/X) from the YouTube channel's data and ensure it has a dedicated section in the Review UI.

## 2. Implementation Steps

### Step 2.1: Data Extraction Logic Update
The system is already fetching the channel description and video descriptions. Update the data parsing logic to actively look for contact information:
- **Email Extraction**: Implement a Regex pattern (e.g., `/[\w\.-]+@[\w\.-]+\.\w+/g`) to scan the channel's `description` (from the YouTube API `snippet` or scraped about page) and video descriptions for email addresses. 
- **Social Media Extraction**: Use Regex or URL parsing to find links matching `instagram.com/*`, `twitter.com/*`, and `x.com/*`.
- Ensure the extraction favors the channel's "About" section as the primary source of truth, falling back to recent video descriptions if needed.

### Step 2.2: Data Schema Updates
Update all relevant schemas to accommodate the new fields:
- **TypeScript Interfaces**: Update the Lead interface/type definition to include `email` (string), `instagram` (string), and `twitter` (string). All should be optional/nullable.
- **Supabase Database**: Add columns for `email`, `instagram`, and `twitter` to the existing leads table. Create a migration script if necessary.
- **API Routes**: Update the `app/api/save/route.ts` and `app/api/leads/[id]/route.ts` to accept, validate, and save these new fields.

### Step 2.3: UI Updates (The Review Screen)
Modify the Review UI (`app/(authenticated)/leads/[id]/review/page.tsx` and related components like `LeadView.tsx` or `ReviewForm.tsx`):
- Create a distinct, visually separated section titled **"Contact Details"**.
- Display the extracted Email, Instagram handle, and Twitter handle.
- **Editable Fields**: Ensure these fields are editable. If the regex failed to find an email but the user finds one manually, they should be able to input it into the form before saving.
- Include one-click "Copy to Clipboard" buttons next to the email and social handles for ease of outreach.

## 3. Context & Rationale
Since the API already accesses the descriptions and about pages, retrieving this data is a low-cost, high-reward feature. Keeping a dedicated "Contact Details" section ensures users have immediate access to the outreach vectors once the audit is complete.
