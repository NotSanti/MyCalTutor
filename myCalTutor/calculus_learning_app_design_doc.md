# Calculus I Learning App
## Personal MVP - Design & Build Specification

> **Purpose of this document**  
> This document is the source of truth for building a personal-use web application that turns the user's Calculus I course materials into a structured, gamified learning path.
>
> It is written specifically so an AI coding agent such as Cursor can plan and implement the project incrementally without overbuilding.

---

# 1. Product Vision

Build a personal web-based Calculus I learning application that transforms the user's actual course materials into a structured, gamified learning experience.

Primary source material will include:

- Calculus I textbook PDF
- Course syllabus
- Class notes
- Lecture slides
- Worksheets
- Formula sheets
- Assignments, where appropriate

The product should ultimately answer:

> **Given everything my professor expects me to know, what should I study right now?**

The intended experience is closer to Duolingo's guided learning path than to a traditional PDF reader, flashcard app, or generic AI chat interface.

Example learning path:

```text
Calculus I

Unit 1 - Functions & Foundations
    ✓ Functions
    ✓ Domain & Range
    ✓ Graph Transformations

Unit 2 - Limits
    ✓ Understanding Limits
    ● Evaluating Limits
    ○ One-Sided Limits
    🔒 Continuity

Unit 3 - Derivatives
    🔒 Derivative as a Rate of Change
    🔒 Derivative Definition
    🔒 Differentiation Rules
```

The application is **not** initially intended to be a general-purpose SaaS product.

The first goal is:

> **Build the best possible Calculus I learning companion for one user and one real course.**

---

# 2. Core Product Principles

## 2.1 Personal-first

This application is being built for personal use first.

Do not initially optimize for:

- thousands of users
- subscriptions
- payment processing
- teams
- organizations
- instructor dashboards
- public course sharing
- marketplace features
- complex authorization
- multi-tenancy
- generic support for every academic subject
- comprehensive automated test coverage
- microservices
- Kubernetes
- complex queues

Optimize for:

- rapid iteration
- simple architecture
- excellent local developer experience
- one Calculus I course
- strong learning UX
- reliable source attribution
- easy inspection of AI output
- ability to expand later

If something can be hard-coded now and generalized later, prefer the simpler implementation.

---

# 3. Primary User Journey

The eventual application flow should be:

```text
Upload course materials
        ↓
Extract document structure
        ↓
Identify chapters / sections / concepts
        ↓
Review and approve generated course structure
        ↓
Generate skills and lessons
        ↓
Complete interactive lessons
        ↓
Track concept mastery
        ↓
Schedule review
        ↓
Recommend what to study next
```

For early MVPs, much of this will be mocked or manually approved.

---

# 4. Recommended Technology Stack

## Frontend

Use:

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS
- shadcn/ui
- Lucide Icons
- TanStack Query
- React Hook Form
- Zod
- Zustand only where shared client-side state is genuinely necessary
- KaTeX for mathematical notation

## Backend / Persistence

Use Supabase for:

- PostgreSQL
- Storage
- Authentication later, if needed
- Edge Functions
- pgvector later, if semantic retrieval becomes necessary

## AI

Use one hosted LLM provider initially.

The AI provider must be hidden behind an internal abstraction so it can be swapped later.

Example:

```ts
interface AIProvider {
  generateStructured<T>(request: AIRequest<T>): Promise<T>;
}
```

Do not build UI for switching AI providers.

Do not call AI APIs directly from React.

All AI calls should flow through server-side Supabase Edge Functions.

```text
React
  ↓
Supabase Edge Function
  ↓
AI Provider
```

Never expose an AI provider secret in a `VITE_*` environment variable.

## PDF Processing

Start with:

- `pdfjs-dist`

Use browser-side extraction first.

Assume the first textbook PDF contains selectable digital text.

Do not introduce Python, OCR, or external document-processing services until there is a demonstrated need.

## File Storage

Use Supabase Storage.

Initial private bucket:

```text
course-materials
```

---

# 5. High-Level Architecture

```text
┌──────────────────────────────┐
│       React + Vite App       │
│                              │
│ Learn Path                   │
│ Lesson Player                │
│ Materials                    │
│ Course Setup                 │
│ Progress                     │
└──────────────┬───────────────┘
               │
               │ supabase-js
               ▼
┌──────────────────────────────┐
│          Supabase            │
│                              │
│ PostgreSQL                   │
│ Storage                      │
│ Edge Functions               │
│ Auth later                   │
│ pgvector later               │
└────────────┬─────────────────┘
             │
             ▼
        AI Provider
```

Keep the architecture monolithic and simple for the personal MVP.

---

# 6. Suggested Repository Structure

```text
src/
├── app/
│   ├── router.tsx
│   └── providers.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── course/
│   ├── lesson/
│   ├── materials/
│   └── progress/
│
├── features/
│   ├── course/
│   ├── materials/
│   ├── curriculum/
│   ├── lessons/
│   ├── mastery/
│   └── ai/
│
├── hooks/
│
├── lib/
│   ├── supabase/
│   ├── pdf/
│   ├── validation/
│   └── utils/
│
├── pages/
│   ├── dashboard/
│   ├── course/
│   ├── lesson/
│   ├── materials/
│   └── settings/
│
├── stores/
├── types/
└── styles/
```

Supabase:

```text
supabase/
├── migrations/
├── seed.sql
│
└── functions/
    ├── _shared/
    │   ├── ai.ts
    │   ├── schemas.ts
    │   ├── prompts/
    │   └── response.ts
    │
    ├── analyze-document/
    ├── extract-concepts/
    ├── generate-skill/
    ├── generate-lesson/
    └── evaluate-short-answer/
```

Do not introduce a monorepo unless a real need appears later.

---

# 7. Core Domain Model

The application hierarchy should be:

```text
Course
 ├── Course Materials
 │
 ├── Units
 │    └── Skills
 │         └── Lessons
 │              └── Activities
 │
 └── Concepts
```

Example:

