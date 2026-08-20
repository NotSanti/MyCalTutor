# Agent rules

This is a personal Calculus I learning app. The design document `calculus_learning_app_design_doc.md` is the source of truth. Follow these rules on every change.

## 1. Do not overbuild

Implement only what is necessary for the active milestone. Do not introduce infrastructure for hypothetical future requirements.

## 2. Work one milestone at a time

Never attempt to build the entire application from the design document in one pass. Each milestone should be independently reviewed before continuing.

## 3. Inspect before editing

Before implementing a feature, inspect relevant components, types, database migrations, utilities, and existing design patterns. Do not duplicate functionality that already exists.

## 4. No unrelated refactors

Do not refactor unrelated code while implementing a milestone. Keep changes focused.

## 5. Strict TypeScript

Avoid `any`. Prefer `unknown` plus runtime validation when input is untrusted. Avoid unsafe assertions unless clearly justified.

## 6. Validate boundaries

Use Zod at external boundaries such as AI output, form input, Edge Function payloads, and external API responses. Do not repeatedly validate trusted internal TypeScript objects without reason.

## 7. AI never controls presentation

AI outputs structured data. React renders that data. Never ask AI to generate JSX, React components, Tailwind classes, or arbitrary HTML.

## 8. Reuse shadcn primitives

Before creating generic UI primitives (buttons, dialogs, dropdowns, tabs, tooltips, sheets), use or extend the relevant shadcn component.

Create custom components for domain-specific UI such as SkillNode, CoursePath, LessonProgress, ActivityCard, and MasteryRing.

## 9. Use semantic Tailwind styling

Prefer semantic tokens, consistent spacing, component variants, and reusable patterns. Avoid repeated arbitrary styling values.

## 10. Keep components focused

Page components orchestrate data and layout. Feature components render domain-specific UI. Business logic belongs in hooks, services, or domain utilities. Avoid massive page components.

## 11. Do not use Zustand by default

- Server state → TanStack Query
- URL state → React Router
- Local state → useState / useReducer

Use Zustand only for genuine shared client state.

## 12. Database changes require migrations

Every Supabase schema change should be represented by a migration. Do not rely on undocumented manual dashboard changes.

## 13. Never expose secrets

Never place an AI provider API key or the Supabase service-role key inside `VITE_*` variables or client-side code.

## 14. Source attribution is mandatory

Wherever practical, preserve relationships between generated educational content and original source pages.

## 15. AI failures must be recoverable

AI operations should support retry or regeneration. Do not leave records permanently stuck in an intermediate status.

## 16. Prefer deterministic logic

If normal code can solve something reliably, use normal code instead of an LLM.

## 17. Never silently invent course information

If source material does not support a statement, do not present it as course truth. Flag uncertainty where needed.

## 18. Preserve mathematics

Use proper mathematical rendering and preserve mathematical notation throughout extraction, storage, AI generation, and display.

## 19. Optimize for personal usefulness

If choosing between architectural purity and functionality that will help the user study tomorrow, prefer the useful implementation.

## 20. Stop at the requested milestone

After completing a milestone:

1. Run tests (`npm run lint` and `npm run build`; add targeted tests when the milestone introduced logic that is hard to verify by hand)
2. Commit and push to `main`
3. Confirm the Vercel production deploy is Ready
4. Summarize changes
5. List important files changed
6. Describe database changes
7. State known limitations
8. Mention the production URL
9. Stop

Do not automatically begin the next milestone.
