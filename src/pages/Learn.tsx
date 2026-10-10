import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Arrow } from '../components/Arrow'
import { Header } from '../components/Header'
import { StepTabs, type Step } from '../components/StepTabs'
import { VISIBLE_SIGNS, pad2, type SignItem } from '../data/signs'
import { WatchStep } from '../learn/WatchStep'
import { markSeen } from '../lib/progress'

export default function Learn() {
  const { id } = useParams()
  const sign = VISIBLE_SIGNS.find((s) => s.id === id)
  if (!sign) return <Navigate to="/" replace />
  // 표현이 바뀌면 단계 상태를 처음부터 다시 시작한다
  return <LearnScreen key={sign.id} sign={sign} />
}

/** 학습 화면 — 한 화면 안에서 WATCH → PRACTICE → COMPARE (CLAUDE.md §4) */
function LearnScreen({ sign }: { sign: SignItem }) {
  const [step, setStep] = useState<Step>('watch')
  const stageRef = useRef<HTMLElement>(null)
  const prevStep = useRef<Step>(step)

  useEffect(() => {
    markSeen(sign.id)
  }, [sign.id])

  // 단계가 바뀌면 새 단계의 제목으로 포커스를 옮긴다 (CLAUDE.md §13)
  useEffect(() => {
    if (prevStep.current === step) return
    prevStep.current = step
    stageRef.current?.querySelector<HTMLElement>('h2[tabindex="-1"]')?.focus()
  }, [step])

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
          <StepTabs current={step} reachable={['watch', 'practice']} onSelect={setStep} />
        </div>
      </div>

      <main className="learn-main" ref={stageRef}>
        {step === 'watch' && <WatchStep sign={sign} onPractice={() => setStep('practice')} />}
        {step !== 'watch' && (
          // Step 5(PRACTICE)·Step 6(COMPARE)에서 구현한다
          <h2 className="sr-only" tabIndex={-1}>
            {step === 'practice' ? '02 따라 하기' : '03 비교'}
          </h2>
        )}
      </main>
    </div>
  )
}
