import { useSyncExternalStore } from 'react'

/**
 * 표현별 가벼운 진행 상태 (CLAUDE.md §12).
 * localStorage 키: ksl.v2.progress.<id>
 * 녹화 영상은 절대 여기에 저장하지 않는다(CLAUDE.md §6).
 */
export interface Progress {
  learned: boolean
  /** 마지막으로 학습 화면을 연 시각 (ms). 0 = 아직 열지 않음 */
  lastSeen: number
}

export type ProgressStatus = 'done' | 'in-progress' | 'not-started'

const PREFIX = 'ksl.v2.progress.'
const EMPTY: Progress = { learned: false, lastSeen: 0 }

/** 저장소 접근이 막혀도(사생활 보호 모드 등) 앱이 동작하도록 메모리 사본을 기준으로 쓴다 */
let snapshot: Record<string, Progress> = load()
const listeners = new Set<() => void>()

function load(): Record<string, Progress> {
  const out: Record<string, Progress> = {}
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(PREFIX)) continue
      const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as Partial<Progress> | null
      if (!parsed) continue
      out[key.slice(PREFIX.length)] = {
        learned: parsed.learned === true,
        lastSeen: typeof parsed.lastSeen === 'number' ? parsed.lastSeen : 0,
      }
    }
  } catch {
    // 읽기 실패 시 빈 상태로 시작
  }
  return out
}

function write(id: string, next: Progress) {
  snapshot = { ...snapshot, [id]: next }
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify(next))
  } catch {
    // 쓰기 실패 시 메모리 사본만 유지
  }
  listeners.forEach((l) => l())
}

export function getProgress(all: Record<string, Progress>, id: string): Progress {
  return all[id] ?? EMPTY
}

export function markSeen(id: string) {
  write(id, { ...getProgress(snapshot, id), lastSeen: Date.now() })
}

export function setLearned(id: string, learned: boolean) {
  write(id, { ...getProgress(snapshot, id), learned, lastSeen: Date.now() })
}

export function statusOf(p: Progress): ProgressStatus {
  if (p.learned) return 'done'
  return p.lastSeen > 0 ? 'in-progress' : 'not-started'
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

/** 전체 진행 상태를 구독한다. 개별 값은 getProgress(all, id)로 읽는다. */
export function useProgress(): Record<string, Progress> {
  return useSyncExternalStore(subscribe, () => snapshot)
}
