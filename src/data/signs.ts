/**
 * 표현(단어) 데이터 — CLAUDE.md §10 스키마.
 *
 * 기준 영상: 공유마당(한국저작권위원회) CC BY 영상. 제작자가 출처와 라이선스를 직접 확인했다.
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

/** 기준 영상의 출처와 라이선스 (CC BY 저작자 표시용) */
export interface SourceRef {
  /** 출처 사이트 */
  site: string
  /** 원 저작물 제목 */
  title: string
  /** 저작자 */
  author: string
  license: string
  /** 원 저작물 페이지 */
  url: string
  /** 공유마당 저작물 번호 (추적용) */
  wrtSn: string
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
  /** 포스터 이미지가 아직 없으면 생략 */
  poster?: string
  durationSec: number
  /** 1~2개 */
  points: SignPoint[]
  nonManualRequired: boolean
  source: SourceRef
  /** 한국수어사전과 대조한 경우에만 */
  dictionary?: DictionaryRef
  /**
   * draft: 준비 중 (개발 모드에서만 노출)
   * source-verified: 영상 파일과 출처·라이선스 확인 완료
   * dictionary-checked: 한국수어사전과 대조 완료
   */
  status: 'draft' | 'source-verified' | 'dictionary-checked'
}

export const CATEGORY: { id: string; title: string } = {
  id: 'daily-expression',
  title: '일상 표현',
}

/** 공유마당 한국저작권위원회 CC BY 영상 (각 다운로드에 포함된 출처 안내 기준) */
const gongu = (title: string, wrtSn: string): SourceRef => ({
  site: '공유마당',
  title,
  author: '한국저작권위원회',
  license: 'CC BY',
  url: `https://gongu.copyright.or.kr/gongu/wrt/wrt/view.do?menuNo=200026&wrtSn=${wrtSn}`,
  wrtSn,
})

/** 비교 포인트와 비수지 여부는 제작자가 확정하기 전까지 TODO로 둔다 */
const todoPoints = (): SignPoint[] => [
  { aspect: null, text: TODO },
  { aspect: null, text: TODO },
]

const item = (
  order: number,
  id: string,
  meaning: string,
  durationSec: number,
  source: SourceRef,
): SignItem => ({
  id,
  meaning,
  order,
  video: `signs/${String(order).padStart(2, '0')}-${id}.mp4`,
  durationSec,
  points: todoPoints(),
  nonManualRequired: false, // TODO(제작자 입력)
  source,
  status: 'source-verified',
})

/**
 * 로컬 표현 풀. 학습 세션마다 이 중 4개를 고른다(src/lib/session.ts).
 * 제작자가 확인한 항목만 한 줄씩 추가한다 — 화면 코드는 바꾸지 않아도 된다.
 * durationSec: public/signs/ 영상의 실제 길이 (초)
 */
export const SIGNS: SignItem[] = [
  item(1, 'thanks', '감사합니다', 2.133, gongu('일상생활_수어_기타_감사합니다,감사,고맙다', '13308979')),
  item(2, 'welcome', '어서 오세요', 2.033, gongu('일상생활_수어_사회생활_안내,어서 들어오세요,어서 오세요', '13307725')),
  item(3, 'how-many', '얼마 / 몇', 2.033, gongu('일상생활_수어_개념_얼마,몇,개수', '13308748')),
  item(4, 'place', '장소 / 위치', 1.933, gongu('일상생활_수어_개념_곳,위치,장소,터', '13308552')),
  item(5, 'document', '서류 / 문서', 2.833, gongu('일상생활_수어_사회생활_서류,문서', '13307693')),
  item(6, 'reality', '실제 / 현실', 2.433, gongu('일상생활_수어_기타_실제,실정,실태,현실', '13309821')),
  item(7, 'saturday', '토요일', 1.933, gongu('일상생활_수어_개념_토요일', '13308841')),
  item(8, 'blue', '파란색', 2.533, gongu('일상생활_수어_개념_파란색,파랑,청,청색', '13308842')),
]

/**
 * 화면에 노출할 표현 = 세션 추첨 대상 풀.
 * 배포 빌드에는 확인을 마친 항목(draft가 아닌 것)만, 개발 모드에서는 draft도 노출한다(CLAUDE.md §8).
 */
export const VISIBLE_SIGNS: SignItem[] = import.meta.env.DEV
  ? SIGNS
  : SIGNS.filter((s) => s.status !== 'draft')

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
