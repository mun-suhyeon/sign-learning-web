import { pad2 } from '../data/signs'

/** 초 → "00:07". 길이를 모르면(0) "--:--" */
export function formatTime(sec: number): string {
  if (!sec) return '--:--'
  const s = Math.round(sec)
  return `${pad2(Math.floor(s / 60))}:${pad2(s % 60)}`
}

interface Props {
  /** REF / 01 */
  refNo: number
  durationSec: number
  /** light = 홈 카드, dark = 학습 화면 */
  tone: 'light' | 'dark'
}

/**
 * 기준 영상 자리 표시 (십자선 + REFERENCE VIDEO).
 * 실제 촬영 영상이 준비되기 전까지 쓰며, 다른 수어 영상으로 대체하지 않는다(CLAUDE.md §7.5).
 */
export function ReferencePlaceholder({ refNo, durationSec, tone }: Props) {
  return (
    <div className={`frame frame-${tone}`} aria-hidden="true">
      <span className="frame-cross" />
      <span className="frame-label frame-ref">REF / {pad2(refNo)}</span>
      <span className="frame-center">
        <span className="frame-plus">+</span>
        <span className="frame-label">REFERENCE VIDEO</span>
      </span>
      <span className="frame-label frame-time">00:00 — {formatTime(durationSec)}</span>
    </div>
  )
}
