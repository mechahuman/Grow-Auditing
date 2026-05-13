# AI Calibration Baseline: Manual Scoring

**Objective:** Before we write the AI system prompt, we need a baseline of human-scored leads. This document serves as the ground truth. We will feed these examples into the AI so it learns *exactly* how you want it to analyze channels and write remarks.

**Instructions:**
Please manually score 15 different YouTube channels that represent a mix of your target audience (some good fits, some bad fits). 

For each lead, fill out the template below:

---

### Lead 1: [Channel Name]
- **Channel URL:** 
- **Subscribers:** 
- **Average Views (last 10 vids):** 
- **Sub Range Factor Score (0, 0.5, or 1):** 
- **S2V Factor Score (0 or 1):** 
- **G-Factor (1 to 5):** 
- **Total Score:** 
- **Human Remark / Analysis:**
  > *(Write the exact kind of analysis you want the AI to generate for this channel. Be critical. Mention what they are doing wrong, why they are a good/bad fit for your company, and what could be improved.)*

---

### Lead 2: [Channel Name]
- **Channel URL:** 
- **Subscribers:** 
- **Average Views (last 10 vids):** 
- **Sub Range Factor Score (0, 0.5, or 1):** 
- **S2V Factor Score (0 or 1):** 
- **G-Factor (1 to 5):** 
- **Total Score:** 
- **Human Remark / Analysis:**
  > *(Your manual analysis here)*

---

### Lead 3: [Channel Name]
- **Channel URL:** 
- **Subscribers:** 
- **Average Views (last 10 vids):** 
- **Sub Range Factor Score (0, 0.5, or 1):** 
- **S2V Factor Score (0 or 1):** 
- **G-Factor (1 to 5):** 
- **Total Score:** 
- **Human Remark / Analysis:**
  > *(Your manual analysis here)*

---

### Lead 4: [Channel Name]
- **Channel URL:** 
- **Subscribers:** 
- **Average Views (last 10 vids):** 
- **Sub Range Factor Score (0, 0.5, or 1):** 
- **S2V Factor Score (0 or 1):** 
- **G-Factor (1 to 5):** 
- **Total Score:** 
- **Human Remark / Analysis:**
  > *(Your manual analysis here)*

---

### Lead 5: [Channel Name]
- **Channel URL:** 
- **Subscribers:** 
- **Average Views (last 10 vids):** 
- **Sub Range Factor Score (0, 0.5, or 1):** 
- **S2V Factor Score (0 or 1):** 
- **G-Factor (1 to 5):** 
- **Total Score:** 
- **Human Remark / Analysis:**
  > *(Your manual analysis here)*

---

*(Please copy/paste the template block above 10 more times until you reach 15 total leads.)*

---

## What happens after you finish this?
Once you have filled this out, we will use these 15 examples to craft a powerful `system_prompt` for the AI (using the Groq API). The AI will use your examples to learn your exact scoring philosophy and writing style.
