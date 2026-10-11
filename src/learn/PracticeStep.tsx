import { useEffect, useRef, useState } from 'react'
import { Arrow } from '../components/Arrow'
import { ReferenceVideo } from '../components/VideoFrame'
import type { SignItem } from '../data/signs'
import { CameraError, openCamera, stopStream } from '../lib/camera'
import { recordFor, type Recording, type RecordingSession } from '../lib/recorder'

/** 녹화 길이 = 기준 영상 길이 + 여유 (CLAUDE.md §4) */
const RECORD_PADDING_SEC = 0.5
const COUNTDOWN_FROM = 3

type Phase =
  | { kind: 'idle' }
  | { kind: 'starting' }
  | { kind: 'countdown'; n: number }
  | { kind: 'recording' }
  | { kind: 'error'; message: string }

interface Props {
  sign: SignItem
  onRecorded: (recording: Recording) => void
}

/** 02 PRACTICE — 기준 영상과 거울 웹캠을 나란히 두고 동시에 녹화 */
export function PracticeStep({ sign, onRecorded }: Props) {
  const refVideo = useRef<HTMLVideoElement>(null)
  const camVideo = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const sessionRef = useRef<RecordingSession | null>(null)
  const [refDuration, setRefDuration] = useState(0)
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [hasPreview, setHasPreview] = useState(false)

  // 화면을 떠나면 녹화를 버리고 카메라를 끈다
  useEffect(
    () => () => {
      sessionRef.current?.cancel()
      stopStream(streamRef.current)
      streamRef.current = null
    },
    [],
  )

  // 카운트다운 → 기준 영상 재생과 녹화를 같은 순간에 시작
  useEffect(() => {
    if (phase.kind !== 'countdown') return
    const t = window.setTimeout(() => {
      if (phase.n > 1) return setPhase({ kind: 'countdown', n: phase.n - 1 })
      const video = refVideo.current
      const stream = streamRef.current
      if (!video || !stream) return setPhase({ kind: 'idle' })

      video.pause()
      video.currentTime = 0
      video.playbackRate = 1
      const session = recordFor(stream, (refDuration + RECORD_PADDING_SEC) * 1000)
      video.play().catch(() => {})
      sessionRef.current = session
      setPhase({ kind: 'recording' })

      session.done
        .then((recording) => {
          sessionRef.current = null
          stopStream(streamRef.current)
          streamRef.current = null
          onRecorded(recording)
        })
        .catch(() => {
          // 화면을 떠나 취소된 경우 등: 결과 없음
        })
    }, 1000)
    return () => window.clearTimeout(t)
  }, [phase, refDuration, onRecorded])

  const start = async () => {
    setPhase({ kind: 'starting' })
    try {
      const stream = streamRef.current ?? (await openCamera())
      streamRef.current = stream
      const cam = camVideo.current
      if (cam) {
        cam.srcObject = stream
        await cam.play().catch(() => {})
      }
      setHasPreview(true)
      setPhase({ kind: 'countdown', n: COUNTDOWN_FROM })
    } catch (e) {
      setHasPreview(false)
      setPhase({
        kind: 'error',
        message: e instanceof CameraError ? e.message : '카메라를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
      })
    }
  }

  const referenceReady = refDuration > 0
  const busy = phase.kind === 'starting' || phase.kind === 'countdown' || phase.kind === 'recording'
  const ctaLabel =
    phase.kind === 'starting'
      ? '카메라 준비 중'
      : phase.kind === 'countdown' || phase.kind === 'recording'
        ? '녹화 중'
        : phase.kind === 'error'
          ? '다시 시도'
          : '연습 시작'

  return (
    <div className="stage stage-pair">
      <h2 className="sr-only" tabIndex={-1}>
        02 따라 하기: 기준 영상과 함께 녹화
      </h2>

      <div className="pair">
        <section className="pane" aria-label="기준 영상">
          <div className="stage-labels label">
            <span>REFERENCE</span>
          </div>
          <ReferenceVideo
            sign={sign}
            videoRef={refVideo}
            loop={false}
            onReady={(v) => setRefDuration(Number.isFinite(v.duration) ? v.duration : sign.durationSec)}
          />
        </section>

        <section className="pane" aria-label="내 움직임 (거울 화면)">
          <div className="stage-labels label">
            <span>MY MOVEMENT</span>
            <span>MIRRORED</span>
          </div>
          <div className="video-box webcam">
            {/* 웹캠 미리보기는 거울처럼 좌우반전 고정 (CLAUDE.md §11) */}
            <video ref={camVideo} className={`mirrored${hasPreview ? ' is-live' : ''}`} muted playsInline aria-hidden="true" />
            {!hasPreview && (
              <div className="webcam-empty">
                <span className="webcam-icon" aria-hidden="true" />
                <p role={phase.kind === 'error' ? 'alert' : undefined}>
                  {phase.kind === 'error' ? phase.message : '카메라는 연습을 시작할 때만 사용됩니다.'}
                </p>
              </div>
            )}
            {phase.kind === 'countdown' && (
              <div className="countdown" aria-live="assertive">
                {phase.n}
              </div>
            )}
            {phase.kind === 'recording' && <div className="rec-badge frame-label">● REC</div>}
          </div>
        </section>
      </div>

      <div className="action-bar">
        <p className="action-help">
          기준 영상과 녹화가 동시에 시작됩니다.
          <br />
          카메라 화면은 거울처럼 반전되어 보입니다.
          <br />
          녹화 영상은 이 브라우저 메모리에만 머물며, 업로드되거나 전송되지 않습니다.
          {!referenceReady && (
            <>
              <br />
              <strong>참고 시연 영상이 준비되면 연습할 수 있어요.</strong>
            </>
          )}
        </p>
        <button type="button" className="cta action-cta" onClick={start} disabled={busy || !referenceReady}>
          {ctaLabel}
          <Arrow />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {phase.kind === 'recording' ? '녹화를 시작했습니다.' : ''}
      </p>
    </div>
  )
}
