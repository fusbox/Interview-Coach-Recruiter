#!/bin/bash
 
# Interview Coach for Recruiters - File Setup Script
# Creates documentation files only (assumes folder structure exists)
 
set -e
 
echo "Creating project files..."
 
# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js
 
# Build outputs
dist/
build/
.next/
out/
.vercel/
 
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
 
# IDE
.idea/
.vscode/
*.swp
*.swo
*~
 
# OS
.DS_Store
Thumbs.db
 
# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
 
# Testing
coverage/
.nyc_output/
 
# TypeScript
*.tsbuildinfo
 
# Misc
*.pem
.cache/
EOF
 
echo "Created .gitignore"
 
# Create README.md
cat > README.md << 'EOF'
# Interview Coach for Recruiters
 
AI-powered interview practice platform for staffing recruiters and their candidates.
 
## Overview
 
This application enables recruiters to invite job candidates to complete mock screening interviews. Candidates practice answering competency-based questions and receive AI-generated feedback, while recruiters gain visibility into candidate preparation.
 
## Project Status
 
🚧 **Pre-Development** — Currently in requirements and design phase.
 
## Documentation
 
All project documentation lives in the `/docs` folder:
 
| Phase | Documents | Status |
|-------|-----------|--------|
| **Discovery** | [Project Charter](docs/01-discovery/project-charter.md), [Stakeholder Map](docs/01-discovery/stakeholder-map.md) | ✅ Draft |
| **Requirements** | [Personas](docs/02-requirements/personas/), [User Stories](docs/02-requirements/user-stories.md), Use Cases | 🔄 In Progress |
| **Design** | User Flows, Wireframes, Design System | ⏳ Pending |
| **Architecture** | System Design, Data Model, API Spec, Security | ⏳ Pending |
| **Quality** | Test Strategy, AI Eval Strategy | ⏳ Pending |
| **Project** | Roadmap, Risk Register, Decision Log | ⏳ Pending |
 
## Quick Links
 
- [Project Charter](docs/01-discovery/project-charter.md) — Why we're building this
- [Recruiter Persona](docs/02-requirements/personas/recruiter-persona.md) — Who recruiters are
- [Candidate Persona](docs/02-requirements/personas/candidate-persona.md) — Who candidates are
- [User Stories](docs/02-requirements/user-stories.md) — What users need to do
 
## Tech Stack (Planned)
 
| Layer | Technology |
|-------|------------|
| Frontend | React, TypeScript, Tailwind CSS |
| Backend | Vercel Serverless Functions |
| Database | Supabase (PostgreSQL) |
| AI | Google Gemini 2.5 Flash |
| Auth | Supabase Auth |
| Hosting | Vercel |
 
## Development
 
```bash
# Install dependencies
npm install
 
# Run development server
npm run dev
 
# Run tests
npm test
 
# Build for production
npm run build
```
 
## License
 
Proprietary — [Company Name]
EOF
 
echo "Created README.md"
 
# Create docs/README.md
cat > docs/README.md << 'EOF'
# Documentation Index
 
This folder contains all project documentation for Interview Coach for Recruiters.
 
## Reading Order
 
1. **[Project Charter](01-discovery/project-charter.md)** — Understand why we're building this
2. **[Recruiter Persona](02-requirements/personas/recruiter-persona.md)** — Meet the primary user
3. **[Candidate Persona](02-requirements/personas/candidate-persona.md)** — Meet the end user
4. **[User Stories](02-requirements/user-stories.md)** — See what we're building
5. **[Stakeholder Map](01-discovery/stakeholder-map.md)** — Know who's involved
 
## Document Status
 
| Document | Status | Last Updated |
|----------|--------|--------------|
| Project Charter | ✅ Draft | 2025-01-29 |
| Stakeholder Map | ✅ Draft | 2025-01-29 |
| Recruiter Persona | ✅ Draft | 2025-01-29 |
| Candidate Persona | ✅ Draft | 2025-01-29 |
| User Stories | ✅ Draft | 2025-01-29 |
| Use Cases | ⏳ Pending | — |
| User Flows | ⏳ Pending | — |
| Wireframes | ⏳ Pending | — |
| Architecture | ⏳ Pending | — |
EOF
 
echo "Created docs/README.md"
 
# Create docs/01-discovery/project-charter.md
cat > docs/01-discovery/project-charter.md << 'EOF'
# Project Charter: Interview Coach for Recruiters
 
## Document Control
 
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-29 | [Your Name] | Initial draft |
 
---
 
## 1. Project Overview
 
### 1.1 Project Name
**Interview Coach for Recruiters** (working title)
 
