import { SkillNode } from '@/components/course/SkillNode'
import { getSkillStatus } from '@/lib/progress/unlock'
import type { Course, ProgressState } from '@/types/course'

type CoursePathProps = {
  course: Course
  progress: ProgressState
}

export function CoursePath({ course, progress }: CoursePathProps) {
  const units = [...course.units].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="flex flex-col gap-10">
      {units.map((unit) => {
        const skills = [...unit.skills].sort((a, b) => a.sortOrder - b.sortOrder)

        return (
          <section key={unit.id} className="flex flex-col gap-6">
            <div className="text-center">
              <h2 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                {unit.title}
              </h2>
            </div>

            <ol className="flex flex-col items-center">
              {skills.map((skill, index) => {
                const status = getSkillStatus(course, skill, progress)

                return (
                  <li key={skill.id} className="flex flex-col items-center">
                    <SkillNode
                      title={skill.title}
                      status={status}
                      lessonId={skill.lessonId}
                    />
                    {index < skills.length - 1 ? (
                      <div
                        aria-hidden
                        className="h-10 w-1 rounded-full bg-border"
                      />
                    ) : null}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}
    </div>
  )
}
