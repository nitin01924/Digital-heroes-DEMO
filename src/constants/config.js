export const APP = {
  name: 'Digital Heroes',
  demoLabel: 'Selection demo · fictional data',
  scoreRange: { min: 1, max: 45 },
  maxScores: 5,
  charityContributionDefault: 20,
  prizePoolContributionDefault: 35,
  plans: {
    monthly: { name: 'Monthly', price: 12, interval: 'month', saving: null },
    yearly: { name: 'Yearly', price: 120, interval: 'year', saving: '2 months on us' },
  },
}

export const PRIZE_DISTRIBUTION = {
  five: 0.4,
  four: 0.35,
  three: 0.25,
}

export const DRAW_MATCHES = [5, 4, 3]

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