### 1.2 Project Summary
A standalone web application that enables recruiters at [Company Name] to invite job candidates to complete AI-powered mock screening interviews. The platform provides candidates with a supportive practice environment while giving recruiters visibility into candidate preparation and readiness.
 
### 1.3 Background & Context
This project originated from an interview coaching application developed for integration into a Medicaid member job portal (MCO partnership). The core interview simulation and AI feedback engine has been validated through internal testing.
 
This "Recruiter Path" extracts and adapts the proven interview flow for use by staffing company recruiters with a general candidate population (not limited to Medicaid members). It serves dual purposes:
1. **Immediate value**: A tool for recruiters to help candidates prepare for screening calls
2. **Validation**: UAT of the core mock interview flow and AI feedback quality
 
### 1.4 Strategic Alignment
- Differentiates [Company Name] from competitors by offering candidate preparation tools
- Reduces recruiter time spent on unprepared candidates
- Creates potential future revenue stream (MSP licensing, ATS integration)
- Demonstrates innovation capability to clients and partners
 
---
 
## 2. Objectives & Success Criteria
 
### 2.1 Business Objectives
 
| Objective | Measurable Outcome |
|-----------|-------------------|
| Improve candidate preparation | Recruiters report candidates are better prepared for screening calls |
| Increase recruiter efficiency | Reduction in "no-show" or poorly prepared screening calls |
| Validate core interview engine | AI feedback quality confirmed through recruiter/candidate feedback |
| Build reusable platform | Architecture supports future ATS integration and MSP licensing |
 
### 2.2 Success Metrics
 
> _TODO: Define specific targets with stakeholders_
 
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Candidate completion rate | ≥ X% | Sessions completed / invites sent |
| Recruiter adoption | X recruiters actively using | Weekly active users |
| Candidate satisfaction | ≥ X/5 rating | Post-session survey |
| Recruiter satisfaction | ≥ X/5 rating | Monthly survey |
 
### 2.3 Non-Goals (Explicit Exclusions)
 
- [ ] Integration with external ATS systems (future phase)
- [ ] Candidate account management / profile building
- [ ] Resume analysis or optimization
- [ ] Job matching or recommendations
- [ ] Medicaid-specific compliance requirements
- [ ] MCO reporting and engagement tracking complexity
- [ ] White-labeling for external clients
 
---
 
## 3. Scope
 
### 3.1 In Scope
 
**Recruiter Capabilities:**
- [ ] Create and configure interview practice sessions
- [ ] Generate shareable invite links for candidates
- [ ] View list of invited candidates and their status
- [ ] Review completed session results and AI feedback
- [ ] Access candidate readiness indicators (TBD: scope of signals)
 
**Candidate Capabilities:**
- [ ] Access practice session via invite link (no account required)
- [ ] Complete AI-powered mock screening interview
- [ ] Receive real-time feedback on responses
- [ ] Review session summary and improvement suggestions
 
**Platform Capabilities:**
- [ ] Role-based access (Recruiter vs Candidate)
- [ ] Session configuration (role type, question count, difficulty)
- [ ] AI-generated competency-based questions
- [ ] Voice and text input for responses
- [ ] AI analysis and structured feedback
- [ ] Session persistence and retrieval
 
### 3.2 Out of Scope (V1)
 
- Batch invite management (V1.1)
- Custom question templates (V1.1)
- Team/organization management (V1.1)
- Analytics dashboard for recruiters (V1.1)
- ATS integration (V2)
- White-label/branding options (V2)
- Mobile native apps (evaluate post-V1)
 
---
 
## 4. Stakeholders
 
| Stakeholder | Role | Interest | Influence | Engagement Level |
|-------------|------|----------|-----------|------------------|
| [Name] | Project Sponsor | Strategic direction, budget | High | Inform |
| [Name] | Product Owner | Requirements, priorities | High | Collaborate |
| Recruiting Team Lead | Primary User Rep | Usability, adoption | High | Collaborate |
| Recruiters | End Users | Daily usability | Medium | Consult |
| Candidates | End Users | Experience quality | Medium | Test |
| IT/Security | Technical oversight | Compliance, security | Medium | Consult |
| [You] | Developer | Technical implementation | High | Responsible |
 
---
 
## 5. Constraints & Assumptions
 
### 5.1 Constraints
 
| Constraint | Impact | Mitigation |
|------------|--------|------------|
| Single developer | Limited velocity | Prioritize ruthlessly, reuse existing code |
| No dedicated UX designer | Design quality risk | Use existing design system, validate with users |
| Budget for AI API calls | Cost management | Monitor usage, implement rate limiting |
 
### 5.2 Assumptions
 
