import { Files, GraduationCap, type LucideIcon } from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/learn', label: 'Learn', icon: GraduationCap },
  { to: '/materials', label: 'Materials', icon: Files },
]
