import {
  getSupabaseClient,
  isSupabaseConfigured,
} from '@/lib/supabase/client'
import type { Course, LessonContent, ProgressState } from '@/types/course'

export class SupabaseNotConfiguredError extends Error {
  constructor() {
    super('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    this.name = 'SupabaseNotConfiguredError'
  }
}

function requireClient() {
  const client = getSupabaseClient()
  if (!client) {
    throw new SupabaseNotConfiguredError()
  }

  return client
}

export { isSupabaseConfigured }

type CourseRow = {
  id: string
  title: string
  description: string
}

type UnitRow = {
  id: string
  course_id: string
  title: string
  description: string
  sort_order: number
}

type SkillRow = {
  id: string
  unit_id: string
  title: string
  description: string
  sort_order: number
  starts_completed: boolean
}

type LessonRow = {
  id: string
  skill_id: string
  title: string
  description: string
  estimated_minutes: number
  xp_reward: number
  content: LessonContent
}

type LearnerStateRow = {
  id: number
  xp: number
  streak_days: number
  last_practiced_on: string | null
  in_progress_lesson_id: string | null
  in_progress_block_index: number | null
}

type SkillProgressRow = {
  skill_id: string
  completed: boolean
}

function throwIfError(error: { message: string } | null) {
  if (error) {
    throw new Error(error.message)
  }
}

export function assembleCourse(
  course: CourseRow,
  units: UnitRow[],
  skills: SkillRow[],
  lessons: LessonRow[],
): Course {
  const lessonsBySkill = new Map<string, LessonRow[]>()
  for (const lesson of lessons) {
    const list = lessonsBySkill.get(lesson.skill_id) ?? []
    list.push(lesson)
    lessonsBySkill.set(lesson.skill_id, list)
  }

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    units: units
      .filter((unit) => unit.course_id === course.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((unit) => ({
        id: unit.id,
        title: unit.title,
        description: unit.description,
        sortOrder: unit.sort_order,
        skills: skills
          .filter((skill) => skill.unit_id === unit.id)
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((skill) => ({
            id: skill.id,
            title: skill.title,
            description: skill.description,
            sortOrder: skill.sort_order,
            startsCompleted: skill.starts_completed,
            lessonId: lessonsBySkill.get(skill.id)?.[0]?.id ?? null,
          })),
      })),
    lessons: lessons.map((lesson) => ({
      id: lesson.id,
      skillId: lesson.skill_id,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimated_minutes,
      xpReward: lesson.xp_reward,
      content: lesson.content,
    })),
  }
}

export async function fetchCourse(): Promise<Course> {
  const client = requireClient()

  const [courseResult, unitsResult, skillsResult, lessonsResult] =
    await Promise.all([
      client.from('courses').select('id, title, description').eq('id', 'calculus-i').single(),
      client.from('units').select('id, course_id, title, description, sort_order'),
      client.from('skills').select('id, unit_id, title, description, sort_order, starts_completed'),
      client.from('lessons').select('id, skill_id, title, description, estimated_minutes, xp_reward, content'),
    ])

  throwIfError(courseResult.error)
  throwIfError(unitsResult.error)
  throwIfError(skillsResult.error)
  throwIfError(lessonsResult.error)

  if (!courseResult.data) {
    throw new Error('Calculus I course was not found.')
  }

  return assembleCourse(
    courseResult.data as CourseRow,
    (unitsResult.data ?? []) as UnitRow[],
    (skillsResult.data ?? []) as SkillRow[],
    (lessonsResult.data ?? []) as LessonRow[],
  )
}

export async function fetchProgress(course: Course): Promise<ProgressState> {
  const client = requireClient()

  const [stateResult, progressResult] = await Promise.all([
    client
      .from('learner_state')
      .select(
        'id, xp, streak_days, last_practiced_on, in_progress_lesson_id, in_progress_block_index',
      )
      .eq('id', 1)
      .maybeSingle(),
    client.from('skill_progress').select('skill_id, completed'),
  ])

  throwIfError(stateResult.error)
  throwIfError(progressResult.error)

  const state = (stateResult.data ?? {
    xp: 0,
    streak_days: 0,
    last_practiced_on: null,
    in_progress_lesson_id: null,
    in_progress_block_index: null,
  }) as LearnerStateRow

  const completedSkillIds = new Set(
    ((progressResult.data ?? []) as SkillProgressRow[])
      .filter((row) => row.completed)
      .map((row) => row.skill_id),
  )

  const completedLessonIds = course.lessons
    .filter((lesson) => completedSkillIds.has(lesson.skillId))
    .map((lesson) => lesson.id)

  return {
    xp: state.xp,
    streakDays: state.streak_days,
    lastPracticedOn: state.last_practiced_on,
    completedLessonIds,
    inProgress:
      state.in_progress_lesson_id != null &&
      state.in_progress_block_index != null
        ? {
            lessonId: state.in_progress_lesson_id,
            blockIndex: state.in_progress_block_index,
          }
        : null,
  }
}

export async function persistLearnerState(progress: ProgressState) {
  const client = requireClient()
  const result = await client.from('learner_state').upsert({
    id: 1,
    xp: progress.xp,
    streak_days: progress.streakDays,
    last_practiced_on: progress.lastPracticedOn,
    in_progress_lesson_id: progress.inProgress?.lessonId ?? null,
    in_progress_block_index: progress.inProgress?.blockIndex ?? null,
    updated_at: new Date().toISOString(),
  })

  throwIfError(result.error)
}

export async function upsertSkillProgress(skillId: string, completed: boolean) {
  const client = requireClient()
  const result = await client.from('skill_progress').upsert({
    skill_id: skillId,
    completed,
    last_practiced_at: completed ? new Date().toISOString() : null,
  })

  throwIfError(result.error)
}

export async function recordActivityAttempt(input: {
  activityId: string
  answer: string
  isCorrect: boolean
}) {
  const client = requireClient()
  const result = await client.from('activity_attempts').insert({
    activity_id: input.activityId,
    answer: input.answer,
    is_correct: input.isCorrect,
  })

  throwIfError(result.error)
}

export function isDefaultProgress(progress: ProgressState) {
  return (
    progress.xp === 0 &&
    progress.streakDays === 0 &&
    progress.completedLessonIds.length === 0 &&
    progress.inProgress === null
  )
}
