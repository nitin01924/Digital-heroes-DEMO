import assert from 'node:assert/strict'
import test from 'node:test'
import { buildEntries, generateDraw } from '../src/services/drawService.js'
import { calculatePrizePools } from '../src/services/prizePoolService.js'
import { retainLatestFive, validateScore } from '../src/services/scoreService.js'

test('score validation enforces Stableford range and one score per date', () => {
  const existing = [{ id: 'score-a', score: 28, scoreDate: '2026-09-01' }]
  assert.match(validateScore({ score: 0, scoreDate: '2026-09-02' }, existing), /1 to 45/)
  assert.match(validateScore({ score: 46, scoreDate: '2026-09-02' }, existing), /1 to 45/)
  assert.match(validateScore({ score: 32, scoreDate: '2026-09-01' }, existing), /already have a score/)
  assert.equal(validateScore({ score: 32, scoreDate: '2026-09-01' }, existing, 'score-a'), null)
})

test('the rolling record keeps only the latest five scores', () => {
  const scores = ['01', '02', '03', '04', '05', '06'].map((day, index) => ({ id: String(index), score: 20 + index, scoreDate: `2026-09-${day}` }))
  const retained = retainLatestFive(scores)
  assert.equal(retained.length, 5)
  assert.deepEqual(retained.map((score) => score.scoreDate), ['2026-09-06', '2026-09-05', '2026-09-04', '2026-09-03', '2026-09-02'])
})

test('prize tiers split correctly and only the five-match jackpot rolls forward', () => {
  const pools = calculatePrizePools(100, { five: 0, four: 2, three: 1 }, 20)
  assert.deepEqual(pools.five, { pool: 60, winners: 0, each: 0, rollsOver: true })
  assert.deepEqual(pools.four, { pool: 35, winners: 2, each: 17.5, rollsOver: false })
  assert.deepEqual(pools.three, { pool: 25, winners: 1, each: 25, rollsOver: false })
})

test('draw numbers are unique values in the 1–45 range', () => {
  for (const mode of ['random', 'algorithmic']) {
    const numbers = generateDraw(mode, [{ score: 34 }, { score: 34 }, { score: 15 }])
    assert.equal(numbers.length, 5)
    assert.equal(new Set(numbers).size, 5)
    assert.ok(numbers.every((number) => number >= 1 && number <= 45))
  }
})

test('only active members with five scores receive an entry', () => {
  const users = [{ id: 'active' }, { id: 'inactive' }]
  const subscriptions = [{ userId: 'active', status: 'active' }, { userId: 'inactive', status: 'cancelled' }]
  const scores = [1, 2, 3, 4, 5].map((score) => ({ userId: 'active', score, scoreDate: `2026-09-0${score}` }))
  assert.deepEqual(buildEntries(users, subscriptions, scores), [{ userId: 'active', numbers: [5, 4, 3, 2, 1] }])
})
