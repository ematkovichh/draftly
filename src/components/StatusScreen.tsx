import { motion } from 'framer-motion'
import './StatusScreen.css'
export function LoadingScreen() {
  return (
    <div className="status">
      <motion.div className="status__hex" animate={{ rotate: 360 }} transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}>
        <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M12 2l8 4.5v9L12 22l-8-6.5v-9L12 2z" stroke="var(--gold)"/>
          <path d="M12 7l4 2.4v4.8L12 17l-4-2.8V9.4L12 7z" stroke="var(--cyan)" strokeWidth="1"/>
        </svg>
      </motion.div>
      <p className="status__title">Forging the roster</p>
      <p className="status__sub">Fetching all champions from Riot Data Dragon…</p>
    </div>
  )
}
export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="status">
      <p className="status__title">Couldn't load champion data</p>
      <p className="status__sub">{message}</p>
      <button onClick={() => location.reload()} style={{marginTop:14,padding:'7px 20px',border:'1px solid var(--gold)',color:'var(--gold)',fontSize:'.8rem',cursor:'pointer',fontFamily:'inherit',letterSpacing:'.1em'}}>Retry</button>
    </div>
  )
}
