import { APP, todayIso } from '../constants/config.js'

export function validateScore({ score, scoreDate }, existingScores, editingId) {
  const value = Number(score)
  if (!Number.isInteger(value) || value < APP.scoreRange.min || value > APP.scoreRange.max) return 'Enter a whole Stableford score from 1 to 45.'
  if (!scoreDate) return 'Choose the date the score was achieved.'
  if (scoreDate > todayIso()) return 'A score cannot be dated in the future.'
  if (existingScores.some((item) => item.scoreDate === scoreDate && item.id !== editingId)) return 'You already have a score for that date.'
  return null
}

export function retainLatestFive(scores) {
  return [...scores]
    .sort((a, b) => new Date(b.scoreDate) - new Date(a.scoreDate))
    .slice(0, APP.maxScores)
}

export function scoreAverage(scores) {
  if (!scores.length) return 0
  return Math.round(scores.reduce((total, item) => total + item.score, 0) / scores.length * 10) / 10
}
