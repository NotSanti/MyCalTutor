import { createBrowserRouter, Navigate } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { LearnPage } from '@/pages/learn/LearnPage'
import { LessonPage } from '@/pages/lesson/LessonPage'
import { MaterialsPage } from '@/pages/materials/MaterialsPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/learn" replace /> },
      { path: 'learn', element: <LearnPage /> },
      { path: 'materials', element: <MaterialsPage /> },
    ],
  },
  {
    path: '/lesson/:lessonId',
    element: <LessonPage />,
  },
])