```text
Calculus I
│
├── Materials
│   ├── Textbook
│   ├── Syllabus
│   ├── Lecture Notes Week 1
│   └── Worksheet 1
│
├── Unit: Limits
│   ├── Skill: Limit Intuition
│   ├── Skill: Evaluating Limits
│   └── Skill: One-Sided Limits
│
└── Unit: Derivatives
```

---

# 8. Initial Database Design

The database should grow incrementally with the MVPs.

Do not create all future tables in MVP 0.

## 8.1 courses

```text
id
title
description
created_at
updated_at
```

## 8.2 course_materials

```text
id
course_id
name
material_type
storage_path
status
page_count
created_at
```

Material types:

```text
textbook
syllabus
notes
slides
worksheet
assignment
formula_sheet
other
```

Statuses:

```text
uploaded
extracting
ready
failed
```

## 8.3 material_pages

```text
id
material_id
page_number
raw_text
created_at
```

Store extracted content page-by-page.

Do not immediately build vector chunks.

## 8.4 source_sections

```text
id
material_id
parent_section_id
title
section_number
section_type
start_page
end_page
sort_order
```

Example:

```text
Chapter 2 - Limits
2.1 Tangent and Velocity Problems
2.2 The Limit of a Function
2.3 Calculating Limits
```

## 8.5 concepts

```text
id
course_id
name
description
difficulty
importance
created_at
```

## 8.6 concept_sources

```text
id
concept_id
material_id
source_section_id
page_start
page_end
```

## 8.7 units

```text
id
course_id
title
description
sort_order
status
```

## 8.8 skills

```text
id
unit_id
title
description
sort_order
difficulty
status
```

Recommended skill states:

```text
locked
available
in_progress
completed
mastered
```

## 8.9 skill_concepts

```text
skill_id
concept_id
```

## 8.10 lessons

```text
id
skill_id
title
description
sort_order
estimated_minutes
xp_reward
status
content JSONB
```

## 8.11 activities

```text
id
lesson_id
concept_id
type
prompt
content JSONB
correct_answer
explanation
difficulty
sort_order
```

## 8.12 activity_attempts

```text
id
activity_id
answer
is_correct
score
hint_used
created_at
```

A `user_id` is not required for the first personal-use implementation.

## 8.13 skill_progress

```text
skill_id
mastery
completed
last_practiced_at
```

---

# 9. Lesson Content Contract

AI must never generate JSX, HTML, Tailwind classes, or React components.

AI generates structured educational data.

React owns presentation.

Example:

```ts
type LessonContent = {
  intro: LessonIntro;
  blocks: LessonBlock[];
  summary: LessonSummary;
};

type LessonBlock =
  | ExplanationBlock
  | WorkedExampleBlock
  | MultipleChoiceBlock
  | NumericAnswerBlock
  | ShortAnswerBlock;
```

Example JSON:

```json
{
  "title": "Understanding Limits",
  "intro": {
    "objective": "Understand what a limit represents visually and numerically."
  },
  "blocks": [
    {
      "type": "explanation",
      "title": "Approaching a Value",
      "content": "..."
    },
    {
      "type": "worked-example",
      "problem": "...",
      "steps": []
    },
    {
      "type": "multiple-choice",
      "prompt": "...",
      "options": [],
      "answer": "..."
    }
  ]
}
```

All AI-generated structured outputs must be validated using Zod.

---

# 10. Initial Activity Types

Start with only these activity types.

## 10.1 Multiple Choice

Use for:

- conceptual understanding
- reading notation
- identifying misconceptions
- graph interpretation

## 10.2 Numeric Answer

Example:

```text
lim x→2 (x² + 3) = ?

[     ]
```

Evaluate deterministically.

Do not send simple numeric equality checks to AI.

## 10.3 Mathematical Expression

Example:

```text
d/dx (x³ + 2x)
```

For the earliest MVP, AI evaluation is acceptable if necessary.

Later replace with symbolic math evaluation.

## 10.4 Short Explanation

Example:

> Why does this limit not exist?

AI may evaluate this response.

Expected evaluation shape:

```ts
{
  score: 0.8,
  correct: true,
  feedback: "...",
  missingConcepts: []
}
```

---

# 11. UI / UX Direction

The UI should feel like a combination of:

- Duolingo
- Linear
- a modern shadcn application

The application must **not** primarily look like an AI chat product.

The primary interaction is the **learning path**.

## Visual principles

Use:

- rounded cards
- generous spacing
- strong typography
- subtle shadows
- restrained gradients
- large click targets
- simple animation
- obvious progress indicators

Avoid:

- excessive glassmorphism
- dense admin dashboards
- tiny text
- excessive borders
- analytics overload
- giant chat input as the home screen

---

# 12. Design Tokens

Use semantic design tokens rather than scattering raw Tailwind colors.

Example:

```css
--background
--foreground
--surface
--surface-muted
--primary
--primary-foreground
--success
--warning
--danger
--xp
--mastery
--locked
```

Prefer:

```tsx
bg-primary
```

instead of repeated direct values such as:

```tsx
bg-purple-600
```

---

# 13. Navigation

Early MVP navigation:

```text
Learn
Materials
```

Later:

```text
Learn
Review
Course
Materials
Progress
Settings
```

Desktop shell:

```text
┌─────────────────────────────────────────────┐
│ Sidebar │                                   │
│         │                                   │
│ Learn   │                                   │
│ Review  │           Main content            │
│ Course  │                                   │
│ Files   │                                   │
│ Stats   │                                   │
└─────────────────────────────────────────────┘
```

---

# 14. Main Learn Page

The Learn page is the primary application page.

Example header:

```text
Calculus I

🔥 6 day streak        ⭐ 840 XP
```

Continue card:

```text
Continue Learning

Understanding Limits
Unit 2 • Lesson 3

████████░░ 72%

[ Continue ]
```

Learning path:

```text
           ✓
       Functions

           │
           ✓
        Graphs

           │
           ✓
    Limit Intuition

           │
           ●
   Evaluating Limits

           │
           ○
    One-Sided Limits

           │
           🔒
      Continuity
```

