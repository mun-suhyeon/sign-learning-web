const CHO = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'
const JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']

/** '나무' → ['ㄴ','ㅏ','ㅁ','ㅜ'] */
export function decompose(word: string): string[] {
  const out: string[] = []
  for (const ch of word) {
    const code = ch.charCodeAt(0) - 0xac00
    if (code < 0 || code > 11171) {
      out.push(ch)
      continue
    }
    out.push(CHO[Math.floor(code / 588)], JUNG[Math.floor((code % 588) / 28)])
    const jong = JONG[code % 28]
    if (jong) out.push(jong)
  }
  return out
}
