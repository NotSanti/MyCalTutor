import type { Course, Lesson } from '@/types/course'

const understandingLimits: Lesson = {
  id: 'understanding-limits',
  skillId: 'limit-intuition',
  title: 'Understanding Limits',
  description: 'See what a limit means visually and numerically.',
  estimatedMinutes: 8,
  xpReward: 20,
  content: {
    intro: {
      objective:
        'Understand what a limit represents: the value a function approaches, not necessarily the value it attains.',
    },
    blocks: [
      {
        type: 'explanation',
        title: 'Approaching a value',
        content:
          'A limit asks: as $x$ gets closer and closer to a number $a$, what value does $f(x)$ get closer to?\n\nThat destination is written $\\lim_{x \\to a} f(x)$.\n\nThe function does not have to equal that value at $x = a$. It only has to approach it.',
      },
      {
        type: 'worked-example',
        problem:
          'What does $\\lim_{x \\to 2} x^2$ appear to be, based on nearby inputs?',
        steps: [
          'Try $x = 1.9$: $1.9^2 = 3.61$.',
          'Try $x = 1.99$: $1.99^2 = 3.9601$.',
          'Try $x = 2.01$: $2.01^2 = 4.0401$.',
          'The outputs crowd around $4$. So $\\lim_{x \\to 2} x^2 = 4$, which also happens to match $f(2)$.',
        ],
      },
      {
        type: 'multiple-choice',
        prompt:
          'The limit $\\lim_{x \\to a} f(x)$ is asking which of the following?',
        options: [
          {
            id: 'a',
            label: 'The exact value of $f(a)$, if it exists.',
          },
          {
            id: 'b',
            label: 'The value that $f(x)$ approaches as $x$ approaches $a$.',
          },
          {
            id: 'c',
            label: 'The largest value $f$ takes near $a$.',
          },
          {
            id: 'd',
            label: 'Whether $f$ is defined at $a$.',
          },
        ],
        answer: 'b',
        explanation:
          'A limit is about approach, not about the function’s value at the exact point. $f(a)$ can be missing or different and the limit can still exist.',
      },
      {
        type: 'explanation',
        title: 'A hole does not kill the limit',
        content:
          'Suppose $g(x) = \\dfrac{x^2 - 4}{x - 2}$ for $x \\neq 2$. At $x = 2$ the expression is undefined.\n\nFor every other nearby $x$, $g(x) = x + 2$, which approaches $4$ as $x$ approaches $2$.\n\nSo $\\lim_{x \\to 2} g(x) = 4$ even though $g(2)$ does not exist.',
      },
      {
        type: 'numeric-answer',
        prompt:
          'As $x$ approaches $2$, $f(x)$ approaches $7$. What is $\\lim_{x \\to 2} f(x)$?',
        answer: 7,
        explanation:
          'If the outputs approach $7$, the limit is $7$. You are naming the destination, not checking $f(2)$.',
      },
      {
        type: 'short-answer',
        prompt:
          'In one or two sentences, why can a limit exist even if $f(a)$ is undefined?',
        keywords: ['approach'],
        explanation:
          'The limit only cares what $f(x)$ approaches as $x$ gets close to $a$. The single point $x = a$ can be missing, or even set to a different value, without changing that approach.',
      },
    ],
    summary: {
      recap:
        'A limit describes the value a function approaches. Notation: $\\lim_{x \\to a} f(x)$. The value at $a$ itself is optional.',
    },
  },
}

