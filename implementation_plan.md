# Implementation Plan - Representative Feedback & Outreach

## Goal Description
Address user bottlenecks regarding **Customer Representation**, **Tedious Outreach**, and **Communication Overload** by building an AI-native "Product Nerve Center."

## Competitive Analysis & AI Value Add
| Problem | Traditional ERPs/Tools (Salesforce, Pendo, Dovetail) | AI-Native Solution (Our Approach) |
| :--- | :--- | :--- |
| **Finding Users** | Manual filtering of rows ("Find users in PST..."). Passive charts. | **Active Bias Detection**: "Warning: 80% of feedback is US-centric." |
| **Outreach** | Export CSV -> Mailchimp -> Manual Email. | **Agentic Loop**: "Find 5 churned users -> Draft personalized emails -> Send." |
| **Feedback** | Passive lists. "Search" is keyword-based. | **Intelligent Triage**: Auto-categorize (Bug/Feature), Auto-draft replies, Auto-link to Strategy. |

## User Review Required
> [!IMPORTANT]
> This plan introduces new "Demographic" insights which might require specific column names in the CSV (e.g., "Country", "Language"). We will use fuzzy matching to detect them.

## Proposed Changes

### Backend (`backend/app/`)

#### [MODIFY] [schemas.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/models/schemas.py)
- Add `DemographicStats` to `DatasetDetailResponse`.
- Add `OutreachDraftRequest` (segment_id, goal) and `OutreachDraftResponse` (subject, body).
- Add `InboxMessage` model for the Communication Hub (id, content, sentiment, auto_tags).

#### [MODIFY] [data_processor.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/data_processor.py)
- Implement `detect_demographic_columns(df)` using regex/smart matching.
- Calculate distribution stats for detected demographic columns.
- Update `get_dataset_summary` to return these stats.

#### [MODIFY] [insight_engine.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/insight_engine.py)
- Add `generate_representation_insights`:
    - **Bias Check**: Compare user count distribution vs. ideal (e.g., "US is 90% of rows").
    - **Gap Analysis**: "You have 0 feedback from Enterprise tier."

#### [NEW] [outreach_service.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/outreach_service.py)
- `draft_target_outreach(segment_criteria, goal)`: Uses Claude to write a contextual email.
    - Context: "User spent 5k, churned last week." -> Email: "Saw you left..."
- `localize_draft(draft, target_language)`: Translates/localizes content.

#### [NEW] [inbox_service.py](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/backend/app/services/inbox_service.py)
- `auto_triage(message)`: Uses Claude to tag (Bug/Feature), Sentiment (1-10), and Urgency.
- `draft_reply(message)`: Auto-generates a polite acknowledgment or clarification question.

### Frontend (`frontend/src/`)

#### [MODIFY] [api.ts](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/lib/api.ts)
- Add endpoints for `draft_outreach` and `fetch_inbox`.

#### [NEW] [RepresentationCard.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/dashboard/RepresentationCard.tsx)
- Visualizes "Who we are hearing from" vs "Who we aren't".
- Action: "Fix Bias" -> Triggers Outreach Modal.

#### [NEW] [OutreachModal.tsx](file:///Users/krishgarg/Documents/Projects/cursor-for-PMs/frontend/src/components/outreach/OutreachModal.tsx)
- UI to select a segment and generate an email draft with one click.
- "Translate to Spanish" toggle.

## Verification Plan

### Automated Tests
- **Data Processor**: Unit test `detect_demographic_columns` with sample CSVs.
- **Insight Engine**: Test `generate_representation_insights` with a biased dataset.
- **Outreach Service**: Mock Claude response and verify `draft_outreach` returns a string.

### Manual Verification
1.  **Upload Biased Dataset**: Upload a CSV with only "US" users.
2.  **Check Dashboard**: Verify a "Representation Bias" card appears.
3.  **Test Outreach**: Click "Fix Bias" -> "Draft Outreach", verify a localized email is generated.
4.  **Inbox**: Send a mock feedback message, verify it gets auto-tagged correctly.
