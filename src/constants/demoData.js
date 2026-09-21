export const charities = [
  { id: 'green-horizon', name: 'Green Horizon Foundation', category: 'Climate', featured: true, color: '#7d9c74', raised: 48200, supporters: 318, description: 'A fictional community network restoring urban green space and helping neighbourhoods care for the places they share.', events: ['Autumn planting day · 12 Oct', 'Community garden clinic · 26 Oct'] },
  { id: 'bright-futures', name: 'Bright Futures Initiative', category: 'Education', featured: true, color: '#d7a36a', raised: 37150, supporters: 241, description: 'A fictional programme helping young people access mentoring, practical learning and confident next steps.', events: ['Mentor breakfast · 8 Oct', 'Skills studio · 19 Oct'] },
  { id: 'clean-water', name: 'Clean Water Collective', category: 'Environment', featured: false, color: '#75a7ac', raised: 29800, supporters: 192, description: 'A fictional collective supporting locally led water stewardship, education and resilient public spaces.', events: ['River clean-up · 5 Oct'] },
  { id: 'hope-health', name: 'Hope & Health Foundation', category: 'Wellbeing', featured: true, color: '#bd7c8d', raised: 42500, supporters: 286, description: 'A fictional wellbeing fund that connects communities with practical support and welcoming social programmes.', events: ['Open wellbeing day · 15 Oct', 'Community supper · 31 Oct'] },
  { id: 'community-roots', name: 'Community Roots Trust', category: 'Community', featured: false, color: '#a88d63', raised: 26320, supporters: 157, description: 'A fictional grassroots trust that backs neighbour-led projects, shared spaces and local connections.', events: ['Makers market · 10 Oct'] },
]

export const demoUsers = [
  { id: 'user-demo', name: 'Alex Morgan', email: 'demo.user@example.com', password: 'DemoUser@123', role: 'user', charityId: 'green-horizon', contribution: 20, avatar: 'AM' },
  { id: 'admin-demo', name: 'Jordan Lee', email: 'demo.admin@example.com', password: 'DemoAdmin@123', role: 'admin', charityId: 'bright-futures', contribution: 20, avatar: 'JL' },
  { id: 'member-robin', name: 'Robin Patel', email: 'robin@example.demo', password: 'DemoUser@123', role: 'user', charityId: 'hope-health', contribution: 15, avatar: 'RP' },
]

export const seededScores = [
  { id: 's1', userId: 'user-demo', score: 34, scoreDate: '2026-09-19' },
  { id: 's2', userId: 'user-demo', score: 28, scoreDate: '2026-09-11' },
  { id: 's3', userId: 'user-demo', score: 36, scoreDate: '2026-09-03' },
  { id: 's4', userId: 'user-demo', score: 31, scoreDate: '2026-08-23' },
  { id: 's5', userId: 'user-demo', score: 27, scoreDate: '2026-08-13' },
  { id: 's6', userId: 'member-robin', score: 34, scoreDate: '2026-09-18' },
  { id: 's7', userId: 'member-robin', score: 29, scoreDate: '2026-09-07' },
  { id: 's8', userId: 'member-robin', score: 36, scoreDate: '2026-08-27' },
]

export const seededSubscriptions = [
  { id: 'sub-demo', userId: 'user-demo', plan: 'yearly', status: 'active', renewalDate: '2027-08-21' },
  { id: 'sub-robin', userId: 'member-robin', plan: 'monthly', status: 'active', renewalDate: '2026-10-18' },
]

export const seededDraws = [
  { id: 'draw-september', title: 'September Community Draw', date: '2026-09-30', mode: 'algorithmic', state: 'draft', numbers: [], pool: 1260 },
  { id: 'draw-august', title: 'August Community Draw', date: '2026-08-31', mode: 'random', state: 'published', numbers: [5, 14, 27, 31, 39], pool: 1140 },
]

export const seededWinners = [
  { id: 'winner-1', userId: 'user-demo', drawId: 'draw-august', tier: 3, amount: 285, verification: 'approved', payout: 'paid', proofName: 'alex-scorecard.pdf', createdAt: '2026-09-01' },
]
