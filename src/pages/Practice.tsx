import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CameraView } from '../components/CameraView'
import { SourceBadge } from '../components/SourceBadge'
import { JAMO, JAMO_BY_CHAR, JAMO_BY_ID, dictionaryUrl } from '../data/jamo'
import { SPELLING_WORDS } from '../data/words'
import { evaluate, recognize, sourceFor, type Evaluation } from '../lib/classifier'
import { decompose } from '../lib/hangul'
import type { HandFrame } from '../lib/handFeatures'
import { progressStore, recordAttempt, samplesStore, settingsStore, useStore } from '../lib/storage'

type Mode = 'sequence' | 'review' | 'timeattack' | 'spelling' | 'single'

const MODES: { id: Exclude<Mode, 'single'>; label: string; desc: string }[] = [
  { id: 'sequence', label: '순서대로', desc: 'ㄱ부터 차례로 한 번씩' },
  { id: 'review', label: '복습', desc: '약한 글자 10개 먼저' },
  { id: 'timeattack', label: '60초 도전', desc: '제한 시간 안에 최대한 많이' },
  { id: 'spelling', label: '단어 철자', desc: '나무 → ㄴ ㅏ ㅁ ㅜ' },
]

/** 정답 손 모양을 이 시간 동안 유지해야 통과 */
const HOLD_MS = 700
const TIME_LIMIT = 60

interface Session {
  mode: Mode
  queue: string[]
  index: number
  word?: string
  successes: number
  skips: number
  finished: boolean
}

interface Live {
  handPresent: boolean
  evaluation: Evaluation | null
  recognized: string | null
  hold: number
}

const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5)

