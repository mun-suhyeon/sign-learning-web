/**
 * 표현(단어) 데이터 — CLAUDE.md §10 스키마.
 *
 * 실제 한국수어 콘텐츠는 아직 확정되지 않았다(CLAUDE.md §8, §21).
 * 제작자가 확정하기 전까지 수어 관련 값은 모두 TODO 플레이스홀더로 둔다.
 * 수어 동작·뜻·비교 포인트를 추측해서 채우지 않는다.
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
  /** 파일명과 동일 (확정 전: todo-1 ~ todo-4) */
  id: string
  /** 한국어 뜻 (표시용) */
  meaning: string
  /** 홈에서의 순서 (1~4) */
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
  id: 'todo-category',
  title: TODO,
}

function placeholder(order: number): SignItem {
  const id = `todo-${order}`
  return {
    id,
    meaning: TODO,
    order,
    video: `signs/${id}.mp4`,
    poster: `signs/${id}.webp`,
    durationSec: 0, // TODO(제작자 입력): 촬영 후 실제 길이
    points: [
      { aspect: null, text: TODO },
      { aspect: null, text: TODO },
    ],
    nonManualRequired: false, // TODO(제작자 입력)
    dictionary: {
      headword: TODO,
      searchUrl: '',
      originNo: TODO,
      topCategory: TODO,
      checkedAt: TODO,
    },
    status: 'draft',
  }
}

export const SIGNS: SignItem[] = [1, 2, 3, 4].map(placeholder)

/**
 * 화면에 노출할 표현.
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
