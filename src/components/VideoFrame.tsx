import { useState, type ReactNode, type Ref } from 'react'
import { assetUrl, formatTime, pad2, type SignItem } from '../data/signs'

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
 * 학습 화면(dark)에서는 표현 번호·길이가 이미 제목과 재생 막대에 있으므로 반복하지 않는다.
 */
export function ReferencePlaceholder({ refNo, durationSec, tone }: Props) {
  return (
    <div className={`frame frame-${tone} frame-placeholder`} aria-hidden="true">
      <span className="frame-cross" />
      {tone === 'light' && <span className="frame-label frame-ref">REF / {pad2(refNo)}</span>}
      <span className="frame-center">
        <span className="frame-plus">+</span>
        <span className="frame-label">REFERENCE VIDEO</span>
      </span>
      {tone === 'light' && <span className="frame-label frame-time">00:00 — {formatTime(durationSec)}</span>}
    </div>
  )
}

interface ReferenceVideoProps {
  sign: SignItem
  videoRef: Ref<HTMLVideoElement>
  /** 영상 메타데이터를 읽어 재생할 수 있게 되면 호출 */
  onReady?: (video: HTMLVideoElement) => void
  onPlayingChange?: (playing: boolean) => void
  onTime?: (sec: number) => void
  onEnded?: () => void
  /** WATCH에서는 반복 재생, PRACTICE·COMPARE에서는 한 번만 */
  loop?: boolean
  /** 영상 위에 겹칠 요소 (재생 버튼 등) */
  children?: ReactNode
}

/**
 * 기준 영상(참고 시연).
 * 촬영된 방향 그대로 보여 준다 — 어떤 경우에도 좌우반전하지 않는다(CLAUDE.md §7.2, §11).
 * 영상 파일이 아직 없거나 읽을 수 없으면 디자인의 자리 표시를 그대로 보여 준다.
 */
export function ReferenceVideo({
  sign,
  videoRef,
  onReady,
  onPlayingChange,
  onTime,
  onEnded,
  loop = true,
  children,
}: ReferenceVideoProps) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  return (
    <div className="video-box reference-video">
      {!failed && (
        <video
          ref={videoRef}
          className={ready ? 'is-ready' : undefined}
          src={assetUrl(sign.video)}
          poster={assetUrl(sign.poster)}
          preload="auto"
          muted
          playsInline
          loop={loop}
          aria-label={`참고 시연 영상, 표현 ${pad2(sign.order)}`}
          onLoadedMetadata={(e) => {
            setReady(true)
            onReady?.(e.currentTarget)
          }}
          onPlay={() => onPlayingChange?.(true)}
          onPause={() => onPlayingChange?.(false)}
          onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime)}
          onEnded={onEnded}
          onError={() => setFailed(true)}
        />
      )}
      {!ready && <ReferencePlaceholder refNo={sign.order} durationSec={sign.durationSec} tone="dark" />}
      {children}
    </div>
  )
}