Do not use a table for the primary learning path.

---

# 15. Lesson Player

The lesson player should be distraction-free.

Example:

```text
← Exit                     Lesson Progress

████████████████░░░░

         Understanding Limits

              [content]

            [ Continue ]
```

Do not show the normal sidebar while a lesson is active.

Render one primary interaction at a time.

---

# 16. Feedback UX

Correct answer:

```text
✓ Correct!

As x approaches 2,
the function approaches 7.

[ Continue ]
```

Incorrect answer:

```text
Not quite.

Remember that the limit asks what the
function approaches, not necessarily
its value at that exact point.

[ Try Again ]
```

Feedback should teach immediately.

Avoid unhelpful feedback such as simply displaying `Wrong`.

---

# 17. Mathematics Rendering

Use KaTeX or an equivalent renderer.

Store formulas using LaTeX where possible.

Example:

```text
\lim_{x \to 2} x^2 = 4
```

Preserve:

- fractions
- limits
- derivatives
- integrals
- exponents
- subscripts

---

# 18. AI Architecture Rules

AI should be used for tasks where language understanding is useful.

Good AI use cases:

- document structure interpretation
- concept extraction
- lesson generation
- question generation
- explanation generation
- short-answer grading
- identifying misconceptions

Prefer deterministic code for:

- numeric equality
- XP calculations
- progress percentages
- unlock rules
- timestamps
- database logic
- simple scoring

---

# 19. AI Provenance Rule

Source attribution is mandatory.

Generated educational content should maintain a path back to source material wherever practical.

Desired relationship:

```text
Activity
  ↓
Concept
  ↓
Source Section
  ↓
Course Material
  ↓
Page Number
```

Generated concepts should include source pages.

Bad:

```json
{
  "name": "Limit"
}
```

Better:

```json
{
  "name": "Limit",
  "sourcePages": [82, 83, 84]
}
```

---

# 20. Source Priority

When multiple course materials cover the same concept, use this initial priority order:

```text
1. Professor material / lecture material
2. Syllabus
3. Assigned textbook
4. Personal notes
5. Supplementary AI knowledge
```

Supplementary AI knowledge must never silently override course material.

If AI supplies helpful outside context, it should be identifiable as supplementary.

---

# 21. Standard Generated Lesson Structure

Generated lessons should follow a stable template.

```text
Lesson Introduction
        ↓
Concept Explanation
        ↓
Worked Example
        ↓
Simple Check
        ↓
Second Explanation / Example
        ↓
Application Question
        ↓
Challenge Question
        ↓
Summary
```

The AI fills the lesson slots.

The AI does not redesign the lesson format per generation.

Each generated lesson should:

1. Have one clear learning objective.
2. Introduce at most 1-3 concepts.
3. Explain before testing.
4. Include at least one worked example.
5. Include retrieval practice.
6. Include conceptual understanding questions.
7. Include relevant source page references.
8. Avoid unsupported claims.

---

# 22. MVP ROADMAP

The project must be built sequentially.

Do not skip directly to the full AI course-generation system.

---

# MVP 0 - Project Foundation

## Goal

Create the application skeleton and design system.

No AI.

No real course generation.

## Tasks

Create:

- Vite React application
- TypeScript configuration
- Tailwind CSS
- shadcn/ui
- React Router
- TanStack Query
- Supabase client
- base application layout
- semantic theme tokens

Placeholder routes:

```text
/
/learn
/materials
/lesson/:lessonId
```

Install only the shadcn components currently needed, such as:

- Button
- Card
- Progress
- Badge
- Dialog
- DropdownMenu
- Tooltip
- Tabs
- Sheet
- Skeleton
- Sonner

Do not install the entire shadcn component library.

## Acceptance Criteria

The application runs successfully and displays a simple Calculus I shell with navigation to Learn and Materials.

No AI functionality exists yet.

---

# MVP 1 - Fake the Complete Learning Experience

## Goal

Prove the learning UX before building document ingestion or AI.

Create a hard-coded fake Calculus I course.

Example content:

```text
Unit 1 - Foundations

Functions
Domain & Range
Graph Transformations

Unit 2 - Limits

Limit Intuition
Evaluating Limits
One-Sided Limits
Continuity
```

Create at least two playable lessons:

- Understanding Limits
- Evaluating Limits

Each lesson contains:

- explanation
- worked example
- multiple choice question
- numeric answer question
- short explanation question
- lesson completion screen

Store temporary progress in localStorage.

## Acceptance Criteria

The user can:

```text
Open Learn page
    ↓
Select Limit Intuition
    ↓
Complete lesson
    ↓
Answer questions
    ↓
Receive feedback
    ↓
Earn XP
    ↓
Return to course path
    ↓
See skill completed
```

The experience should be pleasant enough that the user would realistically complete a 10-minute lesson.

---

# MVP 2 - Supabase Persistence

## Goal

Move the fake curriculum from local hard-coded data into Supabase.

## Tasks

Create migrations for the minimum tables required:

- courses
- units
- skills
- lessons
- activities
- activity_attempts
- skill_progress

Seed the fake Calculus I course.

Load course data using TanStack Query.

Persist lesson completion and XP/progress data.

Do not add authentication unless needed.

## Acceptance Criteria

Reloading the browser does not lose learning progress.

The UI no longer depends on hard-coded lesson content inside React components.

---

# MVP 3 - Course Material Upload

## Goal

Upload and inspect the real textbook PDF.

## Materials UI

Create a Materials page.

Example:

```text
Course Materials

[ + Add Material ]

Calculus Early Transcendentals.pdf
Textbook
482 pages
Ready

MATH 201 Syllabus.pdf
Syllabus
6 pages
Ready
```

Upload flow:

```text
Select file
   ↓
Choose material type
   ↓
Upload to Supabase Storage
   ↓
Extract text
   ↓
Store page text
   ↓
Preview
```

