import { matchCount } from './prizePoolService.js'

function uniqueWeightedPick(frequencies, selected) {
  const choices = Array.from({ length: 45 }, (_, index) => index + 1).filter((number) => !selected.includes(number))
  const total = choices.reduce((sum, number) => sum + (frequencies[number] || 1), 0)
  let cursor = Math.random() * total
  for (const number of choices) {
    cursor -= frequencies[number] || 1
    if (cursor <= 0) return number
  }
  return choices[choices.length - 1]
}

export function generateDraw(mode, scores = []) {
  const frequencies = scores.reduce((map, item) => ({ ...map, [item.score]: (map[item.score] || 0) + 1 }), {})
  const numbers = []
  while (numbers.length < 5) {
    const next = mode === 'algorithmic'
      ? uniqueWeightedPick(frequencies, numbers)
      : (() => { let value; do value = Math.floor(Math.random() * 45) + 1; while (numbers.includes(value)); return value })()
    numbers.push(next)
  }
  return numbers.sort((a, b) => a - b)
}

export function buildEntries(users, subscriptions, scores) {
  return users
    .filter((user) => subscriptions.some((sub) => sub.userId === user.id && sub.status === 'active'))
    .map((user) => ({ userId: user.id, numbers: scores.filter((score) => score.userId === user.id).sort((a, b) => b.scoreDate.localeCompare(a.scoreDate)).slice(0, 5).map((score) => score.score) }))
    .filter((entry) => entry.numbers.length === 5)
}

export function evaluateEntries(entries, numbers) {
  return entries.map((entry) => ({ ...entry, matches: matchCount(entry.numbers, numbers) })).filter((entry) => entry.matches >= 3)
}
