import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, ChevronRight, CircleAlert, Info, Menu, Moon, ShieldCheck, Sun, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../contexts/AppContext'

export function cx(...values) { return values.filter(Boolean).join(' ') }

export function Button({ children, variant = 'primary', className, icon: Icon, ...props }) {
  return <button className={cx('button', `button-${variant}`, className)} {...props}>{children}{Icon && <Icon size={16} />}</button>
}

export function Badge({ children, tone = 'neutral' }) { return <span className={cx('badge', `badge-${tone}`)}>{children}</span> }

export function ThemeToggle() {
  const { state, toggleTheme } = useApp()
  return <button className="icon-button" onClick={toggleTheme} aria-label="Toggle colour theme">{state.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
}

export function Reveal({ children, delay = 0, className }) {
  const reduceMotion = useReducedMotion()
  return <motion.div className={className} initial={reduceMotion ? false : { opacity: 0, y: 15 }} whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.45, delay }}>{children}</motion.div>
}

export function Navbar() {
  const { user, logout } = useApp()
  const [open, setOpen] = React.useState(false)
  const navigate = useNavigate()
  const go = (to) => { setOpen(false); navigate(to) }
  return <header className="site-header">
    <div className="shell nav-wrap">
      <Link className="brand" to="/" aria-label="Digital Heroes home"><span className="brand-mark">DH</span><span>digital heroes</span></Link>
      <nav className={cx('main-nav', open && 'main-nav-open')} aria-label="Main navigation">
        <NavLink to="/how-it-works" onClick={() => setOpen(false)}>How it works</NavLink>
        <NavLink to="/charities" onClick={() => setOpen(false)}>Charities</NavLink>
        {user && <NavLink to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={() => setOpen(false)}>{user.role === 'admin' ? 'Admin' : 'My space'}</NavLink>}
        <div className="nav-mobile-actions"><ThemeToggle />{user ? <Button variant="ghost" onClick={() => { logout(); go('/') }}>Sign out</Button> : <Button onClick={() => go('/login')}>Sign in</Button>}</div>
      </nav>
      <div className="nav-actions"><ThemeToggle />{user ? <><span className="avatar avatar-small">{user.avatar}</span><Button variant="ghost" onClick={() => { logout(); navigate('/') }}>Sign out</Button></> : <><Link className="text-link" to="/login">Sign in</Link><Link className="button button-primary" to="/signup">Join the demo <ArrowRight size={16} /></Link></>}</div>
      <button className="mobile-menu" aria-expanded={open} aria-label="Open navigation" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
    </div>
  </header>
}

export function Footer() {
  return <footer className="footer"><div className="shell footer-inner"><div><Link className="brand" to="/"><span className="brand-mark">DH</span><span>digital heroes</span></Link><p>Golf, impact and rewards — shown as a fictional product demonstration.</p></div><div className="footer-links"><Link to="/how-it-works">How it works</Link><Link to="/charities">Charities</Link><Link to="/login">Demo access</Link></div><Badge tone="warning">NON-OFFICIAL DEMO</Badge></div></footer>
}

export function DemoNotice() {
  const [visible, setVisible] = React.useState(() => !localStorage.getItem('dh-demo-notice-dismissed'))
  const speak = () => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance('Welcome to the Digital Heroes selection demo. Everything shown here is fictional and no payments, donations or prizes are real.'))
  }
  const dismiss = () => { localStorage.setItem('dh-demo-notice-dismissed', 'true'); setVisible(false) }
  return <AnimatePresence>{visible && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="presentation"><motion.section className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}><span className="eyebrow"><ShieldCheck size={14} /> Selection demo</span><h2 id="demo-title">A prototype with a real point of view.</h2><p>This is a non-official Digital Heroes prototype made for a full-stack development selection assignment. All people, charities, subscriptions, payments, prize pools, draws and payouts are fictional demonstration content.</p><div className="modal-actions"><Button variant="secondary" onClick={speak}>▶ Hear the introduction</Button><Button onClick={dismiss}>Continue to demo <ArrowRight size={16} /></Button></div></motion.section></motion.div>}</AnimatePresence>
}

export function Toast() {
  const { toast } = useApp()
  return <AnimatePresence>{toast && <motion.div className={cx('toast', `toast-${toast.kind}`)} role="status" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>{toast.kind === 'error' ? <CircleAlert size={18} /> : <Check size={18} />} {toast.message}</motion.div>}</AnimatePresence>
}

export function PageHero({ eyebrow, title, copy, children }) { return <section className="page-hero"><div className="shell"><Reveal><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{copy}</p>{children}</Reveal></div></section> }

export function EmptyState({ title, copy, action }) { return <div className="empty-state"><Info size={22} /><h3>{title}</h3><p>{copy}</p>{action}</div> }

export function StatusPill({ value }) { const tone = ['active', 'approved', 'paid', 'published'].includes(value) ? 'positive' : ['pending', 'simulated'].includes(value) ? 'warning' : 'neutral'; return <Badge tone={tone}>{value}</Badge> }

export function BackLink({ to, children = 'Back' }) { return <Link className="back-link" to={to}>‹ {children}</Link> }

export function StatCard({ label, value, detail, icon: Icon, color }) { return <article className="stat-card"><div className="stat-icon" style={{ background: color }}><Icon size={19} /></div><div><p>{label}</p><strong>{value}</strong>{detail && <small>{detail}</small>}</div></article> }

export function LinkArrow({ to, children }) { return <Link className="inline-link" to={to}>{children}<ChevronRight size={16} /></Link> }