## PDF extraction

Use `pdfjs-dist`.

Extract:

```ts
type ExtractedPage = {
  pageNumber: number;
  text: string;
};
```

Store page text in `material_pages`.

Do not send the whole textbook to an LLM.

## Internal document inspector

Create:

```text
/materials/:materialId
```

Show:

- document name
- page count
- extraction status
- extracted text page-by-page
- simple search

This screen is intentionally developer-oriented.

## Acceptance Criteria

The actual Calculus textbook can be uploaded and the extracted text can be inspected page-by-page.

The developer can determine whether equations and headings are being extracted acceptably.

---

# MVP 4 - Detect Textbook Structure

## Goal

Use AI for the first time to identify the textbook hierarchy.

Create Supabase Edge Function:

```text
analyze-document
```

Do not ask the AI to understand the entire course yet.

Its first job is to identify:

- chapters
- sections
- section numbers
- approximate page ranges

Expected output:

```ts
type TextbookStructure = {
  chapters: {
    number: string;
    title: string;
    sections: {
      number: string;
      title: string;
      startPage?: number;
    }[];
  }[];
};
```

Validate with Zod.

## Course structure review UI

Create:

```text
/course/setup
```

Example:

```text
Detected Course Structure

Chapter 1 - Functions
  1.1 Functions
  1.2 Mathematical Models

Chapter 2 - Limits
  2.1 Tangent and Velocity Problems
  2.2 The Limit of a Function
  2.3 Calculating Limits

[ Edit ]
[ Approve Course Structure ]
```

Allow:

- rename
- delete
- reorder

## Acceptance Criteria

The real textbook produces a mostly accurate chapter/section hierarchy which can be manually corrected and approved.

---

# MVP 5 - Concept Extraction

## Goal

Extract concepts from **one textbook section only**.

Example source:

```text
2.2 - The Limit of a Function
```

Retrieve only the relevant pages.

Create Edge Function:

```text
extract-concepts
```

Expected output:

```json
{
  "concepts": [
    {
      "name": "Informal Definition of a Limit",
      "description": "...",
      "importance": 5,
      "difficulty": 2,
      "sourcePages": [82, 83]
    },
    {
      "name": "One-Sided Behavior",
      "description": "...",
      "importance": 4,
      "difficulty": 2,
      "sourcePages": [84]
    }
  ]
}
```

## Concept inspector

Create an internal review screen showing detected concepts.

Allow:

- edit
- delete
- add

## Acceptance Criteria

One real textbook section can be transformed into a useful and mostly correct concept list with traceable source pages.

---

# MVP 6 - Generate One Real Lesson

## Goal

Generate the first playable lesson directly from the user's textbook.

Input:

```text
Selected section
+ extracted concepts
+ relevant textbook pages
```

Output:

```text
Skill
+ lesson
+ activities
```

Create Edge Function:

```text
generate-lesson
```

The generated lesson must match the structured lesson schema.

## Acceptance Criteria

A selected textbook section can generate a playable lesson that the user would genuinely choose to study instead of simply rereading the textbook section.

This is the most important product milestone.

---

# MVP 7 - Generate One Complete Skill

## Goal

Generate multiple lessons for a single skill.

Example:

```text
Skill: Understanding Limits

Lesson 1 - What Is a Limit?
Lesson 2 - Reading Limit Notation
Lesson 3 - Limits From Graphs
Lesson 4 - Practice
Lesson 5 - Skill Check
```

Create Edge Function:

```text
generate-skill
```

Do not generate an entire textbook yet.

## Acceptance Criteria

One textbook section or tightly related group of sections can become a coherent multi-lesson skill.

---

# MVP 8 - Generate One Complete Unit

## Goal

Generate a full unit such as Limits.

Example:

```text
Unit: Limits

Limit Intuition
Evaluating Limits
One-Sided Limits
Infinite Limits
Continuity
```

Generate skills incrementally rather than in one enormous AI request.

## Acceptance Criteria

One real textbook chapter can become a coherent learning unit with multiple skills and lessons.

---

# MVP 9 - Add Syllabus and Class Materials

## Goal

Move from "textbook tutor" to "my actual Calculus course".

Add support for:

- syllabus
- class notes
- lecture slides
- worksheets

Use syllabus data to identify:

- course topics
- assigned textbook sections
- excluded textbook sections
- exam dates
- assignment dates
- grading structure

Example:

```text
Midterm 1

Covers:
1.1-1.5
2.1-2.6

Date:
October 8
```

## Acceptance Criteria

The application can distinguish what is in the textbook from what the professor actually expects for the course.

---

# MVP 10 - Basic Mastery Tracking

## Goal

Track understanding instead of simple completion.

Use a basic 0-100 mastery score initially.

Example scoring:

```text
Correct answer              +10
Correct difficult question  +15
Correct with hint            +5
Incorrect                    -5
Mastered                     >= 85
```

Clamp mastery between 0 and 100.

This is intentionally simple.

Do not implement Bayesian Knowledge Tracing or other advanced models yet.

Example skill view:

```text
Limit Intuition

Limit Meaning            95%
Limit Notation           85%
Graph Interpretation     65%

Overall Mastery          82%
```

## Acceptance Criteria

The application can distinguish between completing a lesson and actually mastering its concepts.

---

# MVP 11 - Review Queue

## Goal

Create simple spaced review.

Each concept should eventually track:

```text
last_practiced_at
next_review_at
mastery
```

Initial review schedule:

```text
First success  → 1 day
Second         → 3 days
Third          → 7 days
Fourth         → 14 days
Fifth          → 30 days
```

Review page:

```text
Today's Review

7 questions
~8 minutes

Limits                 3
Functions              2
Graph Transformations  2

[ Start Review ]
```

## Acceptance Criteria

Previously learned concepts reappear automatically for review.

---

# MVP 12 - Adaptive Recommendations

## Goal

Recommend what the user should learn next.

Use simple deterministic priority logic first.

Priority:

