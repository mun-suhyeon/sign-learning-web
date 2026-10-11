import { useRef, useState } from 'react'
import { Arrow } from '../components/Arrow'
import { ReferenceVideo } from '../components/VideoFrame'
import type { SignItem } from '../data/signs'
import type { Recording } from '../lib/recorder'

interface Props {
  sign: SignItem
  recording: Recording
  onRetry: () => void
  onNext: () => void
}

/** 내 녹화가 기준 영상보다 이만큼 이상 어긋나면 다시 맞춘다 (초) */
const DRIFT_SEC = 0.15

/**
 * 03 COMPARE — 기준 영상과 내 녹화를 함께 재생하고 스스로 비교한다.
 * 점수·정답 판정·자동 분석은 하지 않는다 (CLAUDE.md §5).
 * 오른쪽은 실시간 웹캠이 아니라 방금 녹화한 영상이다.
 */
export function CompareStep({ sign, recording, onRetry, onNext }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null)
  const myVideo = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState<1 | 0.5>(1)

  const both = () => [refVideo.current, myVideo.current].filter((v): v is HTMLVideoElement => !!v)
  const refReady = () => !!refVideo.current && refVideo.current.readyState > 0

  const playBoth = () => {
    const ref = refVideo.current
    const mine = myVideo.current
    if (!mine) return
    // 끝까지 재생했으면 처음부터
    if (mine.ended || mine.currentTime >= recording.durationSec - 0.05) {
      both().forEach((v) => (v.currentTime = 0))
    } else if (ref && refReady()) {
      ref.currentTime = Math.min(mine.currentTime, ref.duration || mine.currentTime)
    }
    both().forEach((v) => {
      v.playbackRate = rate
      if (v === ref && !refReady()) return
      v.play().catch(() => {})
    })
    setPlaying(true)
  }

  const pauseBoth = () => {
    both().forEach((v) => v.pause())
    setPlaying(false)
  }

  const restartBoth = () => {
    both().forEach((v) => {
      v.pause()
      v.currentTime = 0
    })
    playBoth()
  }

  const toggleRate = () => {
    const next = rate === 1 ? 0.5 : 1
    setRate(next)
    both().forEach((v) => (v.playbackRate = next))
  }

  // 비교 화면에 들어오면 두 영상이 모두 준비되는 대로 함께 처음부터 한 번 재생
  const autoStarted = useRef(false)
  const tryAutoStart = () => {
    const ref = refVideo.current
    const mine = myVideo.current
    if (autoStarted.current || !mine || mine.readyState < 2) return
    if (ref && ref.readyState < 2) return
    autoStarted.current = true
    restartBoth()
  }
  const onRefReady = (ref: HTMLVideoElement) => {
    if (ref.readyState >= 2) tryAutoStart()
    else ref.addEventListener('loadeddata', tryAutoStart, { once: true })
  }

  // 내 녹화를 기준으로 두 영상 시점을 맞춘다. 녹화는 기준 영상보다 약 0.5초 길다.
  const onMyTime = () => {
    const ref = refVideo.current
    const mine = myVideo.current
    if (!ref || !mine || !refReady() || ref.ended || ref.paused) return
    if (mine.currentTime < (ref.duration || 0) && Math.abs(ref.currentTime - mine.currentTime) > DRIFT_SEC) {
      ref.currentTime = mine.currentTime
    }
  }

  return (
    <div className="stage stage-pair">
      <h2 className="sr-only" tabIndex={-1}>
        03 비교: 기준 영상과 내 녹화를 나란히 보기
      </h2>

      <div className="pair">
        <section className="pane" aria-label="기준 영상">
          <div className="stage-labels label">
            <span>REFERENCE</span>
          </div>
          <ReferenceVideo sign={sign} videoRef={refVideo} loop={false} onReady={onRefReady} />
        </section>

        <section className="pane" aria-label="내 녹화 (거울 화면)">
          <div className="stage-labels label">
            <span>MY RECORDING</span>
            <span>MIRRORED</span>
          </div>
          <div className="video-box webcam">
            {/* 내 녹화 재생도 거울 상태 고정 (CLAUDE.md §11). 녹화본은 메모리의 Blob URL */}
            <video
              ref={myVideo}
              className="mirrored is-live"
              src={recording.url}
              muted
              playsInline
              preload="auto"
              aria-label="내 녹화 영상"
              onLoadedData={tryAutoStart}
              onTimeUpdate={onMyTime}
              onEnded={() => {
                refVideo.current?.pause()
                setPlaying(false)
              }}
            />
          </div>
        </section>
      </div>

      <div className="compare-controls">
        <button type="button" className="text-button label" onClick={restartBoth}>
          <RestartIcon />
          RESTART BOTH
        </button>
        <button type="button" className="text-button label" onClick={playing ? pauseBoth : playBoth}>
          {playing ? <PauseIcon /> : <PlayIcon />}
          {playing ? 'PAUSE' : 'PLAY'}
        </button>
        <button
          type="button"
          className="text-button label"
          onClick={toggleRate}
          aria-label={`재생 속도 ${rate === 1 ? '1.0' : '0.5'}배, 눌러서 ${rate === 1 ? '0.5' : '1.0'}배로 바꾸기`}
        >
          {rate === 1 ? '1.0' : '0.5'}× SPEED
        </button>
        <span className="compare-controls-rule" aria-hidden="true" />
      </div>

      <div className="action-bar compare-bar">
        {/* 비교 포인트가 확정되기 전까지는 판정처럼 보이는 체크 없이 두 가지 선택만 둔다 */}
        <p className="action-help">두 영상을 나란히 비교한 뒤, 다시 연습하거나 다음 표현으로 넘어가세요.</p>
        <div className="action-ctas">
          {/* 같은 표현의 PRACTICE로 돌아간다. 익힘으로 표시하지 않는다 */}
          <button type="button" className="cta cta-secondary action-cta" onClick={onRetry}>
            다시 연습
            <RestartIcon />
          </button>
          <button type="button" className="cta action-cta" onClick={onNext}>
            다음 표현
            <Arrow />
          </button>
        </div>
      </div>
    </div>
  )
}

function RestartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <path d="M3 8a5 5 0 1 0 1.6-3.7" />
      <path d="M3 2v3.2h3.2" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      <path d="M3 1h2v12H3zM9 1h2v12H9z" fill="currentColor" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 1.5v13l11-6.5z" fill="currentColor" />
    </svg>
  )
}
