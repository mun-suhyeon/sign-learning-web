import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CameraView } from '../components/CameraView'
import { SourceBadge } from '../components/SourceBadge'
import { JAMO, JAMO_BY_ID, dictionaryUrl } from '../data/jamo'
import { recognize, sourceFor } from '../lib/classifier'
import { toVector, type HandFrame } from '../lib/handFeatures'
import { addSamples, clearSamples, samplesStore, settingsStore, useStore, type SampleStore } from '../lib/storage'

const COUNTDOWN = 3
const RECORD_MS = 3000
const SAMPLE_EVERY_MS = 80

type Phase = { kind: 'idle' } | { kind: 'countdown'; n: number } | { kind: 'recording' }

export default function Register() {
  const [params, setParams] = useSearchParams()
  const samples = useStore(samplesStore)
  const selectedId = JAMO_BY_ID.has(params.get('letter') ?? '') ? params.get('letter')! : JAMO[0].id
  const selected = JAMO_BY_ID.get(selectedId)!

  const [phase, setPhase] = useState<Phase>({ kind: 'idle' })
  const [recognized, setRecognized] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const buffer = useRef<number[][]>([])
  const lastSample = useRef(0)
  const lastUi = useRef(0)
  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // 카운트다운 → 녹화 → 저장
  useEffect(() => {
    if (phase.kind === 'countdown') {
      const t = setTimeout(
        () => setPhase(phase.n > 1 ? { kind: 'countdown', n: phase.n - 1 } : { kind: 'recording' }),
        1000,
      )
      return () => clearTimeout(t)
    }
    if (phase.kind === 'recording') {
      buffer.current = []
      const t = setTimeout(() => {
        const got = buffer.current
        if (got.length >= 5) {
          addSamples(selectedId, got)
          setMessage(`${selected.char} 샘플 ${got.length}개를 저장했어요.`)
        } else {
          setMessage('손이 거의 잡히지 않았어요. 손 전체가 화면에 보이게 하고 다시 시도해 주세요.')
        }
        setPhase({ kind: 'idle' })
      }, RECORD_MS)
      return () => clearTimeout(t)
    }
  }, [phase, selectedId, selected.char])

  const onFrame = useCallback((hand: HandFrame | null) => {
    const now = performance.now()
    if (hand && phaseRef.current.kind === 'recording' && now - lastSample.current > SAMPLE_EVERY_MS) {
      lastSample.current = now
      buffer.current.push(toVector(hand))
    }
    if (now - lastUi.current > 150) {
      lastUi.current = now
      setRecognized(hand ? recognize(hand, samplesStore.get(), settingsStore.get().sensitivity) : null)
    }
  }, [])

  const exportSamples = () => {
    const blob = new Blob([JSON.stringify({ format: 'ksl-samples', version: 1, samples }, null, 0)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ksl-samples.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importSamples = async (file: File) => {
    try {
      const data = JSON.parse(await file.text())
      if (data?.format !== 'ksl-samples' || typeof data.samples !== 'object') throw new Error()
      const incoming = data.samples as SampleStore
      const valid = Object.entries(incoming).filter(
        ([id, list]) => JAMO_BY_ID.has(id) && Array.isArray(list) && list.every((v) => Array.isArray(v) && v.length === 60),
      )
      const merged = { ...samplesStore.get() }
      for (const [id, list] of valid) merged[id] = [...(merged[id] ?? []), ...list]
      samplesStore.set(merged)
      setMessage(`${valid.length}개 글자의 샘플을 가져왔어요.`)
    } catch {
      setMessage('올바른 샘플 파일이 아니에요.')
    }
  }

  const count = samples[selectedId]?.length ?? 0
  const busy = phase.kind !== 'idle'
  const recognizedJamo = recognized ? JAMO_BY_ID.get(recognized) : undefined

  return (
    <>
      <h1>기준 동작 등록</h1>
      <p className="muted">
        공식 영상으로 정확한 손 모양을 확인한 뒤 3초간 녹화하면, 이 글자는 녹화한 샘플을 기준으로 채점됩니다. 손의 위치와 각도를 조금씩
        바꿔 가며 2~3번 녹화하면 인식이 안정적이에요. 강사나 숙련자가 녹화해 <b>내보낸 파일</b>을 학습자가 <b>가져오면</b> 모두 같은 기준으로
        연습할 수 있습니다.
      </p>

      <div className="jamo-grid compact">
        {JAMO.map((j) => (
          <button
            key={j.id}
            className={`jamo-tile ${j.id === selectedId ? 'active' : ''}`}
            onClick={() => setParams({ letter: j.id })}
            disabled={busy}
          >
            <span className="jamo-char">{j.char}</span>
            <span className="jamo-name">{samples[j.id]?.length ? `샘플 ${samples[j.id].length}` : '—'}</span>
          </button>
        ))}
      </div>

      <div className="practice-layout">
        <CameraView onFrame={onFrame}>
          {phase.kind === 'countdown' && <div className="camera-count">{phase.n}</div>}
          {phase.kind === 'recording' && <div className="camera-rec">● 녹화 중 — 손 모양을 유지하세요</div>}
        </CameraView>

        <aside className="card practice-panel">
          <div className="detail-char">{selected.char}</div>
          <div className="detail-name">{selected.name}</div>
          <SourceBadge source={sourceFor(selectedId, samples)} />
          <a className="btn block" href={dictionaryUrl(selected.char)} target="_blank" rel="noreferrer">
            공식 시연 영상 보기 ↗
          </a>

          <button className="btn primary block" disabled={busy} onClick={() => setPhase({ kind: 'countdown', n: COUNTDOWN })}>
            {busy ? '녹화 중…' : `3초 녹화하기 (현재 ${count}개)`}
          </button>
          {count > 0 && (
            <button className="btn ghost block" disabled={busy} onClick={() => clearSamples(selectedId)}>
              이 글자 샘플 지우기
            </button>
          )}
          {message && <p className="small">{message}</p>}

          <p className="recognized">
            지금 인식된 글자: <b>{recognizedJamo?.char ?? '—'}</b>
          </p>

          <hr />
          <div className="row">
            <button className="btn" onClick={exportSamples} disabled={!Object.keys(samples).length}>
              전체 내보내기
            </button>
            <label className="btn">
              가져오기
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importSamples(f)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </aside>
      </div>
    </>
  )
}
