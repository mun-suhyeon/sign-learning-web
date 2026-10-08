import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { JAMO } from '../data/jamo'
import { WORDS } from '../data/words'
import { sourceFor } from '../lib/classifier'
import { MASTERED_BOX, progressStore, samplesStore, useStore } from '../lib/storage'

export default function Home() {
  const progress = useStore(progressStore)
  const samples = useStore(samplesStore)
  const masteredJamo = JAMO.filter((j) => (progress[j.id]?.box ?? 0) >= MASTERED_BOX).length
  const masteredWords = WORDS.filter((w) => (progress[`word:${w.id}`]?.box ?? 0) >= MASTERED_BOX).length
  const scorable = JAMO.filter((j) => sourceFor(j.id, samples) !== 'none').length
  const toReview = JAMO.filter((j) => progress[j.id] && progress[j.id].box < MASTERED_BOX).length

  return (
    <>
      <section className="hero">
        <h1>
          보고, 따라 하고,
          <br />
          카메라로 바로 확인하세요.
        </h1>
        <p>
          한국수어 지문자와 기초 단어를 짧게 익히고, 웹캠 손 인식으로 내 손 모양을 실시간으로 채점받는 연습 공간입니다.
        </p>
        <div className="hero-actions">
          <Link to="/learn" className="btn primary">배우기 시작</Link>
          <Link to="/practice" className="btn">바로 연습하기</Link>
        </div>
      </section>

      <section className="stats">
        <Stat label="익힌 지문자" value={`${masteredJamo} / ${JAMO.length}`} ratio={masteredJamo / JAMO.length} />
        <Stat label="익힌 단어" value={`${masteredWords} / ${WORDS.length}`} ratio={masteredWords / WORDS.length} />
        <Stat label="자동 채점 가능한 글자" value={`${scorable} / ${JAMO.length}`} ratio={scorable / JAMO.length} />
      </section>
      {toReview > 0 && (
        <p className="callout">
          복습이 필요한 글자가 {toReview}개 있어요. <Link to="/practice?mode=review">복습 모드로 연습하기 →</Link>
        </p>
      )}

      <section className="steps">
        <Step n={1} title="배우기" to="/learn">
          지문자 표와 기초 단어 카드에서 공식 사전 영상을 보고 손 모양을 익힙니다.
        </Step>
        <Step n={2} title="지문자 연습" to="/practice">
          제시된 글자를 카메라 앞에서 만들면 0.7초 유지 시 정답 처리됩니다. 순서·복습·60초 도전·단어 철자 모드가 있어요.
        </Step>
        <Step n={3} title="단어 거울 연습" to="/mirror">
          움직임이 있는 단어는 거울 화면으로 따라 하고, 내 동작을 녹화해 바로 다시 볼 수 있어요.
        </Step>
        <Step n={4} title="기준 동작 등록" to="/register">
          글자별 기준 손 모양을 직접 녹화하면 그 샘플로 채점합니다. 규칙이 없는 글자도 채점할 수 있게 돼요.
        </Step>
      </section>
    </>
  )
}

function Stat({ label, value, ratio }: { label: string; value: string; ratio: number }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <strong>{value}</strong>
      <div className="meter"><div style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
    </div>
  )
}

function Step({ n, title, to, children }: { n: number; title: string; to: string; children: ReactNode }) {
  return (
    <Link to={to} className="step">
      <span className="step-n">{n}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </Link>
  )
}
