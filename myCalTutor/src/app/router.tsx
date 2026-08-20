import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { ConceptInspectorPage } from '@/pages/course/ConceptInspectorPage'
import { CourseSetupPage } from '@/pages/course/CourseSetupPage'
import { LearnPage } from '@/pages/learn/LearnPage'
import { LessonPage } from '@/pages/lesson/LessonPage'
import { MaterialInspectorPage } from '@/pages/materials/MaterialInspectorPage'
import { MaterialsPage } from '@/pages/materials/MaterialsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/learn" replace /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'materials', element: <MaterialsPage /> },
      { path: 'materials/:materialId', element: <MaterialInspectorPage /> },
      { path: 'course/setup', element: <CourseSetupPage /> },
      { path: 'course/concepts/:sectionId', element: <ConceptInspectorPage /> },
    ],
  },
  {
    path: '/lesson/:lessonId',
    element: <LessonPage />,
  },
])