```text
1. Critical overdue review
2. Weak prerequisite concept
3. Current course skill
4. New material
```

Example:

```text
Before continuing derivatives,
review Limit Intuition.

[ 5-minute review ]
```

## Acceptance Criteria

The application starts behaving like an adaptive learning product instead of a static course reader.

---

# MVP 13 - Course Calendar / Exam Awareness

## Goal

Use syllabus dates to guide studying.

Store:

- lectures
- assignments
- quizzes
- midterms
- final exam

Example dashboard:

```text
Upcoming

Midterm 1
12 days

Current readiness
68%
```

Recommendations:

```text
Recommended today

Limits Review
8 min

Continuity
12 min

Midterm Practice
10 min
```

## Acceptance Criteria

The application can answer:

> What should I study today based on what I know and what is coming next in class?

---

# 23. Later Features - Do Not Build During Early MVPs

The following are intentionally deferred.

## Contextual AI Tutor

A lesson-level Ask Tutor feature may later receive:

- current skill
- current lesson
- current question
- user's answer
- relevant source passages

Do not initially provide the entire textbook as context.

## pgvector / Retrieval-Augmented Generation

Add embeddings only when semantic retrieval solves a demonstrated problem.

Potential use case:

> Why does the Intermediate Value Theorem require continuity?

The app can later retrieve relevant passages from:

- textbook
- lecture notes
- slides

Do not build vector search during initial PDF ingestion.

## Symbolic Math Evaluation

Later replace AI-based expression grading with deterministic symbolic math.

Desired architecture:

```ts
evaluateActivity(activity, answer)
```

Routing:

```text
multiple-choice → deterministic
numeric         → deterministic
symbolic        → math engine
short-answer    → AI
```

## More Activity Types

Possible later activities:

- graph drawing
- graph interpretation
- drag-and-drop ordering
- matching
- identify-the-error
- complete-the-proof
- fill missing derivation step
- equation construction
- free-response exam problem

---

# 24. AI Job UX

Long AI operations should never make the UI appear frozen.

Show progress states such as:

```text
Creating your course...

✓ Reading textbook
✓ Identifying chapters
● Analyzing Chapter 2
○ Identifying concepts
○ Creating lessons
```

Persist job status when useful.

Recommended states:

```text
pending
processing
completed
failed
```

Failures must expose retry behavior.

Do not leave data permanently stuck in `processing`.

---

# 25. Generation Metadata

AI-generated artifacts should store enough metadata to debug them later.

Minimum:

```text
generated_at
generation_version
source_ids
```

Later:

```text
model
prompt_version
```

Prefer regenerating individual artifacts.

Example:

```text
Regenerate Lesson
```

Avoid unnecessarily regenerating the entire course.

---

# 26. Suggested Supabase Edge Functions

## analyze-document

Purpose:

```text
course material
→ document structure
```

## extract-concepts

Purpose:

```text
source pages
→ concepts
```

## generate-skill

Purpose:

```text
concepts
→ skill structure
```

## generate-lesson

Purpose:

```text
skill
+ concepts
+ source text
→ lesson JSON
```

## evaluate-short-answer

Purpose:

```text
question
+ expected concepts
+ learner answer
→ evaluation
```

Shared utilities belong in:

```text
supabase/functions/_shared/
```

Use this for:

- AI client
- schemas
- prompt builders
- shared response helpers
- source-formatting logic

---

# 27. Prompt Architecture

Prompts must live in source control.

Do not scatter large prompt strings throughout application code.

Recommended:

```text
supabase/functions/_shared/prompts/
├── analyzeDocument.ts
├── extractConcepts.ts
├── generateSkill.ts
├── generateLesson.ts
└── evaluateShortAnswer.ts
```

Each file should expose a prompt-builder function.

Example:

```ts
buildGenerateLessonPrompt(input)
```

Prompt structure should generally include:

```text
ROLE
TASK
SOURCE MATERIAL
CONSTRAINTS
EXPECTED OUTPUT
```

Example system instruction:

```text
You are designing a Calculus I learning lesson.

Use the supplied course material as the primary source of truth.
Do not invent theorem names, definitions, formulas, or course requirements.
Preserve mathematical notation.
Target a first-year university Calculus I student.
Explain concepts clearly before testing them.
Return structured data matching the provided schema.
```

---

# 28. CURSOR / AI AGENT GLOBAL RULES

Create or update the repository-level `AGENTS.md` or Cursor rules with these principles.

## Rule 1 - Do not overbuild

Implement only what is necessary for the active milestone.

Do not introduce infrastructure for hypothetical future requirements.

## Rule 2 - Work one milestone at a time

Never attempt to build the entire application from this document in one pass.

Each milestone should be independently reviewed before continuing.

## Rule 3 - Inspect before editing

Before implementing a feature, inspect:

- relevant components
- relevant types
- database migrations
- existing utilities
- existing design patterns

Do not duplicate functionality that already exists.

## Rule 4 - No unrelated refactors

Do not refactor unrelated code while implementing a milestone.

Keep changes focused.

## Rule 5 - Strict TypeScript

Avoid `any`.

Prefer `unknown` plus runtime validation when input is untrusted.

Avoid unsafe assertions unless clearly justified.

## Rule 6 - Validate boundaries

Use Zod at external boundaries such as:

- AI output
- form input
- Edge Function payloads
- external API responses

Do not repeatedly validate trusted internal TypeScript objects without reason.

## Rule 7 - AI never controls presentation

AI outputs structured data.

React renders that data.

Never ask AI to generate:

- JSX
- React components
- Tailwind classes
- arbitrary HTML

## Rule 8 - Reuse shadcn primitives

Before creating generic UI primitives such as:

- buttons
- dialogs
- dropdowns
- tabs
- tooltips
- sheets

use or extend the relevant shadcn component.

Create custom components for domain-specific UI such as:

- SkillNode
- CoursePath
- LessonProgress
- ActivityCard
- MasteryRing

## Rule 9 - Use semantic Tailwind styling

Prefer:

