import { motion } from 'framer-motion'
import './Header.css'

export function Header() {
  return (
    <header className="masthead">
      <motion.div
        className="masthead__brand"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <span className="masthead__mark" aria-hidden>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
            <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" />
            <path d="M12 7l4 2.4v4.8L12 17l-4-2.8V9.4L12 7z" />
          </svg>
        </span>
        <div>
          <h1 className="masthead__title">DRAFTLY</h1>
          <p className="masthead__tag">Team Composition Forge</p>
        </div>
      </motion.div>
      <div className="masthead__rule hex-rule" />
    </header>
  )
}
