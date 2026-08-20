import { useQuery } from '@tanstack/react-query'

import { fetchCourse, isSupabaseConfigured } from '@/lib/supabase/queries'

export function useCourse() {
  return useQuery({
    queryKey: ['course', 'calculus-i'],
    queryFn: fetchCourse,
    enabled: isSupabaseConfigured(),
  })
}
