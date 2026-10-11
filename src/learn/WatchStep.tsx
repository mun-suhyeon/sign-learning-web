import { useRef, useState } from 'react'
import { Arrow } from '../components/Arrow'
import { ReferenceVideo } from '../components/VideoFrame'
import { formatTime, isTodo, pad2, type SignItem } from '../data/signs'

interface Props {
  sign: SignItem
  onPractice: () => void
}

/** 01 WATCH — 기준 영상 관찰 (CLAUDE.md §4 보기) */
export function WatchStep({ sign, onPractice }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState<1 | 0.5>(1)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(sign.durationSec)

  const togglePlay = () => {
    const v = videoRef.current
    if (!v || !ready) return
    if (v.paused) v.play().catch(() => {})
    else v.pause()
  }

  const toggleRate = () => {
    const next = rate === 1 ? 0.5 : 1
    setRate(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }

  const { source } = sign
  const unavailable = ready ? undefined : '참고 시연 영상 준비 중'

  return (
    <div className="stage stage-watch">
      <section className="stage-main" aria-labelledby="watch-heading">
        <h2 id="watch-heading" className="sr-only" tabIndex={-1}>
          01 보기: 참고 시연 관찰
        </h2>
        <div className="stage-labels label">
          <span>REFERENCE</span>
        </div>

        <ReferenceVideo
          sign={sign}
          videoRef={videoRef}
          onPlayingChange={setPlaying}
          onTime={setTime}
          onReady={(v) => {
            setReady(true)
            setDuration(v.duration)
            v.playbackRate = rate
          }}
        >
          {!playing && (
            <button
              type="button"
              className="play-overlay"
              onClick={togglePlay}
              disabled={!ready}
              aria-label={ready ? '재생' : unavailable}
            >
              <PlayIcon />
            </button>
          )}
        </ReferenceVideo>

        <div className="player-bar">
          <button
            type="button"
            className="icon-button"
            onClick={togglePlay}
            disabled={!ready}
            aria-label={ready ? (playing ? '일시정지' : '재생') : unavailable}
          >
            {playing ? <PauseIcon /> : <PlayIcon small />}
          </button>
          <span className="player-time label" aria-hidden="true">
            {formatClock(time)} / {formatTime(duration)}
          </span>
          <div className="player-track" aria-hidden="true">
            <div style={{ width: duration ? `${Math.min(100, (time / duration) * 100)}%` : 0 }} />
          </div>
          <button
            type="button"
            className="speed-toggle label"
            onClick={toggleRate}
            disabled={!ready}
            aria-label={`재생 속도 ${rate === 1 ? '1.0' : '0.5'}배, 눌러서 ${rate === 1 ? '0.5' : '1.0'}배로 바꾸기`}
          >
            {rate === 1 ? '1.0' : '0.5'}×
          </button>
        </div>
      </section>

      <aside className="stage-side">
        <section className="observe" aria-labelledby="observe-heading">
          <h3 id="observe-heading" className="label observe-title">
            OBSERVE
          </h3>
          <ol className="observe-list">
            {sign.points.map((p, i) => (
              <li key={i}>
                <span className="observe-no label">{pad2(i + 1)}</span>
                <span className="observe-text">{isTodo(p.text) ? `OBSERVATION POINT ${pad2(i + 1)}` : p.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="stage-side-bottom">
          {/* CC BY 저작자 표시: 제목·저작자·출처·라이선스 */}
          <a className="source-link" href={source.url} target="_blank" rel="noreferrer" title={source.title}>
            <span>
              <span className="label source-kicker">SOURCE / {source.license}</span>
              <span className="source-name">
                {source.site} · {source.author}
              </span>
            </span>
            <Arrow />
            <span className="sr-only">
              원 저작물 「{source.title}」, {source.license} 라이선스 (새 창에서 열림)
            </span>
          </a>
          <button type="button" className="cta" onClick={onPractice}>
            직접 해보기
            <Arrow />
          </button>
        </div>
      </aside>
    </div>
  )
}

/** 현재 시각은 0초도 00:00으로 표시 */
const formatClock = (sec: number) => (sec > 0 ? formatTime(sec) : '00:00')

function PlayIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 16
  return (
    <svg width={s} height={s} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 1.5v13l11-6.5z" fill="currentColor" />
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
