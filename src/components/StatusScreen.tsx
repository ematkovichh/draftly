import { motion } from 'framer-motion'
import './StatusScreen.css'

export function LoadingScreen() {
  return (
    <div className="status">
      <motion.div
        className="status__hex"
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
        aria-hidden
      >
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
          <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" />
        </svg>
      </motion.div>
      <p className="status__title">Pulling live champion data</p>
      <p className="status__sub">Fetching the latest patch from Riot Data Dragon…</p>
    </div>
  )
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="status">
      <p className="status__title">Couldn’t load champion data</p>
      <p className="status__sub">{message}</p>
      <button className="ghost-btn" onClick={() => location.reload()}>
        Retry
      </button>
    </div>
  )
}
