import { useSyncExternalStore } from 'react'
import { VISIBLE_SIGNS, type SignItem } from '../data/signs'

/**
 * 현재 학습 세션의 표현 4개.
 * 로컬 표현 풀(VISIBLE_SIGNS)을 Fisher–Yates로 섞어 앞에서 4개를 고른다.
 * 추천 알고리즘이 아니다 — 진행 상태나 학습 이력으로 가중치를 두지 않는다.
 * localStorage 키: ksl.v2.session = { ids: string[] }
 * 진행 상태(ksl.v2.progress.*)는 표현 id 기준이며 여기서 건드리지 않는다.
 */
export const SESSION_SIZE = 4

const KEY = 'ksl.v2.session'

export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = items.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** 순서와 상관없이 같은 표현 조합인지 */
const sameSet = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id) => b.includes(id))

/**
 * 풀에서 중복 없이 최대 4개를 고른다.
 * 풀이 4개보다 크면 previous와 완전히 같은 조합은 다시 뽑는다.
 */
export function pickSet(
  poolIds: readonly string[],
  previous: readonly string[] = [],
  random: () => number = Math.random,
): string[] {
  const unique = [...new Set(poolIds)]
  const size = Math.min(SESSION_SIZE, unique.length)
  const canDiffer = unique.length > SESSION_SIZE
  let next = shuffle(unique, random).slice(0, size)
  while (canDiffer && sameSet(next, previous)) next = shuffle(unique, random).slice(0, size)
  return next
}

/** 저장된 세트가 현재 풀과 맞는지: 개수, 중복 없음, 모두 풀 안의 id */
export function isValidSet(ids: unknown, poolIds: readonly string[]): ids is string[] {
  if (!Array.isArray(ids)) return false
  if (ids.length !== Math.min(SESSION_SIZE, new Set(poolIds).size)) return false
  if (new Set(ids).size !== ids.length) return false
  return ids.every((id) => typeof id === 'string' && poolIds.includes(id))
}

const POOL_IDS = VISIBLE_SIGNS.map((s) => s.id)

/** 풀이 5개 이상일 때만 새 조합을 만들 수 있다 */
export const canNewSet = POOL_IDS.length > SESSION_SIZE

/** 저장소 접근이 막혀도 앱이 동작하도록 메모리 사본을 기준으로 쓴다 */
let current: string[] = load()
const listeners = new Set<() => void>()

function load(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as { ids?: unknown } | null
    if (isValidSet(parsed?.ids, POOL_IDS)) return parsed.ids
  } catch {
    // 읽기 실패 시 새로 뽑는다
  }
  const fresh = pickSet(POOL_IDS)
  save(fresh)
  return fresh
}

function save(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ids }))
  } catch {
    // 쓰기 실패 시 메모리 사본만 유지
  }
}

/** 새로운 4개. 현재 세션 선택만 바꾸고 진행 상태는 그대로 둔다 */
export function newSet() {
  if (!canNewSet) return
  current = pickSet(POOL_IDS, current)
  save(current)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** 현재 세션의 표현들 (세션 안의 순서대로) */
export function useSessionSigns(): SignItem[] {
  const ids = useSyncExternalStore(subscribe, () => current)
  return ids.map((id) => VISIBLE_SIGNS.find((s) => s.id === id)).filter((s): s is SignItem => !!s)
}
