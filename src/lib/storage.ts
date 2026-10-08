import { useSyncExternalStore } from 'react'

/** 글자 id → 정규화된 손 벡터 목록 */
export type SampleStore = Record<string, number[][]>

export interface ItemProgress {
  /** 라이트너 상자 0~5. 3 이상이면 익힌 것으로 본다. */
  box: number
  correct: number
  attempts: number
  last: number
}
export type ProgressStore = Record<string, ItemProgress>

export interface Settings {
  sensitivity: number
}

export const MASTERED_BOX = 3
const MAX_BOX = 5

/** localStorage에 저장되고 컴포넌트끼리 구독할 수 있는 작은 저장소 */
function createStore<T>(key: string, initial: T) {
  let value: T = initial
  try {
    const raw = localStorage.getItem(key)
    if (raw) value = { ...initial, ...JSON.parse(raw) }
  } catch {
    // 저장소 접근 불가 시 기본값 사용
  }
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set(next: T) {
      value = next
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // 용량 초과 등은 메모리 값만 유지
      }
      listeners.forEach((l) => l())
    },
    subscribe(l: () => void) {
      listeners.add(l)
      return () => listeners.delete(l)
    },
  }
}

export const samplesStore = createStore<SampleStore>('ksl.samples.v1', {})
export const progressStore = createStore<ProgressStore>('ksl.progress.v1', {})
export const settingsStore = createStore<Settings>('ksl.settings.v1', { sensitivity: 0.5 })

export function useStore<T>(store: { get: () => T; subscribe: (l: () => void) => () => void }): T {
  return useSyncExternalStore(store.subscribe, store.get)
}

export function recordAttempt(id: string, correct: boolean) {
  const all = progressStore.get()
  const prev = all[id] ?? { box: 0, correct: 0, attempts: 0, last: 0 }
  progressStore.set({
    ...all,
    [id]: {
      box: correct ? Math.min(MAX_BOX, prev.box + 1) : Math.max(0, prev.box - 1),
      correct: prev.correct + (correct ? 1 : 0),
      attempts: prev.attempts + 1,
      last: Date.now(),
    },
  })
}

export function setMastered(id: string, mastered: boolean) {
  const all = progressStore.get()
  const prev = all[id] ?? { box: 0, correct: 0, attempts: 0, last: 0 }
  progressStore.set({ ...all, [id]: { ...prev, box: mastered ? MASTERED_BOX : 0, last: Date.now() } })
}

export function addSamples(id: string, vectors: number[][]) {
  const all = samplesStore.get()
  samplesStore.set({ ...all, [id]: [...(all[id] ?? []), ...vectors] })
}

export function clearSamples(id: string) {
  const all = { ...samplesStore.get() }
  delete all[id]
  samplesStore.set(all)
}