- semantic tokens
- consistent spacing
- component variants
- reusable patterns

Avoid repeated arbitrary styling values.

## Rule 10 - Keep components focused

Page components orchestrate data and layout.

Feature components render domain-specific UI.

Business logic belongs in hooks, services, or domain utilities.

Avoid massive page components.

## Rule 11 - Do not use Zustand by default

Use:

```text
server state → TanStack Query
URL state    → React Router
local state  → useState / useReducer
```

Use Zustand only for genuine shared client state.

## Rule 12 - Database changes require migrations

Every Supabase schema change should be represented by a migration.

Do not rely on undocumented manual dashboard changes.

## Rule 13 - Never expose secrets

Never place:

- AI provider API key
- Supabase service-role key

inside `VITE_*` variables or client-side code.

## Rule 14 - Source attribution is mandatory

Wherever practical, preserve relationships between generated educational content and original source pages.

## Rule 15 - AI failures must be recoverable

AI operations should support retry or regeneration.

Do not leave records permanently stuck in an intermediate status.

## Rule 16 - Prefer deterministic logic

If normal code can solve something reliably, use normal code instead of an LLM.

## Rule 17 - Never silently invent course information

If source material does not support a statement, do not present it as course truth.

Flag uncertainty where needed.

## Rule 18 - Preserve mathematics

Use proper mathematical rendering and preserve mathematical notation throughout extraction, storage, AI generation, and display.

## Rule 19 - Optimize for personal usefulness

If choosing between architectural purity and functionality that will help the user study tomorrow, prefer the useful implementation.

## Rule 20 - Stop at the requested milestone

After completing a milestone:

1. summarize changes
2. list important files changed
3. describe database changes
4. state known limitations
5. mention manual steps, if any
6. stop

Do not automatically begin the next milestone.

---

# 29. Testing Strategy

This is a personal MVP.

Do not pursue comprehensive test coverage.

Add tests where logic errors would be difficult or frustrating to detect manually.

Good candidates:

- mastery calculations
- lesson unlock logic
- numeric answer evaluation
- Zod schemas for AI output
- PDF page-number handling
- important parsing utilities

Do not initially spend time testing:

- every button
- every card
- every Tailwind class
- trivial layout components

Manual product testing is expected during early MVPs.

---

# 30. Developer / Debug Screens

Developer-facing screens are encouraged during early development.

Potential routes:

```text
/dev/materials
/dev/concepts
/dev/generations
```

Useful debug information:

- raw PDF text extraction
- page boundaries
- AI request input
- AI structured output
- source mappings
- generation errors
- raw lesson JSON

These tools do not need production-quality polish.

They exist to make AI behavior inspectable.

---

# 31. Recommended Implementation Order

Use this exact sequence unless the project discovers a strong reason to change it.

```text
MVP 0
Project foundation + design system

↓

MVP 1
Fake playable Calculus course

↓

MVP 2
Supabase persistence

↓

MVP 3
Upload + inspect real textbook

↓

MVP 4
Detect textbook structure

↓

MVP 5
Extract concepts from one section

↓

MVP 6
Generate one real lesson

↓

MVP 7
Generate one complete skill

↓

MVP 8
Generate one complete textbook unit

↓

MVP 9
Add syllabus + notes + class materials

↓

MVP 10
Mastery tracking

↓

MVP 11
Review queue

↓

MVP 12
Adaptive recommendations

↓

MVP 13
Course calendar / exam awareness

↓

Later
RAG tutor + symbolic math + richer activities
```

---

# 32. Most Important Product Validation

Do not initially optimize for:

> Upload a 900-page textbook and automatically generate an entire Calculus I course.

The first major AI success criterion is:

> **Upload the real textbook, select one section on limits, and generate one lesson that the user genuinely prefers using over simply rereading that textbook section.**

Once this works:

```text
1 section
→ 1 skill
→ 1 chapter
→ textbook
→ textbook + syllabus
→ complete live course
```

becomes an incremental engineering problem.

---

# 33. CURSOR PROMPTS

The following prompts are intended to be copied into Cursor one milestone at a time.

Do not send all prompts at once.

---

## Prompt 0 - Repository Inspection and Plan

```text
Read the project design document completely before making any changes.

Inspect the current repository structure, package.json, existing configuration, components, styles, and any existing Supabase files.

Do not write code yet.

Produce a concise implementation plan for MVP 0 only.

The plan should include:
- files to create
- files to modify
- dependencies required
- routing structure
- shadcn components required
- Supabase client setup
- any assumptions

Follow the global agent rules in the design document.
Do not plan future MVPs beyond noting dependencies that affect MVP 0.
```

---

## Prompt 1 - Build MVP 0

```text
Implement MVP 0 from the project design document.

Scope is strictly:
- React + TypeScript + Vite foundation
- Tailwind
- shadcn/ui
- React Router
- TanStack Query
- Supabase client setup
- semantic theme tokens
- basic application shell
- Learn and Materials placeholder routes

Do not implement:
- AI
- PDF upload
- course generation
- Supabase database tables beyond anything absolutely required for setup
- authentication
- mastery
- gamification logic

Before editing, inspect existing project patterns and reuse them.

When finished:
1. summarize what was implemented
2. list important files changed
3. list new dependencies
4. state any manual setup required
5. stop
```

---

## Prompt 2 - Plan MVP 1

```text
Read the MVP 1 section of the project design document.

Inspect the current implementation produced by MVP 0.

Do not code yet.

Create an implementation plan for a hard-coded but fully playable Calculus I learning experience.

The plan must include:
- course fixture structure
- TypeScript lesson/activity types
- Learn page structure
- vertical learning path component structure
- lesson player architecture
- answer feedback flow
- localStorage progress model
- XP handling
- two lessons: Understanding Limits and Evaluating Limits

Prefer reusable domain components but do not over-abstract.
```

---

## Prompt 3 - Build MVP 1

