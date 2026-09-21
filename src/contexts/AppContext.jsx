import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { charities, demoUsers, seededDraws, seededScores, seededSubscriptions, seededWinners } from '../constants/demoData'
import { APP, todayIso } from '../constants/config'
import { retainLatestFive, validateScore } from '../services/scoreService'
import { buildEntries, evaluateEntries, generateDraw } from '../services/drawService'
import { calculatePrizePools, suggestedPrizePool } from '../services/prizePoolService'

const AppContext = createContext(null)
const STORAGE_KEY = 'digital-heroes-demo-state-v1'

const defaultState = {
  users: demoUsers,
  charities,
  scores: seededScores,
  subscriptions: seededSubscriptions,
  draws: seededDraws,
  winners: seededWinners,
  sessionId: null,
  theme: 'light',
}

function readState() {
  try { return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) } } catch { return defaultState }
}

export function AppProvider({ children }) {
  const [state, setState] = useState(readState)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const user = state.users.find((item) => item.id === state.sessionId) || null

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) }, [state])
  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
    document.documentElement.style.colorScheme = state.theme
  }, [state.theme])
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 4200)
    return () => clearTimeout(timer)
  }, [toast])

  const notify = (message, kind = 'success') => setToast({ message, kind })
  const update = (updater) => setState((previous) => typeof updater === 'function' ? updater(previous) : { ...previous, ...updater })
  const subscription = user ? state.subscriptions.find((item) => item.userId === user.id) : null
  const isSubscriber = subscription?.status === 'active'
  const isAdmin = user?.role === 'admin'
  const requireAdmin = useCallback(() => isAdmin ? null : { error: 'Administrator access is required for this action.' }, [isAdmin])

  const actions = useMemo(() => ({
    login: async (email, password) => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 450))
      const candidate = state.users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password)
      setLoading(false)
      if (!candidate) return { error: 'Those details do not match a demo account.' }
      update((current) => ({ ...current, sessionId: candidate.id }))
      return { user: candidate }
    },
    signup: async ({ name, email, password }) => {
      if (state.users.some((item) => item.email.toLowerCase() === email.toLowerCase())) return { error: 'An account with that email already exists.' }
      if (password.length < 8) return { error: 'Use at least 8 characters for your password.' }
      const account = { id: `user-${crypto.randomUUID()}`, name: name.trim(), email: email.trim().toLowerCase(), password, role: 'user', charityId: null, contribution: APP.charityContributionDefault, avatar: name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() }
      update((current) => ({ ...current, users: [...current.users, account], sessionId: account.id }))
      return { user: account }
    },
    logout: () => update((current) => ({ ...current, sessionId: null })),
    toggleTheme: () => update((current) => ({ ...current, theme: current.theme === 'light' ? 'dark' : 'light' })),
    resetDemo: () => { localStorage.removeItem(STORAGE_KEY); setState(defaultState); notify('The demonstration data has been restored.') },
    chooseCharity: (charityId, contribution) => {
      if (!user) return
      if (!state.charities.some((item) => item.id === charityId)) return { error: 'Choose a valid demo charity.' }
      if (!Number.isFinite(Number(contribution)) || Number(contribution) < 0 || Number(contribution) > 100) return { error: 'Contribution must be between 0% and 100%.' }
      update((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? { ...item, charityId, contribution: Number(contribution) } : item) }))
      notify('Your giving preference has been updated.')
      return { success: true }
    },
    updateProfile: ({ name }) => {
      const cleanName = name?.trim()
      if (!cleanName) return { error: 'Enter your name.' }
      update((current) => ({ ...current, users: current.users.map((item) => item.id === user.id ? { ...item, name: cleanName, avatar: cleanName.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() } : item) }))
      notify('Your demo profile has been updated.')
      return { success: true }
    },
    startSubscription: (plan) => {
      if (!user) return { error: 'Please sign in to start a subscription.' }
      if (!APP.plans[plan]) return { error: 'Choose a valid subscription plan.' }
      const renewalDate = new Date(); renewalDate.setMonth(renewalDate.getMonth() + (plan === 'yearly' ? 12 : 1))
      update((current) => ({ ...current, subscriptions: [...current.subscriptions.filter((item) => item.userId !== user.id), { id: `sub-${crypto.randomUUID()}`, userId: user.id, plan, status: 'active', renewalDate: renewalDate.toISOString().slice(0, 10) }] }))
      notify(`Your ${plan} test subscription is now active. No payment was processed.`)
      return { success: true }
    },
    cancelSubscription: () => {
      if (!user) return
      update((current) => ({ ...current, subscriptions: current.subscriptions.map((item) => item.userId === user.id ? { ...item, status: 'cancelled' } : item) }))
      notify('Subscription marked cancelled in this demo.', 'info')
    },
    saveScore: ({ id, score, scoreDate }) => {
      if (!user || !isSubscriber) return { error: 'An active subscription is needed to manage scores.' }
      const mine = state.scores.filter((item) => item.userId === user.id)
      const validation = validateScore({ score, scoreDate }, mine, id)
      if (validation) return { error: validation }
      const row = { id: id || `score-${crypto.randomUUID()}`, userId: user.id, score: Number(score), scoreDate }
      const nextMine = retainLatestFive(id ? mine.map((item) => item.id === id ? row : item) : [...mine, row])
      update((current) => ({ ...current, scores: [...current.scores.filter((item) => item.userId !== user.id), ...nextMine] }))
      notify(id ? 'Score updated.' : mine.length >= 5 ? 'Score added; the oldest score was removed.' : 'Score added.')
      return { success: true }
    },
    deleteScore: (id) => {
      if (!state.scores.some((item) => item.id === id && item.userId === user?.id)) return { error: 'You can only remove your own scores.' }
      update((current) => ({ ...current, scores: current.scores.filter((item) => item.id !== id) }))
      notify('Score removed.', 'info')
      return { success: true }
    },
    createDraw: ({ title, date, mode, pool }) => {
      const access = requireAdmin(); if (access) return access
      if (!title?.trim() || !date || !['random', 'algorithmic'].includes(mode)) return { error: 'Provide a name, date and valid draw mode.' }
      if (!Number.isFinite(Number(pool)) || Number(pool) < 0) return { error: 'Prize pool must be zero or greater.' }
      const draw = { id: `draw-${crypto.randomUUID()}`, title: title.trim() || 'Untitled draw', date, mode, pool: Number(pool), state: 'draft', numbers: [] }
      update((current) => ({ ...current, draws: [draw, ...current.draws] }))
      notify('Draft draw created.')
      return draw
    },
    simulateDraw: (id) => {
      const access = requireAdmin(); if (access) return access
      const draw = state.draws.find((item) => item.id === id)
      if (!draw) return { error: 'This draw no longer exists.' }
      const numbers = generateDraw(draw.mode, state.scores)
      const entries = buildEntries(state.users, state.subscriptions, state.scores)
      const results = evaluateEntries(entries, numbers)
      update((current) => ({ ...current, draws: current.draws.map((item) => item.id === id ? { ...item, numbers, state: 'simulated', results } : item) }))
      notify('Simulation complete. Results remain private until published.')
      return { success: true }
    },
    publishDraw: (id) => {
      const access = requireAdmin(); if (access) return access
      const draw = state.draws.find((item) => item.id === id)
      if (!draw?.numbers?.length) return { error: 'Run a simulation before publishing.' }
      const results = draw.results || []
      const matchCounts = { five: results.filter((item) => item.matches === 5).length, four: results.filter((item) => item.matches === 4).length, three: results.filter((item) => item.matches === 3).length }
      const priorJackpot = state.draws
        .filter((item) => item.date < draw.date && item.state === 'published')
        .sort((a, b) => b.date.localeCompare(a.date))[0]?.jackpotCarriedOut || 0
      const pools = calculatePrizePools(draw.pool, matchCounts, priorJackpot)
      const newWinners = results.map((result) => {
        const tier = result.matches === 5 ? 'five' : result.matches === 4 ? 'four' : 'three'
        return { id: `winner-${crypto.randomUUID()}`, userId: result.userId, drawId: id, tier: result.matches, amount: pools[tier].each, verification: 'pending', payout: 'pending', proofName: null, createdAt: todayIso() }
      })
      update((current) => ({ ...current, draws: current.draws.map((item) => item.id === id ? { ...item, state: 'published', prizeBreakdown: pools, jackpotCarriedOut: pools.five.rollsOver ? pools.five.pool : 0 } : item), winners: [...current.winners, ...newWinners] }))
      notify('Draw results are published to eligible members.')
      return { success: true }
    },
    uploadProof: (winnerId, file) => {
      if (!state.winners.some((item) => item.id === winnerId && item.userId === user?.id)) return { error: 'You can only upload proof for your own award.' }
      if (!file) return { error: 'Choose a score proof file first.' }
      if (file.size > 8 * 1024 * 1024) return { error: 'Use a file smaller than 8 MB.' }
      update((current) => ({ ...current, winners: current.winners.map((item) => item.id === winnerId ? { ...item, proofName: file.name, verification: 'pending' } : item) }))
      notify('Proof uploaded for review. Demo files are not sent to a server.')
      return { success: true }
    },
    reviewWinner: (winnerId, verification) => {
      const access = requireAdmin(); if (access) return access
      if (!['approved', 'rejected'].includes(verification)) return { error: 'Choose an approval or rejection status.' }
      update((current) => ({ ...current, winners: current.winners.map((item) => item.id === winnerId ? { ...item, verification } : item) }))
      notify(`Proof ${verification}.`)
    },
    updatePayout: (winnerId, payout) => {
      const access = requireAdmin(); if (access) return access
      const winner = state.winners.find((item) => item.id === winnerId)
      if (!winner || winner.verification !== 'approved') return { error: 'Only approved winners can be marked paid.' }
      update((current) => ({ ...current, winners: current.winners.map((item) => item.id === winnerId ? { ...item, payout } : item) }))
      notify(`Payout marked ${payout}.`)
    },
    saveCharity: (payload) => {
      const access = requireAdmin(); if (access) return access
      if (!payload.name?.trim() || !payload.category?.trim() || !payload.description?.trim()) return { error: 'Name, category and description are required.' }
      const record = { ...payload, id: payload.id || `${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomUUID().slice(0, 5)}`, raised: payload.raised || 0, supporters: payload.supporters || 0, events: payload.events || [] }
      update((current) => ({ ...current, charities: payload.id ? current.charities.map((item) => item.id === payload.id ? record : item) : [...current.charities, record] }))
      notify(payload.id ? 'Charity updated.' : 'Charity added.')
    },
    deleteCharity: (id) => {
      const access = requireAdmin(); if (access) return access
      if (state.users.some((item) => item.charityId === id)) return { error: 'This charity is selected by a demo member and cannot be removed.' }
      update((current) => ({ ...current, charities: current.charities.filter((item) => item.id !== id) }))
      notify('Charity removed from the demo directory.', 'info')
    },
  // State is intentionally the source of truth for the local selection demo.
  }), [state, user, isSubscriber, requireAdmin])

  const value = { state, user, subscription, isSubscriber, isAdmin, suggestedPrizePool: suggestedPrizePool(state.subscriptions), toast, loading, notify, ...actions }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
