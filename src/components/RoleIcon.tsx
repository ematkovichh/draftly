import type { Role } from '../core/types'
const P: Record<Role,string> = {
  top:     'M4 4h6v6H4zM14 4h6v6h-6zM9 10h6v4H9zM11 14h2v6h-2z',
  jungle:  'M12 3a9 9 0 109 9A9 9 0 0012 3zm-1 13V8l7 4z',
  mid:     'M3 21L21 3M3 3l18 18',
  adc:     'M3 3h7v7H3zM14 3h7v7h-7zM8.5 10v4M15.5 10v4M3 14h18',
  support: 'M12 21C12 21 4 16 4 10a5 5 0 0116 0C20 16 12 21 12 21z',
}
export function RoleIcon({ role, className='' }: { role:Role; className?:string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} width="100%" height="100%"><path d={P[role]}/></svg>
}