| Assumption | If False... |
|------------|-------------|
| Recruiters will adopt a new tool | Need change management / training |
| Candidates will complete sessions | Need to optimize for completion |
| Existing AI feedback quality is sufficient | Need additional prompt engineering |
| Voice input works reliably | Need robust text fallback |
| Magic links are secure enough | May need account requirement |
 
---
 
## 6. Risks
 
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low recruiter adoption | Medium | High | Early involvement, training, quick wins |
| Poor candidate completion rates | Medium | Medium | Optimize UX, clear expectations, mobile-friendly |
| AI feedback quality issues | Low | High | Eval framework, prompt iteration, human review |
| Security vulnerabilities | Low | High | Security review, penetration testing |
| Scope creep | High | Medium | Strict change control, documented scope |
 
---
 
## 7. High-Level Timeline
 
> _TODO: Define with stakeholders_
 
| Phase | Duration | Key Deliverables |
|-------|----------|------------------|
| **Discovery & Design** | X weeks | Charter, Personas, User Stories, Wireframes |
| **Architecture & Setup** | X weeks | Technical design, infrastructure, CI/CD |
| **Core Development** | X weeks | MVP features, integration |
| **Testing & QA** | X weeks | UAT, bug fixes, security review |
| **Pilot Launch** | X weeks | Limited rollout to select recruiters |
| **Full Launch** | X weeks | General availability |
 
---
 
## Appendix A: Glossary
 
| Term | Definition |
|------|------------|
| **Candidate** | Job seeker invited by a recruiter to practice |
| **Recruiter** | [Company] staff member who invites and reviews candidates |
| **Session** | A complete mock interview (multiple questions) |
| **Invite** | A shareable link that grants candidate access to a session |
| **Readiness Signal** | Indicator of candidate's preparation level (scope TBD) |
| **Competency Blueprint** | AI-generated framework of skills relevant to a role |
EOF
 
echo "Created docs/01-discovery/project-charter.md"
 
# Create docs/01-discovery/stakeholder-map.md
cat > docs/01-discovery/stakeholder-map.md << 'EOF'
# Stakeholder Map
 
## Document Control
 
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-29 | [Your Name] | Initial draft |
 
---
 
## 1. Primary Stakeholders (Direct Users)
 
### Recruiters (Internal)
| Attribute | Details |
|-----------|---------|
| **Who** | [Company Name] recruiting staff |
| **Count** | ~[X] recruiters |
| **Interest** | Tool that helps them place candidates faster |
| **Influence** | High (adoption determines success) |
| **Concerns** | Learning curve, time investment, candidate experience |
| **Needs** | Fast setup, clear results, reliable tool |
| **Engagement** | Collaborate (involve in design, pilot testing) |
 
### Candidates (External)
| Attribute | Details |
|-----------|---------|
| **Who** | Job seekers invited by recruiters |
| **Count** | Variable (depends on recruiter usage) |
| **Interest** | Better preparation, get the job |
| **Influence** | Medium (completion rates affect value) |
| **Concerns** | Time investment, privacy, usefulness |
| **Needs** | Easy access, helpful feedback, mobile-friendly |
| **Engagement** | Test (usability testing, feedback surveys) |
 
---
 
## 2. Secondary Stakeholders (Decision Makers)
 
### Project Sponsor
| Attribute | Details |
|-----------|---------|
| **Who** | [Name/Title] |
| **Interest** | ROI, strategic differentiation, innovation showcase |
| **Influence** | High (budget, go/no-go decisions) |
| **Concerns** | Cost, timeline, demonstrable value |
| **Needs** | Clear metrics, progress visibility |
| **Engagement** | Inform (regular updates, milestone reviews) |
 
### Recruiting Leadership
| Attribute | Details |
|-----------|---------|
| **Who** | Recruiting Manager / Director |
| **Interest** | Team productivity, candidate quality, adoption |
| **Influence** | High (drives team adoption) |
| **Concerns** | Change management, training burden |
| **Needs** | Evidence of value, easy rollout plan |
| **Engagement** | Collaborate (requirements input, pilot coordination) |
 
---
 
## 3. Stakeholder Matrix (Power/Interest)
 
```
                    HIGH INTEREST
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         │   KEEP        │    MANAGE     │
         │  SATISFIED    │    CLOSELY    │
         │               │               │
         │  IT/Security  │  Sponsor      │
         │               │  Recruiting   │
   LOW   │               │  Leadership   │   HIGH
  POWER  ├───────────────┼───────────────┤  POWER
         │               │               │
         │   MONITOR     │    KEEP       │
         │               │   INFORMED    │
         │               │               │
         │  (none)       │  Recruiters   │
         │               │  Candidates   │
         │               │               │
         └───────────────┼───────────────┘
                         │
                    LOW INTEREST
```
 
