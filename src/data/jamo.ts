import type { HandRule } from '../lib/classifier'

export type JamoKind = 'consonant' | 'vowel'

export interface Jamo {
  id: string
  char: string
  kind: JamoKind
  name: string
  /**
   * 자동 채점용 임시 규칙. 한국수어 전문가 검수 전이므로 정답 기준이 아니다.
   * 규칙이 없는 글자는 '기준 동작 등록'에서 직접 샘플을 녹화해야 채점된다.
   */
  rule?: HandRule
}

export const JAMO: Jamo[] = [
  {
    id: 'g', char: 'ㄱ', kind: 'consonant', name: '기역',
    rule: { fingers: { thumb: 'ext', index: 'ext', middle: 'fold', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'down' } },
  },
  {
    id: 'n', char: 'ㄴ', kind: 'consonant', name: '니은',
    rule: { fingers: { thumb: 'ext', index: 'ext', middle: 'fold', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'up' } },
  },
  {
    id: 'd', char: 'ㄷ', kind: 'consonant', name: '디귿',
    rule: { fingers: { index: 'ext', middle: 'ext', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'side' } },
  },
  {
    id: 'r', char: 'ㄹ', kind: 'consonant', name: '리을',
    rule: { fingers: { index: 'ext', middle: 'ext', ring: 'ext', pinky: 'fold' }, point: { finger: 'index', dir: 'side' } },
  },
  { id: 'm', char: 'ㅁ', kind: 'consonant', name: '미음' },
  {
    id: 'b', char: 'ㅂ', kind: 'consonant', name: '비읍',
    rule: { fingers: { thumb: 'fold', index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext' }, point: { finger: 'middle', dir: 'up' } },
  },
  {
    id: 's', char: 'ㅅ', kind: 'consonant', name: '시옷',
    rule: { fingers: { thumb: 'fold', index: 'ext', middle: 'ext', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'down' } },
  },
  {
    id: 'ng', char: 'ㅇ', kind: 'consonant', name: '이응',
    rule: { touch: true, fingers: { index: 'fold' } },
  },
  {
    id: 'j', char: 'ㅈ', kind: 'consonant', name: '지읒',
    rule: { fingers: { thumb: 'ext', index: 'ext', middle: 'ext', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'down' } },
  },
  { id: 'ch', char: 'ㅊ', kind: 'consonant', name: '치읓' },
  { id: 'k', char: 'ㅋ', kind: 'consonant', name: '키읔' },
  {
    id: 't', char: 'ㅌ', kind: 'consonant', name: '티읕',
    rule: { fingers: { thumb: 'ext', index: 'ext', middle: 'ext', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'side' } },
  },
  { id: 'p', char: 'ㅍ', kind: 'consonant', name: '피읖' },
  { id: 'h', char: 'ㅎ', kind: 'consonant', name: '히읗' },
  { id: 'a', char: 'ㅏ', kind: 'vowel', name: '아' },
  { id: 'ya', char: 'ㅑ', kind: 'vowel', name: '야' },
  { id: 'eo', char: 'ㅓ', kind: 'vowel', name: '어' },
  { id: 'yeo', char: 'ㅕ', kind: 'vowel', name: '여' },
  { id: 'o', char: 'ㅗ', kind: 'vowel', name: '오' },
  { id: 'yo', char: 'ㅛ', kind: 'vowel', name: '요' },
  { id: 'u', char: 'ㅜ', kind: 'vowel', name: '우' },
  { id: 'yu', char: 'ㅠ', kind: 'vowel', name: '유' },
  {
    id: 'eu', char: 'ㅡ', kind: 'vowel', name: '으',
    rule: { fingers: { index: 'ext', middle: 'fold', ring: 'fold', pinky: 'fold' }, point: { finger: 'index', dir: 'side' } },
  },
  {
    id: 'i', char: 'ㅣ', kind: 'vowel', name: '이',
    rule: { fingers: { index: 'fold', middle: 'fold', ring: 'fold', pinky: 'ext' }, point: { finger: 'pinky', dir: 'up' } },
  },
]

export const JAMO_BY_ID = new Map(JAMO.map((j) => [j.id, j]))
export const JAMO_BY_CHAR = new Map(JAMO.map((j) => [j.char, j]))

/** 국립국어원 한국수어사전 검색 링크 (공식 시연 영상 확인용) */
export function dictionaryUrl(keyword: string): string {
  return `https://sldict.korean.go.kr/front/search/searchAllList.do?searchKeyword=${encodeURIComponent(keyword)}`
}
