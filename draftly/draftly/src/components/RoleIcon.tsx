import type { Role } from '../core/types'

interface Props {
  role: Role
  size?: number
  className?: string
}

/**
 * Minimal hextech-styled lane glyphs drawn as inline SVG so they always
 * load and inherit the gold colour. Stylised to read at small sizes.
 */
export function RoleIcon({ role, size = 22, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinejoin: 'round' as const,
    strokeLinecap: 'round' as const,
  }
  switch (role) {
    case 'top':
      return (
        <svg {...common} aria-hidden>
          <path d="M4 20V4h16" />
          <path d="M4 4l6 6" />
          <rect x="13" y="13" width="6" height="6" rx="1" />
        </svg>
      )
    case 'jungle':
      return (
        <svg {...common} aria-hidden>
          <path d="M12 21c0-5 0-8-4-12" />
          <path d="M12 21c0-5 0-8 4-12" />
          <path d="M8 9C8 5 12 3 12 3s4 2 4 6" />
        </svg>
      )
    case 'mid':
      return (
        <svg {...common} aria-hidden>
          <path d="M4 20L20 4" />
          <path d="M14 4h6v6" />
          <path d="M10 20H4v-6" />
        </svg>
      )
    case 'adc':
      return (
        <svg {...common} aria-hidden>
          <path d="M20 20H4V4" />
          <path d="M20 20l-6-6" />
          <rect x="5" y="5" width="6" height="6" rx="1" />
        </svg>
      )
    case 'support':
      return (
        <svg {...common} aria-hidden>
          <path d="M12 21s-7-4.3-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.7-7 10-7 10z" />
        </svg>
      )
  }
}