---
 
## 4. RACI Matrix
 
| Decision | Responsible | Accountable | Consulted | Informed |
|----------|-------------|-------------|-----------|----------|
| Feature scope & priority | Product Owner | Sponsor | Recruiters | Dev |
| UX/UI design approval | Dev | Product Owner | Recruiters | Sponsor |
| Technical architecture | Dev | Dev | IT/Security | Product Owner |
| Go-live decision | Product Owner | Sponsor | Leadership, IT | All |
 
---
 
## 5. Open Questions
 
- [ ] Who is the official Project Sponsor?
- [ ] Who is the Product Owner (decision maker for requirements)?
- [ ] Which recruiters should be in the pilot group?
- [ ] What is the approval process for go-live?
EOF
 
echo "Created docs/01-discovery/stakeholder-map.md"
 
# Create docs/02-requirements/personas/recruiter-persona.md
cat > docs/02-requirements/personas/recruiter-persona.md << 'EOF'
# Persona: The Recruiter
 
## Document Control
 
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-29 | [Your Name] | Initial draft |
 
---
 
## Persona Summary
 
| Attribute | Value |
|-----------|-------|
| **Name** | "Riley the Recruiter" |
| **Role** | Recruiter / Talent Acquisition Specialist |
| **Organization** | [Company Name] (Staffing Firm) |
| **Experience** | 2-10 years in recruiting |
| **Tech Comfort** | Moderate (uses ATS, LinkedIn, email daily) |
 
---
 
## Who They Are
 
Riley is a recruiter at a staffing firm, responsible for sourcing, screening, and placing candidates with client companies. They work with a mix of roles—administrative, light industrial, healthcare support, customer service—and manage a pipeline of 20-50 active candidates at any time.
 
### Work Environment
- **Tools**: ATS (Bullhorn/JobDiva/similar), LinkedIn Recruiter, email, phone, video calls
- **Workload**: High volume, fast-paced, metrics-driven (placements, submittals, fill rates)
- **Collaboration**: Works with account managers, other recruiters, and client hiring managers
 
---
 
## Goals & Motivations
 
### Primary Goals
1. **Place candidates faster**: Reduce time-to-fill by having prepared candidates
2. **Reduce no-shows and poor screenings**: Candidates who ghost or bomb screening calls waste time
3. **Differentiate from competitors**: Offering prep tools makes [Company] stand out to candidates
4. **Hit metrics**: Placements, submittals, client satisfaction scores
 
### What Success Looks Like
> "I sent the candidate the practice link yesterday. When I called her today, she was articulate, had her elevator pitch ready, and knew what questions to expect. The client loved her. That's a win."
 
---
 
## Pain Points & Frustrations
 
| Pain Point | Frequency | Severity |
|------------|-----------|----------|
| Candidates unprepared for screening calls | Daily | High |
| No-shows or last-minute cancellations | Weekly | High |
| Time spent coaching basic interview skills | Daily | Medium |
| No visibility into candidate prep level | Always | Medium |
| Candidates nervous/inarticulate on calls | Daily | Medium |
 
### Underlying Frustrations
- "I don't have time to hand-hold every candidate through Interview 101"
- "I wish I knew which candidates actually prepared vs. just said they would"
- "Some candidates have great experience but can't talk about it"
- "I'm competing with other firms for the same candidates—I need an edge"
 
---
 
## Behaviors & Workflow
 
### How This Tool Fits In
 
**Trigger**: Recruiter identifies a promising candidate who needs to prep for a screening
**Action**: Sends practice interview invite via email/text
**Timing**: 1-3 days before scheduled screening call
**Follow-up**: Reviews candidate's completion status and results before the call
 
### Decision Criteria for Adoption
- **Must be fast**: "If it takes more than 2 minutes to set up, I won't use it"
- **Must be easy to share**: "I need to copy a link and paste it in an email"
- **Must show results**: "I want to see if they actually did it and how they did"
- **Must help candidates**: "If candidates hate it, it hurts my relationship with them"
 
---
 
## Key Scenarios
 
### Scenario 1: Regular Use
Riley has a screening call tomorrow with Jordan. They:
1. Log into the tool
2. Create an invite for a "Customer Service" role
3. Copy the link
4. Paste it into an email to Jordan with a note: "Complete this before our call"
5. Next day: Check if Jordan completed it and review highlights
 
### Scenario 2: Reviewing Results
Before a screening call, Riley opens the tool to see:
- Did the candidate complete the practice?
- How did they perform overall?
- Any specific strengths or areas of concern?
- Key talking points to explore in the real screening
 
