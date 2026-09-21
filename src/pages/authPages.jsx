import { useState } from 'react'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui'
import { useApp } from '../contexts/AppContext'

function AuthFrame({ title, copy, children }) { return <div className="auth-page"><div className="auth-aside"><Link className="brand" to="/"><span className="brand-mark">DH</span><span>digital heroes</span></Link><div><span className="eyebrow light">Selection demo</span><h1>Bring a little more meaning to the game.</h1><p>Sign in to explore the member and admin product flows using fictional demo data.</p></div><small>No real financial or charitable activity occurs in this product demonstration.</small></div><main className="auth-main"><Link className="back-link" to="/">‹ Back to home</Link><section className="auth-card"><span className="eyebrow">Welcome</span><h2>{title}</h2><p>{copy}</p>{children}</section></main></div> }

function Field({ label, icon: Icon, ...props }) { return <label className="form-field"><span>{label}</span><div className="input-icon"><Icon size={17} /><input {...props} /></div></label> }

export function LoginPage() {
  const { user, login, loading } = useApp(); const navigate = useNavigate(); const location = useLocation(); const [form, setForm] = useState({ email: '', password: '' }); const [error, setError] = useState(''); const [show, setShow] = useState(false)
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  const submit = async (event) => { event.preventDefault(); setError(''); const result = await login(form.email, form.password); if (result.error) return setError(result.error); navigate(location.state?.from?.pathname || (result.user.role === 'admin' ? '/admin' : '/dashboard')) }
  const demo = (admin = false) => setForm(admin ? { email: 'demo.admin@example.com', password: 'DemoAdmin@123' } : { email: 'demo.user@example.com', password: 'DemoUser@123' })
  return <AuthFrame title="Good to see you." copy="Use the supplied demo credentials, or create a local browser-only account."><form onSubmit={submit} noValidate><Field label="Email address" icon={Mail} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" /><label className="form-field"><span>Password</span><div className="input-icon"><LockKeyhole size={17} /><input type={show ? 'text' : 'password'} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required autoComplete="current-password" /><button type="button" onClick={() => setShow(!show)} aria-label="Show password">{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>{error && <p className="form-error">{error}</p>}<Button className="form-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <ArrowRight size={16} /></Button></form><div className="demo-credentials"><strong>Quick demo access</strong><button onClick={() => demo(false)}>Member · demo.user@example.com</button><button onClick={() => demo(true)}>Admin · demo.admin@example.com</button></div><p className="auth-switch">New here? <Link to="/signup">Create a demo account</Link></p></AuthFrame>
}

export function SignupPage() {
  const { user, signup } = useApp(); const navigate = useNavigate(); const [form, setForm] = useState({ name: '', email: '', password: '' }); const [error, setError] = useState('')
  if (user) return <Navigate to="/dashboard" replace />
  const submit = async (event) => { event.preventDefault(); setError(''); const result = await signup(form); if (result.error) return setError(result.error); navigate('/dashboard') }
  return <AuthFrame title="Start your demo journey." copy="This creates a local demonstration account in this browser; it does not create a real membership."><form onSubmit={submit} noValidate><Field label="Your name" icon={UserRound} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required autoComplete="name" /><Field label="Email address" icon={Mail} type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required autoComplete="email" /><Field label="Password" icon={LockKeyhole} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required minLength="8" autoComplete="new-password" />{error && <p className="form-error">{error}</p>}<Button className="form-submit" type="submit">Create demo account <ArrowRight size={16} /></Button></form><p className="auth-switch">Already have access? <Link to="/login">Sign in</Link></p></AuthFrame>
}