```text
Implement MVP 1 from the project design document.

Build a complete fake Calculus I learning experience using hard-coded typed data.

Requirements:
- vertical Duolingo-inspired learning path
- Foundations and Limits units
- skill states
- two fully playable lessons
- explanation blocks
- worked examples
- multiple-choice activities
- numeric-answer activities
- short-answer activity UI
- immediate correct/incorrect feedback
- XP rewards
- lesson completion
- localStorage persistence
- KaTeX rendering for math

Do not add AI or Supabase persistence yet.

Focus heavily on interaction quality and visual polish using Tailwind and shadcn.

Do not make the application look like an AI chat app.

When complete, summarize changes and stop.
```

---

## Prompt 4 - Plan MVP 2

```text
Plan MVP 2 only.

Inspect the hard-coded course model and identify the minimum Supabase schema required to persist:
- courses
- units
- skills
- lessons
- activities
- attempts
- skill progress

Create a migration plan and data-access plan.

Explain how the existing typed fake course will be converted into seed data.

Do not implement authentication.
Do not add unrelated future tables.
Do not code yet.
```

---

## Prompt 5 - Build MVP 2

```text
Implement MVP 2.

Move the current fake Calculus I curriculum and progress state into Supabase.

Requirements:
- create migrations for the minimum required tables
- create seed data for the current fake course
- create typed data access functions
- load server data with TanStack Query
- persist lesson attempts and progress
- remove course-content dependence on local hard-coded React data

Authentication is not required yet.

Keep local UI state local and server state in TanStack Query.
Do not introduce Zustand unless a real need exists.

When finished, summarize database and application changes and stop.
```

---

## Prompt 6 - Plan MVP 3

```text
Plan MVP 3 only: uploading and inspecting the real Calculus textbook.

Inspect the current Supabase setup and application structure.

Plan:
- course_materials migration
- material_pages migration
- Supabase Storage bucket usage
- material upload form
- material type selection
- pdfjs-dist extraction flow
- page-by-page persistence
- extraction progress state
- document inspector route
- simple extracted-text search

Assume the PDF contains selectable digital text.
Do not introduce OCR, Python, or AI.
Do not code yet.
```

---

## Prompt 7 - Build MVP 3

```text
Implement MVP 3 from the design document.

Requirements:
- upload PDF course materials
- choose material type
- store original PDF in Supabase Storage
- extract page text using pdfjs-dist
- persist page text to material_pages
- show extraction progress
- create Materials list
- create /materials/:materialId inspector
- display extracted text page-by-page
- add simple text search
- support failure state and retry where practical

Do not call an LLM.
Do not implement OCR.
Do not add embeddings.

The primary goal is to inspect the actual Calculus textbook extraction quality.

When complete, summarize changes and stop.
```

---

## Prompt 8 - Plan MVP 4

```text
Plan MVP 4 only: AI-assisted textbook structure detection.

Inspect the extracted textbook data model.

Plan a Supabase Edge Function named analyze-document that takes relevant extracted text and returns a validated chapter/section hierarchy.

Plan:
- request type
- response Zod schema
- prompt structure
- source text selection strategy
- source_sections migration
- course setup review UI
- rename/delete/reorder interactions
- approval flow

Do not attempt to send the whole textbook to the model.
Do not generate concepts or lessons yet.
Do not code yet.
```

---

## Prompt 9 - Build MVP 4

```text
Implement MVP 4.

Create AI-assisted textbook structure detection.

Requirements:
- Supabase Edge Function: analyze-document
- AI provider abstraction in shared server code
- secure server-side API key usage
- Zod validation of AI output
- chapter/section structured output
- source_sections persistence
- /course/setup review page
- editable detected structure
- reorder/delete/rename
- approve course structure action

Do not generate concepts, skills, or lessons yet.
Do not send the full textbook in one model request.

Store enough generation metadata to debug failures.

When complete, summarize changes and stop.
```

---

## Prompt 10 - Plan MVP 5

```text
Plan MVP 5 only: concept extraction from one approved textbook section.

Inspect source_sections and material_pages.

Plan:
- selecting a source section
- retrieving only its relevant source pages
- extract-concepts Edge Function
- concept Zod schema
- concepts and concept_sources migrations
- provenance model
- concept review/inspection UI
- manual edit/add/delete interactions

Do not generate lessons yet.
Do not process the entire book.
Do not code yet.
```

---

## Prompt 11 - Build MVP 5

```text
Implement MVP 5.

For one selected textbook section:
- retrieve its source pages
- send the relevant content to extract-concepts
- return structured concepts
- validate all AI output with Zod
- persist concepts
- persist source page relationships
- display detected concepts in an inspector
- allow edit/delete/add

Every generated concept must retain source provenance.

Do not generate lessons or skills yet.

When complete, summarize changes and stop.
```

---

## Prompt 12 - Plan MVP 6

```text
Plan MVP 6 only: generating one real playable lesson from one textbook section.

Inspect:
- lesson player
- existing lesson schema
- extracted concepts
- source provenance
- AI shared utilities

Design the generate-lesson Edge Function.

The output must match the existing structured lesson content contract.

Plan how to pass:
- selected concepts
- source page text
- course context

Plan source citations inside lesson content.

Do not generate an entire skill or chapter.
Do not code yet.
```

---

## Prompt 13 - Build MVP 6

```text
Implement MVP 6.

Generate one real playable Calculus lesson from a selected textbook section.

Requirements:
- generate-lesson Edge Function
- strict Zod response validation
- use approved source concepts
- use only relevant source pages
- structured lesson output
- explanatory block
- worked example
- simple check
- application question
- challenge question
- summary
- source page references
- save generated lesson
- play generated lesson using the existing lesson player
- allow regeneration of this lesson only

AI must not generate JSX, HTML, or Tailwind.

Do not generate full skills or chapters yet.

When complete, summarize changes and stop.
```

---

## Prompt 14 - Plan MVP 7

```text
Plan MVP 7 only: generating one complete skill from a coherent concept group.

Inspect the successful generated lesson flow.

Plan:
- generate-skill Edge Function
- skill schema
- lesson outline schema
- generation sequencing
- avoiding one huge model response
- persistence
- skill review before lesson generation

Do not generate a full unit or book.
Do not code yet.
```