---
 
## Design Implications
 
| Insight | Design Implication |
|---------|-------------------|
| Time-constrained | Invite creation < 2 minutes |
| Needs quick status checks | Dashboard shows completion at a glance |
| Wants to help, not test | Position as "practice" not "assessment" |
| Mobile status checks | Mobile-responsive recruiter view |
| Shares via email/text | Easy copy-paste invite links |
| Distrusts complex tools | Progressive disclosure, simple defaults |
 
---
 
## Jobs to Be Done (JTBD)
 
### Primary JTBD
**When** I have a screening call scheduled with a candidate,
**I want to** send them a quick, effective way to practice,
**So that** they show up prepared and I can assess their real potential.
 
### Secondary JTBD
**When** I'm deciding which candidates to submit to a client,
**I want to** see which ones took preparation seriously,
**So that** I can prioritize candidates who are invested in the opportunity.
EOF
 
echo "Created docs/02-requirements/personas/recruiter-persona.md"
 
# Create docs/02-requirements/personas/candidate-persona.md
cat > docs/02-requirements/personas/candidate-persona.md << 'EOF'
# Persona: The Candidate
 
## Document Control
 
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-29 | [Your Name] | Initial draft |
 
---
 
## Persona Summary
 
| Attribute | Value |
|-----------|-------|
| **Name** | "Jordan the Job Seeker" |
| **Role** | Job Candidate |
| **Status** | Actively seeking employment |
| **Experience** | Varied (entry-level to mid-career) |
| **Tech Comfort** | Moderate (smartphone-primary, some desktop) |
 
---
 
## Who They Are
 
Jordan is actively looking for work and has connected with a recruiter at [Company Name]. They may be:
- Recently unemployed and urgently seeking work
- Employed but looking for a better opportunity
- Re-entering the workforce after a gap
- Early career with limited interview experience
 
### Diversity of Situations
 
| Segment | Characteristics |
|---------|-----------------|
| **Entry-level** | Limited work history, nervous about interviews, may lack professional vocabulary |
| **Experienced** | Has interview experience but may be rusty or overconfident |
| **Career changers** | Strong background but struggling to translate skills to new field |
| **Gap returners** | Anxiety about explaining gaps, confidence issues |
 
### Technical Context
- **Primary device**: Smartphone (60%+ of candidates)
- **Connectivity**: May be unreliable (library wifi, data limits)
- **Distractions**: May complete at home with interruptions, or in public spaces
 
---
 
## Goals & Motivations
 
### Primary Goals
1. **Get the job**: Everything is in service of landing employment
2. **Make a good impression**: Want the recruiter to advocate for them
3. **Feel prepared**: Reduce anxiety about upcoming interactions
4. **Not waste time**: Value their time, skeptical of hoops to jump through
 
### What Success Looks Like
> "That practice session helped me figure out how to talk about my experience. When the recruiter called, I actually knew what to say. I felt ready."
 
---
 
## Pain Points & Frustrations
 
| Pain Point | Frequency | Severity |
|------------|-----------|----------|
| Don't know what questions to expect | Common | High |
| Struggle to articulate experience | Common | High |
| Get nervous and freeze up | Common | High |
| Don't know what "good" looks like | Common | Medium |
| No way to practice realistically | Common | Medium |
 
### Barriers to Preparation
- Limited time (may be working, caregiving, etc.)
- No quiet/private space to practice aloud
- Embarrassment about practicing
- Don't know where to start
- Previous bad experiences with job search tools (spam, scams)
 
---
 
## Behaviors & Workflow
 
### When They'll Use This Tool
- **Timing**: After receiving invite, before screening call (typically 1-48 hours)
- **Location**: Home, commute, break at work, library
- **Device**: Likely mobile for initial access, may switch to desktop for session
- **Duration**: 15-30 minutes (must fit in busy schedule)
- **Mindset**: Motivated but potentially anxious; wants it to be worth their time
 
### Completion Factors
 
**Increases completion:**
- Clear time expectation ("15 minutes")
- Immediate perceived value
- Mobile-friendly
- Encouraging tone
- Progress indicators
- Privacy assurance
 
**Decreases completion:**
- Lengthy or unclear process
- Feels like a test/trap
- Technical difficulties
- Requires account creation
- Judgmental tone
 
---
 
## Key Scenarios
 
### Scenario 1: First Impression
Jordan receives an email from their recruiter with a link:
> "Complete this practice interview before our call on Thursday. It'll help you prepare and only takes 15 minutes."
 
