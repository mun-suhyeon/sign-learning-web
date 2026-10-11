import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Arrow } from '../components/Arrow'
import { Header } from '../components/Header'
import { StepTabs, type Step } from '../components/StepTabs'
import { type SignItem } from '../data/signs'
import { CompareStep } from '../learn/CompareStep'
import { PracticeStep } from '../learn/PracticeStep'
import { WatchStep } from '../learn/WatchStep'
import { markSeen, setLearned } from '../lib/progress'
import { useSessionSigns } from '../lib/session'
import type { Recording } from '../lib/recorder'

export default function Learn() {
  const { id } = useParams()
  const session = useSessionSigns()
  const index = session.findIndex((s) => s.id === id)
  // 현재 세션의 4개에 없는 표현이면 홈으로
  if (index < 0) return <Navigate to="/" replace />
  // 화면의 표현 번호는 세션 안의 위치를 쓴다. 진행 상태는 sign.id 기준
  const sign = { ...session[index], order: index + 1 }
  const nextId = session[index + 1]?.id ?? null
  // 표현이 바뀌면 단계 상태를 처음부터 다시 시작한다
  return <LearnScreen key={sign.id} sign={sign} total={session.length} nextId={nextId} />
}

/** 학습 화면 — 한 화면 안에서 WATCH → PRACTICE → COMPARE (CLAUDE.md §4) */
function LearnScreen({ sign, total, nextId }: { sign: SignItem; total: number; nextId: string | null }) {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('watch')
  const [recording, setRecording] = useState<Recording | null>(null)
  const stageRef = useRef<HTMLElement>(null)
  const prevStep = useRef<Step>(step)
  const recordingUrl = useRef<string | null>(null)

  useEffect(() => {
    markSeen(sign.id)
  }, [sign.id])

  // 녹화본은 메모리의 Blob URL로만 존재한다. 교체하거나 화면을 떠나면 해제한다 (CLAUDE.md §6)
  const replaceRecording = useCallback((next: Recording | null) => {
    if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current)
    recordingUrl.current = next?.url ?? null
    setRecording(next)
  }, [])

  useEffect(
    () => () => {
      if (recordingUrl.current) URL.revokeObjectURL(recordingUrl.current)
      recordingUrl.current = null
    },
    [],
  )

  // 단계가 바뀌면 새 단계의 제목으로 포커스를 옮긴다 (CLAUDE.md §13)
  useEffect(() => {
    if (prevStep.current === step) return
    prevStep.current = step
    stageRef.current?.querySelector<HTMLElement>('h2[tabindex="-1"]')?.focus()
  }, [step])

  const onRecorded = useCallback(
    (next: Recording) => {
      replaceRecording(next)
      setStep('compare')
    },
    [replaceRecording],
  )

  const retry = () => {
    replaceRecording(null)
    setStep('practice')
  }

  const next = () => {
    setLearned(sign.id, true)
    // 세션의 다음 표현으로. 4번째 다음에는 홈으로 돌아간다
    navigate(nextId ? `/learn/${nextId}` : '/')
  }

  const reachable: Step[] = recording ? ['watch', 'practice', 'compare'] : ['watch', 'practice']

  return (
    <div className="shell learn">
      <Header
        current={sign.order}
        total={total}
        counterLabel={`${total}개 표현 중 ${sign.order}번째`}
      />

      <div className="learn-top">
        <Link to="/" className="back-link label">
          <Arrow direction="left" />
          ARCHIVE
        </Link>
        <div className="learn-title-row">
          {/* WATCH·PRACTICE·COMPARE 모두에서 지금 익히는 표현을 보여 준다 */}
          <h1 className="learn-title">{sign.meaning}</h1>
          <StepTabs current={step} reachable={reachable} onSelect={setStep} />
        </div>
      </div>

      <main className="learn-main" ref={stageRef}>
        {step === 'watch' && <WatchStep sign={sign} onPractice={() => setStep('practice')} />}
        {step === 'practice' && <PracticeStep sign={sign} onRecorded={onRecorded} />}
        {step === 'compare' && recording && (
          <CompareStep sign={sign} recording={recording} onRetry={retry} onNext={next} />
        )}
      </main>
    </div>
  )
}
