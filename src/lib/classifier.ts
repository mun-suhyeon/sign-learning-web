import { JAMO, JAMO_BY_ID } from '../data/jamo'
import {
  DIRECTION_LABEL,
  FINGER_LABEL,
  extractFeatures,
  toVector,
  vectorDistance,
  type Direction,
  type FingerName,
  type HandFrame,
} from './handFeatures'
import type { SampleStore } from './storage'

export interface HandRule {
  fingers?: Partial<Record<FingerName, 'ext' | 'fold'>>
  point?: { finger: FingerName; dir: Direction }
  touch?: boolean
}

export interface Check {
  ok: boolean
  /** 틀렸을 때 보여 줄 교정 안내 */
  hint: string
}

export type Source = 'samples' | 'rule' | 'none'

export interface Evaluation {
  source: Source
  /** 0~1 */
  score: number
  pass: boolean
  checks: Check[]
}

/** 사람이 읽는 규칙 설명 (학습 카드용) */
export function describeRule(rule: HandRule): string[] {
  const lines: string[] = []
  const ext = Object.entries(rule.fingers ?? {}).filter(([, v]) => v === 'ext').map(([k]) => FINGER_LABEL[k as FingerName])
  const fold = Object.entries(rule.fingers ?? {}).filter(([, v]) => v === 'fold').map(([k]) => FINGER_LABEL[k as FingerName])
  if (ext.length) lines.push(`${ext.join('·')} 펴기`)
  if (fold.length) lines.push(`${fold.join('·')} 접기`)
  if (rule.point) lines.push(`${FINGER_LABEL[rule.point.finger]} 끝이 ${DIRECTION_LABEL[rule.point.dir]}쪽을 향함`)
  if (rule.touch) lines.push('엄지 끝과 검지 끝을 맞닿게')
  return lines
}

export function evaluateRule(rule: HandRule, hand: HandFrame): Evaluation {
  const f = extractFeatures(hand)
  const checks: Check[] = []
  for (const [finger, want] of Object.entries(rule.fingers ?? {}) as [FingerName, 'ext' | 'fold'][]) {
    const ok = f.extended[finger] === (want === 'ext')
    checks.push({ ok, hint: `${FINGER_LABEL[finger]}를 ${want === 'ext' ? '펴세요' : '접으세요'}` })
  }
  if (rule.point) {
    const { finger, dir } = rule.point
    checks.push({
      ok: f.direction[finger] === dir,
      hint: `${FINGER_LABEL[finger]} 끝이 ${DIRECTION_LABEL[dir]}쪽을 향하게 하세요`,
    })
  }
  if (rule.touch) checks.push({ ok: f.thumbIndexTouch, hint: '엄지 끝과 검지 끝을 맞닿게 하세요' })

  const passed = checks.filter((c) => c.ok).length
  const score = checks.length ? passed / checks.length : 0
  return { source: 'rule', score, pass: score === 1, checks }
}

/**
 * 민감도(0~1)를 '샘플과의 허용 거리'로 바꾼다.
 * 값이 클수록 관대하게 판정한다. 실제 카메라 환경에서 조정할 수 있도록 설정에 노출한다.
 */
export function thresholdFromSensitivity(sensitivity: number): number {
  return 0.15 + sensitivity * 0.35
}

/** 각 글자별로 가장 가까운 샘플 3개의 평균 거리 */
function nearestDistances(vec: number[], samples: SampleStore): Map<string, number> {
  const result = new Map<string, number>()
  for (const [id, list] of Object.entries(samples)) {
    if (!list.length) continue
    const ds = list.map((s) => vectorDistance(vec, s)).sort((a, b) => a - b).slice(0, 3)
    result.set(id, ds.reduce((a, b) => a + b, 0) / ds.length)
  }
  return result
}

export function evaluate(targetId: string, hand: HandFrame, samples: SampleStore, sensitivity: number): Evaluation {
  if (samples[targetId]?.length) {
    const dists = nearestDistances(toVector(hand), samples)
    const target = dists.get(targetId)!
    const threshold = thresholdFromSensitivity(sensitivity)
    const closest = Math.min(...dists.values())
    const isNearest = target <= closest + 1e-9
    const score = Math.max(0, Math.min(1, 1 - (target - threshold) / threshold))
    const pass = isNearest && target <= threshold
    const checks: Check[] = [
      { ok: target <= threshold, hint: '등록한 기준 동작과 손 모양을 더 비슷하게 맞춰 보세요' },
      { ok: isNearest, hint: '다른 글자와 더 비슷하게 인식되고 있어요' },
    ]
    return { source: 'samples', score, pass, checks }
  }
  const rule = JAMO_BY_ID.get(targetId)?.rule
  if (rule) return evaluateRule(rule, hand)
  return { source: 'none', score: 0, pass: false, checks: [] }
}

/** 현재 손 모양이 어떤 글자로 보이는지 (등록 샘플 우선, 없으면 규칙 완전 일치) */
export function recognize(hand: HandFrame, samples: SampleStore, sensitivity: number): string | null {
  const dists = nearestDistances(toVector(hand), samples)
  const threshold = thresholdFromSensitivity(sensitivity)
  let best: string | null = null
  let bestD = Infinity
  for (const [id, d] of dists) {
    if (d < bestD) {
      best = id
      bestD = d
    }
  }
  if (best && bestD <= threshold) return best
  for (const j of JAMO) {
    if (j.rule && !samples[j.id]?.length && evaluateRule(j.rule, hand).pass) return j.id
  }
  return null
}

export function sourceFor(id: string, samples: SampleStore): Source {
  if (samples[id]?.length) return 'samples'
  if (JAMO_BY_ID.get(id)?.rule) return 'rule'
  return 'none'
}
