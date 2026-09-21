import { motion, useReducedMotion } from 'framer-motion'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { DemoNotice, Footer, Navbar, Toast } from './components/ui'
import { Protected, PublicLayout } from './layouts'
import { AdminPage } from './pages/adminPage'
import { LoginPage, SignupPage } from './pages/authPages'
import { DashboardPage } from './pages/dashboardPage'
import { CharitiesPage, CharityDetailPage, HowItWorksPage, LandingPage } from './pages/publicPages'

function AnimatedPage({ children }) { const reduceMotion = useReducedMotion(); return <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .25 }}>{children}</motion.div> }
function NotFound() { return <><Navbar /><main className="not-found"><CircleAlert size={32} /><h1>That page is out of bounds.</h1><p>The link may have moved, or may not exist in this selection demo.</p><a className="button button-primary" href="/">Return home</a></main><Footer /></> }

export default function App() {
  return <><Routes><Route element={<PublicLayout />}><Route path="/" element={<AnimatedPage><LandingPage /></AnimatedPage>} /><Route path="/how-it-works" element={<AnimatedPage><HowItWorksPage /></AnimatedPage>} /><Route path="/charities" element={<AnimatedPage><CharitiesPage /></AnimatedPage>} /><Route path="/charities/:id" element={<AnimatedPage><CharityDetailPage /></AnimatedPage>} /></Route><Route path="/login" element={<LoginPage />} /><Route path="/signup" element={<SignupPage />} /><Route element={<Protected />}><Route path="/dashboard" element={<DashboardPage />} /></Route><Route element={<Protected admin />}><Route path="/admin" element={<AdminPage />} /></Route><Route path="*" element={<NotFound />} /></Routes><DemoNotice /><Toast /></>
}
