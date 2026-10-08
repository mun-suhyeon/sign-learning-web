import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CameraView } from '../components/CameraView'
import { dictionaryUrl } from '../data/jamo'
import { WORDS } from '../data/words'
import { MASTERED_BOX, progressStore, setMastered, useStore } from '../lib/storage'

const RECORD_SECONDS = 4

export default function Mirror() {
  const { wordId } = useParams()
  const index = WORDS.findIndex((w) => w.id === wordId)
  const word = WORDS[index]
  const progress = useStore(progressStore)

  if (!word) {
    return (
      <>
        <h1>단어 거울 연습</h1>
        <p className="muted">연습할 단어를 고르세요.</p>
        <div className="word-grid">
          {WORDS.map((w) => (
            <Link key={w.id} to={`/mirror/${w.id}`} className="word-tile">
              {w.text}
              {(progress[`word:${w.id}`]?.box ?? 0) >= MASTERED_BOX && <span className="jamo-check">✓</span>}
            </Link>
          ))}
        </div>
      </>
    )
  }

  const key = `word:${word.id}`
  const mastered = (progress[key]?.box ?? 0) >= MASTERED_BOX
  const prev = WORDS[(index - 1 + WORDS.length) % WORDS.length]
  const next = WORDS[(index + 1) % WORDS.length]

  return (
    <>
      <div className="mirror-head">
        <Link to={`/mirror/${prev.id}`} className="btn ghost" aria-label="이전 단어">←</Link>
        <div>
          <span className="muted small">{word.category}</span>
          <h1>{word.text}</h1>
        </div>
        <Link to={`/mirror/${next.id}`} className="btn ghost" aria-label="다음 단어">→</Link>
      </div>
      {/* key로 단어가 바뀔 때 녹화 상태를 초기화한다 */}
      <MirrorStudio key={word.id} wordText={word.text} />
      <div className="row center">
        <label className="check">
          <input type="checkbox" checked={mastered} onChange={(e) => setMastered(key, e.target.checked)} />
          이 단어를 익혔어요
        </label>
      </div>
    </>
  )
}

type RecState = { kind: 'idle' } | { kind: 'recording'; left: number } | { kind: 'done'; url: string }

function MirrorStudio({ wordText }: { wordText: string }) {
  const streamRef = useRef<MediaStream | null>(null)
  const [rec, setRec] = useState<RecState>({ kind: 'idle' })
  const recUrl = rec.kind === 'done' ? rec.url : null

  useEffect(() => () => {
    if (recUrl) URL.revokeObjectURL(recUrl)
  }, [recUrl])

  const record = () => {
    const stream = streamRef.current
    if (!stream || typeof MediaRecorder === 'undefined') return
    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream)
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data)
    recorder.onstop = () =>
      setRec({ kind: 'done', url: URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType })) })
    recorder.start()
    let left = RECORD_SECONDS
    setRec({ kind: 'recording', left })
    const t = setInterval(() => {
      left -= 1
      if (left <= 0) {
        clearInterval(t)
        recorder.stop()
      } else {
        setRec({ kind: 'recording', left })
      }
    }, 1000)
  }

  return (
    <>
      <ol className="mirror-steps">
        <li>
          <a href={dictionaryUrl(wordText)} target="_blank" rel="noreferrer">국립국어원 한국수어사전에서 '{wordText}' 영상 보기 ↗</a>
        </li>
        <li>거울 화면을 보며 여러 번 따라 하기</li>
        <li>{RECORD_SECONDS}초 녹화 후 공식 영상과 내 동작 비교하기</li>
      </ol>
      <div className="mirror-layout">
        <div>
          <CameraView track={false} onStream={(s) => (streamRef.current = s)}>
            {rec.kind === 'recording' && <div className="camera-rec">● 녹화 중 {rec.left}</div>}
          </CameraView>
          <button className="btn primary block" onClick={record} disabled={rec.kind === 'recording'}>
            {rec.kind === 'done' ? '다시 녹화' : `${RECORD_SECONDS}초 녹화`}
          </button>
        </div>
        <div className="replay">
          {recUrl ? (
            // 좌우 반전 시 기본 컨트롤도 뒤집히므로 컨트롤 없이 자동 반복 재생한다
            <video src={recUrl} autoPlay loop muted playsInline className="mirrored" />
          ) : (
            <div className="replay-empty">녹화한 영상이 여기에 반복 재생됩니다.</div>
          )}
        </div>
      </div>
    </>
  )
}
