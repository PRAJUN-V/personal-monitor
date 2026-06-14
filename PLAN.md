# Project Plan: Personal Monitor

This document outlines the features, architecture, and roadmap for the Personal Monitor project.

## 1. Project Vision
*Briefly describe what this project is and what problem it solves.*

## 2. Core Features
- [ ] **Authentication:** 
    - [x] Login UI for personal use
    - [x] Registration API (Backend only, no UI for now)
- [ ] **Health Monitoring:**
    - [ ] Add records: Date, Height (cm), Weight (kg), Blood Pressure
    - [ ] Calculate BMI and Category (Normal, Overweight, Obese, etc.)
    - [ ] Suggest weight loss/gain to reach "Normal" BMI
    - [ ] Paginated list view of historical records
- [ ] **Financial Tracking:** (Planned for next phase)

## 3. Technical Stack
- **Backend:** FastAPI (Python)
- **Frontend:** Jinja2 Templates + Tailwind CSS + React (CDN)
- **Testing:** Automated API-level tests (Required before push)
- **Database:** PostgreSQL (Neon.tech) with **Automated Alembic Migrations**
- **Design:** Fully Mobile-Responsive (Mobile-First approach)
- **Deployment:** Render (Free Tier)

## 4. Implementation Phases

### Phase 1: Foundation (Completed)
- [x] Basic FastAPI setup
- [x] HTML template support + React integration
- [x] CI/CD pipeline + PostgreSQL (Neon) setup
- [x] **New Standard:** Mandatory local API testing
- [x] **New Standard:** Automated database migrations with Alembic

### Phase 2: Core Development
- [x] **Database Integration:** Migrated to PostgreSQL (Neon.tech) with Alembic
- [ ] **User Feedback/Data Entry:** Create a form to save data to the database
- [ ] **Data Visualization:** Display stored data in the React dashboard

### Phase 3: Mobile Optimization & Polishing
- [ ] **Responsive Design:** Ensure all components are optimized for mobile viewports
- [ ] **UI/UX Polishing:** Refine styles and interactions for a native-like mobile experience
- [ ] **Deployment:** Final push to Render once milestones are reached

---
*Note: This plan is a living document and will be updated as we discuss and implement new features.*