export default function Practice() {
  const [params] = useSearchParams()
  const samples = useStore(samplesStore)
  const settings = useStore(settingsStore)

  const available = useMemo(() => JAMO.filter((j) => sourceFor(j.id, samples) !== 'none').map((j) => j.id), [samples])
  const spellable = useMemo(
    () => SPELLING_WORDS.filter((w) => decompose(w).every((c) => available.includes(JAMO_BY_CHAR.get(c)?.id ?? ''))),
    [available],
  )

  const buildQueue = useCallback(
    (mode: Mode, letter?: string): Pick<Session, 'queue' | 'word'> => {
      switch (mode) {
        case 'single':
          return { queue: [letter!] }
        case 'sequence':
          return { queue: available }
        case 'review': {
          const prog = progressStore.get()
          const sorted = [...available].sort(
            (a, b) => (prog[a]?.box ?? 0) - (prog[b]?.box ?? 0) || (prog[a]?.last ?? 0) - (prog[b]?.last ?? 0),
          )
          return { queue: sorted.slice(0, 10) }
        }
        case 'timeattack':
          return { queue: shuffle(available) }
        case 'spelling': {
          const word = shuffle(spellable)[0]
          return { word, queue: word ? decompose(word).map((c) => JAMO_BY_CHAR.get(c)!.id) : [] }
        }
      }
    },
    [available, spellable],
  )

  const newSession = useCallback(
    (mode: Mode, letter?: string): Session => ({
      mode,
      ...buildQueue(mode, letter),
      index: 0,
      successes: 0,
      skips: 0,
      finished: false,
    }),
    [buildQueue],
  )

  // URL로 들어온 경우 (?letter=g, ?mode=review) 바로 시작
  const [session, setSession] = useState<Session | null>(() => {
    const letter = params.get('letter')
    const mode = params.get('mode') as Mode | null
    if (letter && available.includes(letter)) return newSession('single', letter)
    if (mode && MODES.some((m) => m.id === mode)) return newSession(mode)
    return null
  })
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [live, setLive] = useState<Live>({ handPresent: false, evaluation: null, recognized: null, hold: 0 })
  const [flash, setFlash] = useState(0)

  const start = useCallback(
    (mode: Mode) => {
      setSession(newSession(mode))
      setTimeLeft(TIME_LIMIT)
    },
    [newSession],
  )

  const advance = useCallback(
    (id: string, correct: boolean) => {
      recordAttempt(id, correct)
      setSession((s) => {
        if (!s || s.finished) return s
        const next = {
          ...s,
          successes: s.successes + (correct ? 1 : 0),
          skips: s.skips + (correct ? 0 : 1),
          index: s.index + 1,
        }
        if (next.index < next.queue.length) return next
        if (s.mode === 'single') return { ...next, index: 0 }
        if (s.mode === 'timeattack' || s.mode === 'spelling') return { ...next, ...buildQueue(s.mode), index: 0 }
        return { ...next, finished: true }
      })
      if (correct) setFlash((f) => f + 1)
    },
    [buildQueue],
  )

  // 60초 도전 타이머
  const running = !!session && !session.finished
  useEffect(() => {
    if (!running || session?.mode !== 'timeattack') return
    const t = setInterval(() => {
      setTimeLeft((v) => {
        if (v <= 1) {
          setSession((s) => (s ? { ...s, finished: true } : s))
          return 0
        }
        return v - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [running, session?.mode])

  const target = running ? session.queue[session.index] : undefined

  // 카메라 루프에서 쓰는 값은 ref로 최신 상태를 읽는다
  const targetRef = useRef(target)
  const holdStart = useRef<number | null>(null)
  const lastUi = useRef(0)
  useEffect(() => {
    targetRef.current = target
    holdStart.current = null
  }, [target, session?.index])

  const onFrame = useCallback(
    (hand: HandFrame | null) => {
      const now = performance.now()
      const tgt = targetRef.current
      const { sensitivity } = settingsStore.get()
      const smp = samplesStore.get()
      let evaluation: Evaluation | null = null
      let hold = 0

      if (hand && tgt) {
        evaluation = evaluate(tgt, hand, smp, sensitivity)
        if (evaluation.pass) {
          holdStart.current ??= now
          hold = Math.min(1, (now - holdStart.current) / HOLD_MS)
          if (hold >= 1) {
            holdStart.current = null
            targetRef.current = undefined // 다음 글자가 렌더될 때까지 중복 통과 방지
            advance(tgt, true)
          }
        } else {
          holdStart.current = null
        }
      } else {
        holdStart.current = null
      }

      if (now - lastUi.current > 90 || hold >= 1) {
        lastUi.current = now
        setLive({
          handPresent: !!hand,
          evaluation,
          recognized: hand ? recognize(hand, smp, sensitivity) : null,
          hold,
        })
      }
    },
    [advance],
  )

  const targetJamo = target ? JAMO_BY_ID.get(target) : undefined
  const recognizedJamo = live.recognized ? JAMO_BY_ID.get(live.recognized) : undefined

  return (
    <>
      <h1>지문자 연습</h1>

      {!running && (
        <ModePicker
          availableCount={available.length}
          spellableCount={spellable.length}
          onStart={start}
          result={session?.finished ? session : null}
        />
      )}

      <div className="practice-layout">
        <CameraView onFrame={onFrame}>
          {targetJamo && (
            <div className="camera-target" key={flash}>
              <span>{targetJamo.char}</span>
              <svg viewBox="0 0 40 40" className="hold-ring" aria-hidden>
                <circle cx="20" cy="20" r="17" />
                <circle cx="20" cy="20" r="17" className="fill" style={{ strokeDashoffset: 107 * (1 - live.hold) }} />
              </svg>
            </div>
          )}
          {flash > 0 && <div className="camera-flash" key={`f${flash}`}>정답!</div>}
        </CameraView>

        <aside className="card practice-panel">
          {running && targetJamo ? (
            <>
              <div className="practice-meta">
                <span>{MODE_LABEL[session.mode]}</span>
                {session.mode === 'timeattack' ? (
                  <span className="timer">{timeLeft}초</span>
                ) : session.mode === 'single' ? (
                  <span>{session.successes}회 성공</span>
                ) : (
                  <span>
                    {session.index + 1} / {session.queue.length}
                  </span>
                )}
              </div>

              {session.mode === 'spelling' && session.word && (
                <div className="spelling">
                  <strong>{session.word}</strong>
                  <div>
                    {session.queue.map((id, i) => (
                      <span key={i} className={i < session.index ? 'done' : i === session.index ? 'now' : ''}>
                        {JAMO_BY_ID.get(id)!.char}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-char">{targetJamo.char}</div>
              <div className="detail-name">{targetJamo.name}</div>
              <SourceBadge source={sourceFor(targetJamo.id, samples)} />

              <Feedback live={live} />

              <p className="recognized">
                지금 인식된 글자: <b>{recognizedJamo?.char ?? '—'}</b>
              </p>

              <div className="row">
                <a className="btn" href={dictionaryUrl(targetJamo.char)} target="_blank" rel="noreferrer">
                  공식 영상 ↗
                </a>
                <button className="btn" onClick={() => advance(targetJamo.id, false)}>
                  건너뛰기
                </button>
                <button className="btn ghost" onClick={() => setSession(null)}>
                  그만하기
                </button>
              </div>
              <p className="small muted">
                {session.mode === 'timeattack' ? `성공 ${session.successes}개` : `성공 ${session.successes} · 건너뜀 ${session.skips}`}
              </p>
            </>
          ) : (
            <p className="muted">모드를 고르면 연습이 시작됩니다. 카메라에 한 손이 잘 보이도록 해 주세요.</p>
          )}

          <label className="slider">
            판정 민감도 <span className="muted small">(샘플 채점에 적용)</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.sensitivity}
              onChange={(e) => settingsStore.set({ ...settings, sensitivity: Number(e.target.value) })}
            />
            <span className="slider-ends">
              <span>엄격</span>
              <span>관대</span>
            </span>
          </label>
        </aside>
      </div>
    </>
  )
}

const MODE_LABEL: Record<Mode, string> = {
  sequence: '순서대로',
  review: '복습',
  timeattack: '60초 도전',
  spelling: '단어 철자',
  single: '한 글자 반복',
}

function Feedback({ live }: { live: Live }) {
  if (!live.handPresent) return <p className="feedback warn">손이 보이지 않아요. 카메라 앞에 한 손을 올려 주세요.</p>
  const ev = live.evaluation
  if (!ev) return null
  if (ev.pass) return <p className="feedback ok">좋아요! 그대로 유지하세요…</p>
  const misses = ev.checks.filter((c) => !c.ok)
  return (
    <div className="feedback">
      <div className="meter">
        <div style={{ width: `${Math.round(ev.score * 100)}%` }} />
      </div>
      <ul>
        {misses.slice(0, 3).map((c) => (
          <li key={c.hint}>{c.hint}</li>
        ))}
      </ul>
    </div>
  )
}

function ModePicker({
  availableCount,
  spellableCount,
  onStart,
  result,
}: {
  availableCount: number
  spellableCount: number
  onStart: (m: Mode) => void
  result: Session | null
}) {
  return (
    <div className="card mode-picker">
      {result && (
        <p className="result">
          🎉 끝! 성공 <b>{result.successes}</b>개{result.skips ? ` · 건너뜀 ${result.skips}개` : ''}
        </p>
      )}
      <div className="mode-grid">
        {MODES.map((m) => {
          const disabled = availableCount === 0 || (m.id === 'spelling' && spellableCount === 0)
          return (
            <button key={m.id} className="mode" disabled={disabled} onClick={() => onStart(m.id)}>
              <strong>{m.label}</strong>
              <span>{m.id === 'spelling' && spellableCount === 0 ? '채점 가능한 단어가 아직 없어요' : m.desc}</span>
            </button>
          )
        })}
      </div>
      <p className="small muted">
        현재 자동 채점 가능한 글자 {availableCount}/{JAMO.length}개.{' '}
        <Link to="/register">기준 동작을 등록</Link>하면 나머지 글자와 단어 철자도 연습할 수 있어요.
      </p>
    </div>
  )
}
