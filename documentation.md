# Lead Intelligence & Contextual Scouting System — Documentation

*Documentation file made by Manav Bhavsar*

---

## Project Overview

We built a human-assisted AI lead scouting system that drastically accelerates how we evaluate YouTube creators. Instead of spending time manually clicking through channels and calculating stats, a team member simply pastes a YouTube URL into the app. The system automatically fetches channel data, calculates a lead score based on our rubric, and generates a first-draft AI analysis of the channel's strengths and weaknesses for human review. It completely replaces the tedious, manual data-entry phase of lead generation.

---

## Why We Built This

Previously, researching a single creator took over 30 minutes of manual clicking, watching, and copy-pasting. We had to dig up subscriber counts, view averages, hunt for contact info, manually calculate a lead score, and type up qualitative notes into a spreadsheet. This repetitive data entry was frustrating and took time away from actual decision-making. We built this to eliminate the boring data-collection phase and let the team focus purely on reviewing the final, standardized results.

---

## My Manual Calibration Notes

During Week 1-2, I took a step back to manually analyze how we currently search for and grade leads. By manually reviewing about 5–10 leads from start to finish, I was able to get a genuine feel for the friction in our process.

What became immediately clear is that YouTube leads come with a lot of hidden "gotchas." The top-level numbers rarely tell the full story. For instance, I kept running into issues like:
- **Dead Audiences:** Channels with massive subscriber counts, but their recent videos barely crack a few thousand views.
- **Irregular Uploads:** Creators who look great on paper but haven't posted consistently in months, or have completely abandoned their schedule.
- **The Shorts Illusion:** Channels where all the growth comes from 15-second Shorts, while their long-form, highly engaging content is struggling to get reach.
- **Content Pivots:** Creators who built their audience on one niche (like gaming) but recently pivoted to something entirely different, completely skewing their historical view data.
- **Hidden Contact Info:** Finding a simple business email or a link to their website was often a tedious scavenger hunt through their 'About' page and other social links.

Doing this manually helped me realize that our AI shouldn't just look at total vanity metrics like total subscribers or total views—it needs to flag these deeper context clues (like the Views-to-Subscribers ratio and upload consistency). This manual process gave me the baseline I needed to properly grade whether the AI is actually being helpful later on.

---

## Decisions I Made and Why

- Next.js 14: Selected to keep the frontend and backend in a single, cohesive codebase, making it easier to deploy and maintain.
- Dual Data Storage (Supabase + Google Sheets): We decided to use dual storage. Google Sheets serves as the daily operational "whiteboard" because the team is already used to it. Supabase acts as the secure "vault" to keep historical records and raw AI responses.
- Groq AI: Chosen for the trial phase because of its free tier and blazing-fast generation speeds.
- Authentication: Used Supabase email/password instead of magic links because it's simpler and the team preferred a standard login flow. Google Gmail login for team members.
- Project Decoupling: We separated the "Autonomous Lead Generation" project into its own dedicated repository so this core Audit Tool remains focused on human-assisted scoring.

---

## How the AI Prompt Evolved

The first version of the prompt was basically just "Here is the YouTube data, write a summary." The results were pretty terrible. The AI hallucinated wildly—guessing the creator's revenue, inventing sponsors that didn't exist, and using overly enthusiastic "marketing speak" that felt completely unnatural.

It took about 4 or 5 iterations to get it right. The biggest game-changer was shifting the prompt's tone from "Write a marketing summary" to "Act as a clinical, data-driven lead analyst." I also had to explicitly add a rule: *"NEVER invent numbers, and if data is missing, output 'Not visible' rather than guessing."*

Another key wording change was forcing the AI to format its output into strict JSON categories (Category, Strengths, Concerns, Remarks Draft). This stopped it from rambling and made the outputs highly predictable.

---

## Calibration Findings

Comparing the AI's output to my manual baseline from Weeks 1-2 was eye-opening. The AI and I almost always agreed on the core math—the Lead Score calculation is airtight. Where the AI really shined was in category classification; it correctly identified niche markets (like "cozy gaming" or "ADHD productivity") much faster than I could.

However, the AI missed some of the nuance when it came to "Concerns." For example, it would see a drop in posting frequency and flag it as a negative concern, without realizing the creator might have just shifted to high-production documentary-style videos (which take much longer to make). 

