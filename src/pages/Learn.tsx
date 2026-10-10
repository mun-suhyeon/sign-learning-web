import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Arrow } from '../components/Arrow'
import { Header } from '../components/Header'
import { StepTabs, type Step } from '../components/StepTabs'
import { VISIBLE_SIGNS, pad2, type SignItem } from '../data/signs'
import { CompareStep } from '../learn/CompareStep'
import { PracticeStep } from '../learn/PracticeStep'
import { WatchStep } from '../learn/WatchStep'
import { markSeen, setLearned } from '../lib/progress'
import type { Recording } from '../lib/recorder'

export default function Learn() {
  const { id } = useParams()
  const sign = VISIBLE_SIGNS.find((s) => s.id === id)
  if (!sign) return <Navigate to="/" replace />
  // 표현이 바뀌면 단계 상태를 처음부터 다시 시작한다
  return <LearnScreen key={sign.id} sign={sign} />
}

/** 학습 화면 — 한 화면 안에서 WATCH → PRACTICE → COMPARE (CLAUDE.md §4) */
function LearnScreen({ sign }: { sign: SignItem }) {
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
    const following = VISIBLE_SIGNS.find((s) => s.order > sign.order)
    navigate(following ? `/learn/${following.id}` : '/')
  }

  const reachable: Step[] = recording ? ['watch', 'practice', 'compare'] : ['watch', 'practice']

  return (
    <div className="shell learn">
      <Header
        current={sign.order}
        total={VISIBLE_SIGNS.length}
        counterLabel={`${VISIBLE_SIGNS.length}개 표현 중 ${sign.order}번째`}
      />

      <div className="learn-top">
        <Link to="/" className="back-link label">
          <Arrow direction="left" />
          ARCHIVE
        </Link>
        <div className="learn-title-row">
          <h1 className="learn-title">EXPRESSION {pad2(sign.order)}</h1>
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