const evaluatingLimits: Lesson = {
  id: 'evaluating-limits',
  skillId: 'evaluating-limits',
  title: 'Evaluating Limits',
  description: 'Compute simple limits by direct substitution.',
  estimatedMinutes: 10,
  xpReward: 25,
  content: {
    intro: {
      objective:
        'Evaluate polynomial (and other continuous) limits by substituting the approaching value.',
    },
    blocks: [
      {
        type: 'explanation',
        title: 'Direct substitution',
        content:
          'If $f$ is a polynomial, it is continuous everywhere. For those functions,\n\n$$\\lim_{x \\to a} f(x) = f(a).$$\n\nYou can plug $a$ in. That is called direct substitution.',
      },
      {
        type: 'worked-example',
        problem: 'Evaluate $\\lim_{x \\to 2} (x^2 + 3)$.',
        steps: [
          '$x^2 + 3$ is a polynomial, so substitution is valid.',
          'Replace $x$ with $2$: $2^2 + 3 = 4 + 3 = 7$.',
          'Therefore $\\lim_{x \\to 2} (x^2 + 3) = 7$.',
        ],
      },
      {
        type: 'multiple-choice',
        prompt: 'What is $\\lim_{x \\to 1} (3x + 4)$?',
        options: [
          { id: 'a', label: '$3$' },
          { id: 'b', label: '$4$' },
          { id: 'c', label: '$7$' },
          { id: 'd', label: 'The limit does not exist.' },
        ],
        answer: 'c',
        explanation:
          'Direct substitution: $3(1) + 4 = 7$. Linear functions are polynomials, so this is allowed.',
      },
      {
        type: 'explanation',
        title: 'When substitution is the right first move',
        content:
          'Always try substitution first. If you get a real number, you are done.\n\nIf you get $\\dfrac{0}{0}$, the limit might still exist — you just need algebra first. That comes later. For this lesson, stay with cases where substitution works.',
      },
      {
        type: 'numeric-answer',
        prompt: 'Evaluate $\\lim_{x \\to 3} (x^2 - 1)$.',
        answer: 8,
        explanation:
          'Substitute: $3^2 - 1 = 9 - 1 = 8$.',
      },
      {
        type: 'short-answer',
        prompt:
          'Why is direct substitution valid for $\\lim_{x \\to 2} (x^2 + 3)$?',
        keywords: ['polynomial'],
        explanation:
          'Polynomials are continuous everywhere, so the limit as $x$ approaches $a$ equals the function’s value at $a$. Plugging in $2$ is therefore the limit.',
      },
    ],
    summary: {
      recap:
        'For polynomials, $\\lim_{x \\to a} f(x) = f(a)$. Try substitution first; a clean number means you have the limit.',
    },
  },
}

export const calculusICourse: Course = {
  id: 'calculus-i',
  title: 'Calculus I',
  description: 'A personal path through functions, limits, and beyond.',
  units: [
    {
      id: 'foundations',
      title: 'Unit 1 — Foundations',
      description: 'Functions, domain, and graphs.',
      sortOrder: 1,
      skills: [
        {
          id: 'functions',
          title: 'Functions',
          description: 'What a function is and how to read $f(x)$.',
          sortOrder: 1,
          lessonId: null,
          startsCompleted: true,
        },
        {
          id: 'domain-range',
          title: 'Domain & Range',
          description: 'Inputs a function allows and outputs it can produce.',
          sortOrder: 2,
          lessonId: null,
          startsCompleted: true,
        },
        {
          id: 'graph-transformations',
          title: 'Graph Transformations',
          description: 'Shifts, stretches, and reflections.',
          sortOrder: 3,
          lessonId: null,
          startsCompleted: true,
        },
      ],
    },
    {
      id: 'limits',
      title: 'Unit 2 — Limits',
      description: 'Approach, evaluation, and continuity.',
      sortOrder: 2,
      skills: [
        {
          id: 'limit-intuition',
          title: 'Limit Intuition',
          description: 'What a limit is asking for.',
          sortOrder: 1,
          lessonId: 'understanding-limits',
          startsCompleted: false,
        },
        {
          id: 'evaluating-limits',
          title: 'Evaluating Limits',
          description: 'Compute limits of simple formulas.',
          sortOrder: 2,
          lessonId: 'evaluating-limits',
          startsCompleted: false,
        },
        {
          id: 'one-sided-limits',
          title: 'One-Sided Limits',
          description: 'Approaching from the left or the right.',
          sortOrder: 3,
          lessonId: null,
          startsCompleted: false,
        },
        {
          id: 'continuity',
          title: 'Continuity',
          description: 'When a function has no breaks.',
          sortOrder: 4,
          lessonId: null,
          startsCompleted: false,
        },
      ],
    },
  ],
  lessons: [understandingLimits, evaluatingLimits],
}

export function getLessonById(lessonId: string): Lesson | undefined {
  return calculusICourse.lessons.find((lesson) => lesson.id === lessonId)
}

export function getUnitForSkill(skillId: string) {
  return calculusICourse.units.find((unit) =>
    unit.skills.some((skill) => skill.id === skillId),
  )
}

export function getSkillById(skillId: string) {
  for (const unit of calculusICourse.units) {
    const skill = unit.skills.find((item) => item.id === skillId)
    if (skill) {
      return skill
    }
  }

  return undefined
}

export function getSkillByLessonId(lessonId: string) {
  for (const unit of calculusICourse.units) {
    const skill = unit.skills.find((item) => item.lessonId === lessonId)
    if (skill) {
      return skill
    }
  }

  return undefined
}