Jordan's thoughts:
- "Is this legit or spam?"
- "Do I have to create an account?"
- "What will this actually do?"
- "Will the recruiter see everything I say?"
 
**Design need**: Clear, trustworthy landing page with expectations set upfront.
 
### Scenario 2: Mobile Completion
Jordan opens the link on their phone during lunch break:
- Has 20 minutes
- In a semi-public space (can't talk loudly)
- Needs to use text input instead of voice
- Gets interrupted once, needs to resume
 
**Design need**: Mobile-optimized, text fallback, save progress.
 
### Scenario 3: Technical Trouble
Jordan's microphone doesn't work:
- Gets frustrated
- Doesn't know how to fix it
- Might abandon the session
 
**Design need**: Graceful degradation to text, clear troubleshooting.
 
---
 
## Emotional Journey
 
| Stage | Emotion | Design Response |
|-------|---------|-----------------|
| Receive invite | Curious but skeptical | Clear value prop, trust signals |
| Open link | Cautious | No account required, privacy clear |
| Start session | Nervous | Encouraging tone, expectations set |
| First question | Anxious | Simple first question, supportive tips |
| Mid-session | Engaged or frustrated | Progress indicator, option to pause |
| Complete session | Relieved, curious | Positive reinforcement, clear summary |
| Review feedback | Hopeful or defensive | Constructive framing, actionable advice |
 
---
 
## Design Implications
 
| Insight | Design Implication |
|---------|-------------------|
| Mobile-primary | Mobile-first responsive design |
| Time-constrained | Session < 20 minutes, clear time estimate |
| Skeptical of links | Trustworthy landing page, clear branding |
| Privacy-conscious | Transparent about what recruiter sees |
| May lack private space | Robust text input option |
| Wants to improve | Feedback is constructive, not judgmental |
| Might want to redo | Allow answer revision |
 
---
 
## Jobs to Be Done (JTBD)
 
### Primary JTBD
**When** I have a screening call coming up,
**I want to** practice answering interview questions with feedback,
**So that** I feel prepared and make a good impression.
 
### Secondary JTBD
**When** I don't know what questions to expect,
**I want to** see realistic examples of what I'll be asked,
**So that** I'm not caught off guard during the real call.
 
---
 
## Accessibility Considerations
 
Candidates may have:
- **Visual impairments**: Screen reader compatibility, sufficient contrast
- **Hearing impairments**: Text alternatives, visual feedback indicators
- **Motor impairments**: Keyboard navigation, large touch targets
- **Cognitive considerations**: Clear language, simple navigation, no time pressure
- **Situational limitations**: Noisy environment (text input), bright sunlight (contrast)
 
These aren't edge cases—they're part of the candidate population.
EOF
 
echo "Created docs/02-requirements/personas/candidate-persona.md"
 
# Create docs/02-requirements/user-stories.md
cat > docs/02-requirements/user-stories.md << 'EOF'
# User Stories
 
## Document Control
 
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2025-01-29 | [Your Name] | Initial draft |
 
---
 
## Overview
 
User stories organized by persona, prioritized using MoSCoW (Must/Should/Could/Won't).
 
**Format:** As a [persona], I want [goal] so that [benefit].
 
---
 
## Epic 1: Recruiter Invite Management
 
### US-1.1: Create Interview Invite ⭐ MUST
> As a **Recruiter**, I want to **create an interview practice invite** so that **I can send it to a candidate**.
 
**Acceptance Criteria:**
- [ ] Recruiter can select a job role/type from a predefined list
- [ ] Recruiter can optionally paste a job description
- [ ] Recruiter can optionally customize session settings (question count, difficulty)
- [ ] System generates a unique, shareable link
- [ ] Link is easy to copy to clipboard
- [ ] Invite is saved to recruiter's invite list
 
---
 
### US-1.2: View Invite List ⭐ MUST
> As a **Recruiter**, I want to **see a list of invites I've created** so that **I can track which candidates I've sent practice sessions to**.
 
**Acceptance Criteria:**
- [ ] Recruiter sees a list of all invites they've created
- [ ] Each invite shows: role, creation date, status (pending/completed/expired)
- [ ] List is sorted by most recent first
 
---
 
### US-1.3: View Invite Status ⭐ MUST
> As a **Recruiter**, I want to **see if a candidate has completed their practice session** so that **I know whether to follow up or proceed with screening**.
 
**Acceptance Criteria:**
- [ ] Each invite shows current status: Not Started, In Progress, Completed
- [ ] Completed invites show completion timestamp
 
---
 
### US-1.4: Resend/Copy Invite Link 📋 SHOULD
> As a **Recruiter**, I want to **resend or copy an existing invite link** so that **I can follow up with candidates who haven't started**.
 
---
 
### US-1.5: Delete/Archive Invite 📋 SHOULD
> As a **Recruiter**, I want to **delete or archive old invites** so that **my list stays manageable**.
 
---
 
## Epic 2: Recruiter Results Review
 
### US-2.1: View Completed Session Summary ⭐ MUST
> As a **Recruiter**, I want to **see a summary of a candidate's completed session** so that **I can quickly assess their preparation level**.
 
**Acceptance Criteria:**
- [ ] Recruiter can open results for any completed session
- [ ] Summary shows: overall performance indicator, completion time, questions answered
- [ ] Summary is viewable at a glance (< 30 seconds to understand)
 
**Open Question:** What form should the "performance indicator" take?
- Option A: Qualitative (Ready / Needs Practice / Incomplete)
- Option B: Quantitative (Score 1-100, or per-question scores)
- Option C: Descriptive (Strengths/areas for development summary)
 
---
 
### US-2.2: View Detailed Question Results 📋 SHOULD
> As a **Recruiter**, I want to **see how a candidate answered each question** so that **I can identify specific strengths and areas to probe**.
 
---
 
### US-2.3: Export/Share Results 💭 COULD
> As a **Recruiter**, I want to **export or share session results** so that **I can include them in candidate files**.
 
---
 
## Epic 3: Candidate Session Access
 
### US-3.1: Access Session via Link ⭐ MUST
> As a **Candidate**, I want to **access my practice session by clicking a link** so that **I don't need to create an account**.
 
**Acceptance Criteria:**
- [ ] Candidate clicks link and lands on session start page
- [ ] No account creation required
- [ ] Page clearly shows what to expect (time, purpose)
- [ ] Works on mobile and desktop browsers
 
---
 
### US-3.2: Understand What This Is ⭐ MUST
> As a **Candidate**, I want to **understand what this practice session is and how it will help me** so that **I feel confident proceeding**.
 
**Acceptance Criteria:**
- [ ] Landing page explains: what this is, how long it takes, how it helps
- [ ] Clear that this is practice, not a test
- [ ] Shows who sent the invite (recruiter/company branding)
- [ ] Privacy information is accessible
 
---
 
### US-3.3: Start Practice Session ⭐ MUST
> As a **Candidate**, I want to **start my practice session** so that **I can begin preparing**.
 
---
 
## Epic 4: Candidate Interview Practice
 
### US-4.1: View Interview Question ⭐ MUST
> As a **Candidate**, I want to **see the interview question clearly** so that **I can think about my answer**.
 
---
 
### US-4.2: Answer via Voice ⭐ MUST
> As a **Candidate**, I want to **answer questions by speaking** so that **I can practice realistic verbal responses**.
 
**Acceptance Criteria:**
- [ ] Clear microphone button to start recording
- [ ] Visual indicator that recording is active
- [ ] Ability to stop recording when done
- [ ] Confirmation before submitting answer
- [ ] Graceful handling of microphone permission denial
 
---
 
### US-4.3: Answer via Text ⭐ MUST
> As a **Candidate**, I want to **type my answer if I can't use voice** so that **I can still complete the practice**.
 
---
 
### US-4.4: Receive Feedback on Answer ⭐ MUST
> As a **Candidate**, I want to **receive feedback after each answer** so that **I can learn and improve**.
 
**Acceptance Criteria:**
- [ ] Feedback displayed after answer submission
- [ ] Feedback is constructive and actionable
- [ ] Feedback identifies strengths and areas to improve
- [ ] Tone is encouraging, not judgmental
 
---
 
### US-4.5: Redo an Answer 📋 SHOULD
> As a **Candidate**, I want to **redo an answer if I'm not satisfied** so that **I can practice until I feel confident**.
 
---
 
### US-4.6: See Progress Through Session ⭐ MUST
> As a **Candidate**, I want to **see how many questions remain** so that **I can pace myself**.
 
---
 
### US-4.7: Pause and Resume Session 📋 SHOULD
> As a **Candidate**, I want to **pause and come back later** so that **I can complete the session even if interrupted**.
 
---
 
## Epic 5: Candidate Session Completion
 
### US-5.1: Complete Session ⭐ MUST
> As a **Candidate**, I want to **finish my practice session** so that **the recruiter knows I've prepared**.
 
---
 
### US-5.2: View Session Summary ⭐ MUST
> As a **Candidate**, I want to **see a summary of my practice session** so that **I know how I did and what to focus on**.
 
---
 
### US-5.3: Review Individual Answers 📋 SHOULD
> As a **Candidate**, I want to **review my answers and feedback** so that **I can study before my screening call**.
 
---
 
## Epic 6: Recruiter Authentication & Access
 
### US-6.1: Recruiter Login ⭐ MUST
> As a **Recruiter**, I want to **log into the system** so that **I can access my invites and candidate results**.
 
---
 
### US-6.2: Recruiter Dashboard ⭐ MUST
> As a **Recruiter**, I want to **see a dashboard when I log in** so that **I can quickly see my invites and recent activity**.
 
---
 
## Epic 7: System & Platform
 
### US-7.1: Mobile Responsive ⭐ MUST
> As a **Candidate**, I want to **complete the session on my phone** so that **I can practice anywhere**.
 
---
 
### US-7.2: Accessibility ⭐ MUST
> As a **user with disabilities**, I want to **use the application with assistive technology** so that **I can participate fully**.
 
---
 
### US-7.3: Performance ⭐ MUST
> As a **user**, I want to **have a fast, responsive experience** so that **I don't get frustrated waiting**.
 
**Acceptance Criteria:**
- [ ] Page load < 3 seconds
- [ ] AI feedback returns < 10 seconds
- [ ] No UI freezing during operations
 
---
 
## Priority Summary
 
### Must Have (MVP)
| ID | Story | Persona |
|----|-------|---------|
| US-1.1 | Create Interview Invite | Recruiter |
| US-1.2 | View Invite List | Recruiter |
| US-1.3 | View Invite Status | Recruiter |
| US-2.1 | View Completed Session Summary | Recruiter |
| US-3.1 | Access Session via Link | Candidate |
| US-3.2 | Understand What This Is | Candidate |
| US-3.3 | Start Practice Session | Candidate |
| US-4.1 | View Interview Question | Candidate |
| US-4.2 | Answer via Voice | Candidate |
| US-4.3 | Answer via Text | Candidate |
| US-4.4 | Receive Feedback on Answer | Candidate |
| US-4.6 | See Progress Through Session | Candidate |
| US-5.1 | Complete Session | Candidate |
| US-5.2 | View Session Summary | Candidate |
| US-6.1 | Recruiter Login | Recruiter |
| US-6.2 | Recruiter Dashboard | Recruiter |
| US-7.1 | Mobile Responsive | All |
| US-7.2 | Accessibility | All |
| US-7.3 | Performance | All |
 
### Should Have (V1.1)
| ID | Story | Persona |
|----|-------|---------|
| US-1.4 | Resend/Copy Invite Link | Recruiter |
| US-1.5 | Delete/Archive Invite | Recruiter |
| US-2.2 | View Detailed Question Results | Recruiter |
| US-4.5 | Redo an Answer | Candidate |
| US-4.7 | Pause and Resume Session | Candidate |
| US-5.3 | Review Individual Answers | Candidate |
 
### Could Have (Future)
| ID | Story | Persona |
|----|-------|---------|
| US-2.3 | Export/Share Results | Recruiter |
 
---
 
## Open Questions for Stakeholder Review
 
1. **Readiness Signals**: Should recruiters see a "readiness" indicator? What form?
2. **Transcript Visibility**: Should recruiters see full answer transcripts, or just summaries?
3. **Invite Expiration**: Should invites expire? After how long?
4. **Multiple Attempts**: Can candidates retake? What does recruiter see?
5. **Question Customization**: Should recruiters customize questions, or just pick a role?
6. **Candidate Identity**: How do we associate invites with specific candidates (name, email)?
EOF
 
echo "Created docs/02-requirements/user-stories.md"
 
# Create placeholder READMEs
cat > docs/03-design/user-flows/README.md << 'EOF'
# User Flows
 
⏳ Pending — Will be created after user stories are validated.
EOF
 
cat > docs/03-design/wireframes/README.md << 'EOF'
# Wireframes
 
⏳ Pending — Will be created after user flows are defined.
EOF
 
cat > docs/04-architecture/README.md << 'EOF'
# Architecture Documentation
 
⏳ Pending — Will be created after design phase is complete.
EOF
 
cat > docs/05-quality/README.md << 'EOF'
# Quality Documentation
 
⏳ Pending — Will be created alongside architecture documentation.
EOF
 
cat > docs/06-project/README.md << 'EOF'
# Project Management Documentation
 
⏳ Pending — Roadmap will be created after requirements are validated.
EOF
 
echo ""
echo "================================================"
echo "All files created successfully!"
echo "================================================"
echo ""
echo "Next steps:"
echo "1. Review the generated files"
echo "2. Run: git add -A"
echo "3. Run: git commit -m 'Initialize project with documentation'"
echo "4. Run: git push -u origin main"