The strengths and concerns were largely useful as a starting point, but the "Remarks Draft" usually needed a bit of light editing to sound like it was written by one of our team members rather than a robot. Ultimately, this reinforced our core philosophy: The AI does the heavy lifting on research, but a human *must* make the final call and inject the context.

---

## Things That Broke and What I Learned

* The initial YouTube API setup was tricky. I kept hitting rate limits when trying to pull data for many channels quickly. I had to implement a caching layer and a more robust error-handling system to gracefully manage these limits instead of crashing the whole app.
* The AI sometimes hallucinated business emails. I learned that relying solely on the scraping logic was risky, so I added a human review step to verify contact information before accepting it as final.
* We hit a roadblock with Google Login—the redirect URIs kept failing. I learned that this happens when the Supabase and Google Cloud Console settings fall out of sync. Fixing it required carefully syncing the credentials and callback URLs between Supabase and Google to ensure they matched perfectly.

---

## Real Usage Feedback

During the Week 4 testing phase, I rolled the tool out to the team to get their unfiltered feedback.

The immediate reaction was overwhelmingly positive—they loved how fast and accurate the initial enrichment felt. One teammate mentioned that the automated lead enrichment was "really nice and working perfectly," saving them from doing the boring manual data entry.

However, they did have one major feature request almost immediately: *What happens when the AI misses a piece of info during the first pass?* They suggested a "re-enrichment" feature that could grab information that wasn't caught earlier and enrich the lead in more depth. 

Because of this feedback, I went back and actually built and integrated a **Re-Enrichment Feature**. Now, if the system missed something or if we want to run a deeper scan later, the team can just click a button to pull the latest missing data without having to start over.


---

## Open Questions / Things I'm Still Unsure About

- **Post-Enrichment Lifecycle:** I am still unsure about what exactly happens after enrichment or how they will be saved long-term. Once a lead is in the Google Sheet and Supabase, how does the outreach actually begin? Do we need to build a status tracker directly into our app?
- **Admin Portal Integration:** I am also not fully done with connecting the admin portal with the teammates and the leads. I want managers to be able to easily see who is finding the highest-quality leads, but cleanly linking the team member's Auth ID with all their historical lead records is still a work in progress.
- **Handling API Quotas with Re-Enrichment:** We are fine on the YouTube API quota right now, but since we added the "Re-Enrichment" feature, I'm slightly worried about a teammate accidentally spamming it and draining our daily API limits.
- **The "Stale Data" Problem:** If a lead is saved but no one reaches out to them for 6 months, their subscriber count and recent video stats will be completely outdated. Should the system automatically flag leads older than 90 days and warn the user, or automatically trigger a background re-enrichment?

---

## For the Manager Writeup

### What Was Built
We built a web application that serves as a high-speed research assistant. A user inputs a YouTube URL, and the system automatically pulls channel analytics, calculates a mathematical Lead Score based on size and engagement, and uses an AI model to draft an analysis of the creator's niche and content style. The human user reviews, edits the analysis, and saves the finalized lead directly to the team's shared Google Sheet and an internal Supabase database.

### What Worked Well
- The integration between the YouTube API, Groq AI, and Google Sheets is seamless and reduces workflow time to under 60 seconds.
- The split-screen Review & Edit interface makes it easy for the human to compare raw data against AI drafts.
- Decoupling the "Autonomous" lead generation project from this manual audit tool kept the codebase clean and focused.

### What Didn't Work / What Surprised Us
- Ensuring the AI stuck strictly to the facts without hallucinating required careful prompt engineering.
- Handling rate limits and graceful fallbacks when the YouTube API or scraping failed took extra edge-case logic.
- We discovered that scraping the YouTube 'About' page for emails wasn't always reliable due to YouTube's structure, so it had to be treated as a soft fallback rather than a guarantee.

### What I'd Do Differently
- I would have built the admin portal structure earlier to track API usage and team metrics from day one.
- Abstract the AI provider interface sooner to allow switching between Groq and Claude with zero friction.

### Recommendations for v2
- Finish the Admin implementation roadmap to track team performance and duplicate lead detection.
- Add support for gathering stats from other platforms like Instagram or TikTok.
- Introduce an "AI memory layer" to show how similar past leads performed.

---
