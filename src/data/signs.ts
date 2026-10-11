/**
 * 표현(단어) 데이터 — CLAUDE.md §10 스키마.
 *
 * 표현 4개와 사전 항목은 제작자가 확정했다(CLAUDE.md §8, §21).
 * 비교 포인트와 비수지 여부는 아직 확정 전이므로 TODO 플레이스홀더로 둔다.
 * 수어 동작·비교 포인트를 추측해서 채우지 않는다.
 */

export const TODO = 'TODO(제작자 입력)'

export type Aspect = 'handshape' | 'location' | 'movement' | 'orientation' | 'nonManual'

export interface SignPoint {
  /** null = 아직 제작자가 요소를 정하지 않음 (TODO) */
  aspect: Aspect | null
  /** 제작자가 사전과 대조해 직접 쓴 문구 */
  text: string
}

export interface DictionaryRef {
  /** 사전 표제어 */
  headword: string
  /** 표시용 검색 링크 (표제어 확정 후 생성) */
  searchUrl: string
  /** 추적용 항목 번호 */
  originNo: string
  /** 사전 분류 코드 */
  topCategory: string
  /** YYYY-MM-DD, 대조한 날짜 */
  checkedAt: string
}

export interface SignItem {
  /** 표현 식별자. 영상·포스터 파일명은 video/poster 경로를 따른다 */
  id: string
  /** 한국어 뜻 (표시용) */
  meaning: string
  /** 풀 안에서의 순서. 화면의 표현 번호는 세션 안의 위치를 쓴다 */
  order: number
  /** BASE_URL 기준 상대 경로 */
  video: string
  poster: string
  durationSec: number
  /** 1~2개 */
  points: SignPoint[]
  nonManualRequired: boolean
  dictionary: DictionaryRef
  status: 'draft' | 'dictionary-checked'
}

export const CATEGORY: { id: string; title: string } = {
  id: 'daily-expression',
  title: '일상 표현',
}

const DICTIONARY_SEARCH = 'https://sldict.korean.go.kr/front/search/searchAllList.do?searchKeyword='

const dictionaryRef = (headword: string, originNo: string): DictionaryRef => ({
  headword,
  searchUrl: `${DICTIONARY_SEARCH}${encodeURIComponent(headword)}`,
  originNo,
  topCategory: 'CTE',
  checkedAt: '2026-10-12',
})

/** 비교 포인트와 비수지 여부는 제작자가 확정하기 전까지 TODO로 둔다 */
const todoPoints = (): SignPoint[] => [
  { aspect: null, text: TODO },
  { aspect: null, text: TODO },
]

/**
 * 로컬 표현 풀. 학습 세션마다 이 중 4개를 고른다(src/lib/session.ts).
 * 제작자가 확인한 항목만 추가한다 — 화면 코드는 바꾸지 않아도 된다.
 */
export const SIGNS: SignItem[] = [
  {
    id: 'hello',
    meaning: '안녕하세요',
    order: 1,
    video: 'signs/01-hello.mp4',
    poster: 'signs/01-hello.webp',
    durationSec: 0, // TODO(제작자 입력): 영상 삽입 후 실제 길이
    points: todoPoints(),
    nonManualRequired: false, // TODO(제작자 입력)
    dictionary: dictionaryRef('안녕하세요', '3331'),
    status: 'draft',
  },
  {
    id: 'thanks',
    meaning: '감사합니다',
    order: 2,
    video: 'signs/02-thanks.mp4',
    poster: 'signs/02-thanks.webp',
    durationSec: 0, // TODO(제작자 입력): 영상 삽입 후 실제 길이
    points: todoPoints(),
    nonManualRequired: false, // TODO(제작자 입력)
    dictionary: dictionaryRef('감사합니다', '2372'),
    status: 'draft',
  },
  {
    id: 'sorry',
    meaning: '미안합니다',
    order: 3,
    video: 'signs/03-sorry.mp4',
    poster: 'signs/03-sorry.webp',
    durationSec: 0, // TODO(제작자 입력): 영상 삽입 후 실제 길이
    points: todoPoints(),
    nonManualRequired: false, // TODO(제작자 입력)
    dictionary: dictionaryRef('미안합니다', '9917'),
    status: 'draft',
  },
  {
    id: 'okay',
    meaning: '괜찮아요',
    order: 4,
    video: 'signs/04-okay.mp4',
    poster: 'signs/04-okay.webp',
    durationSec: 0, // TODO(제작자 입력): 영상 삽입 후 실제 길이
    points: todoPoints(),
    nonManualRequired: false, // TODO(제작자 입력)
    dictionary: dictionaryRef('괜찮아요', '9466'),
    status: 'draft',
  },
]

/**
 * 화면에 노출할 표현 = 세션 추첨 대상 풀.
 * 배포 빌드에는 dictionary-checked 항목만, 개발 모드에서는 draft도 노출한다(CLAUDE.md §8).
 */
export const VISIBLE_SIGNS: SignItem[] = import.meta.env.DEV
  ? SIGNS
  : SIGNS.filter((s) => s.status === 'dictionary-checked')

export const isTodo = (value: string) => value === TODO

/** public/ 아래 에셋 경로를 GitHub Pages 하위 경로 기준 URL로 바꾼다 */
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`

/** 1 → "01" */
export const pad2 = (n: number) => String(n).padStart(2, '0')

/** 초 → "00:07". 길이를 모르면(0) "--:--" */
export function formatTime(sec: number): string {
  if (!sec) return '--:--'
  const s = Math.round(sec)
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}
