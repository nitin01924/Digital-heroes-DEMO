import { APP, PRIZE_DISTRIBUTION } from '../constants/config.js'

export function calculatePrizePools(pool, matchCounts, priorJackpot = 0) {
  const currentPool = Number(pool)
  return Object.fromEntries(Object.entries(PRIZE_DISTRIBUTION).map(([tier, ratio]) => {
    const count = matchCounts[tier] || 0
    // Only the five-match tier carries an earlier unclaimed jackpot. The
    // current draw's four- and three-match allocations always start fresh.
    const amount = Math.round((currentPool * ratio + (tier === 'five' ? Number(priorJackpot) : 0)) * 100) / 100
    return [tier, { pool: amount, winners: count, each: count ? Math.round(amount / count * 100) / 100 : 0, rollsOver: tier === 'five' && count === 0 }]
  }))
}

export function suggestedPrizePool(subscriptions) {
  return Math.round(subscriptions
    .filter((subscription) => subscription.status === 'active')
    .reduce((total, subscription) => {
      const price = APP.plans[subscription.plan]?.price || 0
      // Annual plans are recognised monthly in the prototype's monthly draw.
      const monthlyValue = subscription.plan === 'yearly' ? price / 12 : price
      return total + monthlyValue * (APP.prizePoolContributionDefault / 100)
    }, 0) * 100) / 100
}

export function matchCount(entryNumbers, drawNumbers) {
  return entryNumbers.filter((value) => drawNumbers.includes(value)).length
}