---

## Prompt 15 - Build MVP 7

```text
Implement MVP 7.

Create one generated skill composed of multiple lessons.

Requirements:
- generate skill structure from approved concepts
- create multiple lesson outlines
- generate lesson content incrementally
- persist generated skill and lessons
- preserve source provenance
- allow individual lesson regeneration
- render the generated skill on the learning path

Do not generate an entire textbook chapter automatically in one request.

When complete, summarize changes and stop.
```

---

## Prompt 16 - MVP 8 Prompt

```text
Implement MVP 8 only after planning it first.

Goal: generate one complete textbook unit/chapter such as Limits.

Use the existing section, concept, skill, and lesson pipelines.

Do not create a new parallel generation architecture.

Generate incrementally:
chapter → sections → concepts → skills → lessons

Provide generation progress UI and recoverable failure states.

Preserve all source provenance.

Stop after one complete generated unit works reliably.
```

---

## Prompt 17 - MVP 9 Prompt

```text
Plan and implement MVP 9: multi-source course understanding.

Add support for syllabus, notes, lecture slides, and worksheets using the existing course_materials architecture.

Use the syllabus to identify actual course scope and important dates.

Establish source priority:
1. professor material
2. syllabus
3. textbook
4. personal notes
5. supplementary AI knowledge

Do not overwrite conflicting source information silently.

The primary outcome should be that the app understands the difference between everything in the textbook and what this specific Calculus I course actually requires.
```

---

## Prompt 18 - MVP 10 Prompt

```text
Plan and implement MVP 10: basic concept and skill mastery.

Use a simple deterministic 0-100 mastery system.

Do not implement Bayesian Knowledge Tracing, machine learning, or advanced statistics.

Track mastery based on activity results and difficulty.

Display concept and skill mastery clearly in the existing UI.

Separate lesson completion from mastery.
```

---

## Prompt 19 - MVP 11 Prompt

```text
Plan and implement MVP 11: review queue.

Use a simple deterministic spaced-review schedule.

Create a Review page that surfaces concepts due for practice.

Generate or reuse appropriate practice activities.

Do not introduce complex spaced repetition algorithms yet.
```

---

## Prompt 20 - MVP 12 Prompt

```text
Plan and implement MVP 12: adaptive study recommendations.

Use deterministic priority logic:
1. critical overdue review
2. weak prerequisite
3. current course skill
4. new material

Do not use an LLM to decide basic recommendation priority.

Create a clear Recommended Next action on the Learn page.
```

---

## Prompt 21 - MVP 13 Prompt

```text
Plan and implement MVP 13: course-calendar and exam awareness.

Use syllabus-derived course dates where available.

Support:
- assignment dates
- quizzes
- midterms
- final exam

Create readiness and recommended-study UI based on upcoming assessments, mastery, and current course progress.

Keep the recommendation algorithm understandable and deterministic.
```

---

# 34. Reusable Cursor Debug Prompt

Use this when a feature behaves incorrectly.

```text
Investigate this issue before editing code.

1. Reproduce or trace the failure from the available information.
2. Inspect the relevant components, hooks, types, database schema, and network/API boundary.
3. Identify the most likely root cause.
4. Explain the root cause briefly.
5. Make the smallest focused fix.
6. Do not refactor unrelated code.
7. Preserve existing architecture and design patterns.
8. After fixing, summarize the change and any remaining limitation.
```

---

# 35. Reusable Cursor Refactor Prompt

Use only when explicitly deciding that a refactor is necessary.

```text
Refactor only the specified area.

Before making changes:
- inspect all call sites
- identify current behavior
- identify why the current structure is causing a real problem

Preserve behavior unless explicitly told otherwise.

Do not combine this refactor with unrelated feature work.

Prefer small composable utilities and domain components over unnecessary abstraction layers.

Afterward, summarize:
- what changed
- why
- migration impact
- any follow-up work
```

---

# 36. Reusable Cursor UI Prompt

```text
Implement the requested UI using the established project design system.

Requirements:
- use Tailwind
- use existing semantic tokens
- reuse shadcn primitives
- use Lucide icons
- preserve responsive behavior
- use accessible labels and interactions
- avoid unnecessary custom primitives
- avoid excessive borders or glassmorphism
- keep the UI playful but clean
- match the existing Duolingo + Linear-inspired visual direction

Do not change application business logic unless required by the requested UI.
```

---

# 37. Reusable Cursor AI Feature Prompt

```text
Implement the requested AI feature using the existing AI architecture.

Before coding:
- inspect existing Edge Functions
- inspect shared AI client utilities
- inspect Zod schemas
- inspect source provenance patterns

Rules:
- AI calls remain server-side
- validate all structured output with Zod
- preserve source provenance
- never generate JSX or UI code
- never silently invent course information
- prefer small scoped prompts over giant context windows
- support retry/regeneration
- store enough metadata for debugging
- do not introduce another AI framework unless necessary

When done, summarize AI input, output, validation, persistence, and failure behavior.
```

---

# 38. Definition of Success for the Personal MVP

The project is successful when the user can upload the real materials from their actual Calculus I class and regularly use the application as their preferred study environment.

A strong personal MVP should eventually support this daily experience:

```text
Open app
   ↓
See today's recommended work
   ↓
Complete a 5-15 minute lesson
   ↓
Receive immediate feedback
   ↓
Review weak concepts
   ↓
See progress toward upcoming class material / exam
```

The final test is not how many AI features exist.

The final test is:

> **Does this app genuinely make learning this Calculus I course easier, clearer, and more motivating?**

---

# 39. Final Instruction to Cursor

Whenever this document is provided to an AI coding agent, the agent should follow this rule:

> **Do not attempt to build the full roadmap at once. Read the entire document for context, identify the currently requested milestone, implement only that milestone, and stop when its acceptance criteria are met.**

