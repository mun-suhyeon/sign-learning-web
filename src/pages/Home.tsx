import { Link } from 'react-router-dom'
import { Arrow } from '../components/Arrow'
import { Header } from '../components/Header'
import { ReferencePlaceholder } from '../components/VideoFrame'
import { VISIBLE_SIGNS, isTodo, pad2, type SignItem } from '../data/signs'
import { getProgress, statusOf, useProgress, type ProgressStatus } from '../lib/progress'

const STATUS: Record<ProgressStatus, { action: string; state: string; ratio: number; spoken: string }> = {
  done: { action: 'COMPLETED', state: 'DONE', ratio: 1, spoken: '익힘' },
  'in-progress': { action: 'CONTINUE', state: 'IN PROGRESS', ratio: 0.5, spoken: '진행 중' },
  'not-started': { action: 'START', state: 'NOT STARTED', ratio: 0, spoken: '시작 전' },
}

export default function Home() {
  const progress = useProgress()
  const learned = VISIBLE_SIGNS.filter((s) => getProgress(progress, s.id).learned).length

  return (
    <div className="shell">
      <Header
        current={learned}
        total={VISIBLE_SIGNS.length}
        counterLabel={`전체 ${VISIBLE_SIGNS.length}개 중 ${learned}개 익힘`}
      />

      <main>
        <section className="home-intro">
          <div className="home-intro-main">
            <p className="label">KOREAN SIGN LANGUAGE / STUDY 001</p>
            <h1 className="home-title">
              보고, 따라 하고,{' '}
              <br />
              나란히 비교하세요.
            </h1>
          </div>
          <div className="home-intro-aside">
            <p className="home-lede">
              기준 영상을 관찰한 뒤 직접 움직임을 녹화하고,{' '}
              <br />
              두 영상을 나란히 보며 차이를 확인합니다.
            </p>
            <p className="label home-hint">
              <span className="dot" aria-hidden="true" />
              SELECT AN EXPRESSION BELOW
            </p>
          </div>
        </section>

        <ul className="archive-grid">
          {VISIBLE_SIGNS.map((sign) => (
            <li key={sign.id}>
              <ExpressionCard sign={sign} status={statusOf(getProgress(progress, sign.id))} />
            </li>
          ))}
        </ul>
      </main>

      <footer className="home-footer">
        <div>
          <p className="label">SELF-OBSERVATION, NOT AUTOMATED EVALUATION</p>
          <p className="home-notice">
            국립국어원 한국수어사전과 대조해 만든 학습 프로토타입으로, 전문가 검수를 거치지 않았습니다. 정확한 표현은{' '}
            <a href="https://sldict.korean.go.kr" target="_blank" rel="noreferrer">
              공식 사전
            </a>
            에서 확인해 주세요.
          </p>
        </div>
        <p className="label">© 2026 KSL VISUAL ARCHIVE</p>
      </footer>
    </div>
  )
}

function ExpressionCard({ sign, status }: { sign: SignItem; status: ProgressStatus }) {
  const s = STATUS[status]
  const no = pad2(sign.order)
  const meaning = isTodo(sign.meaning) ? '의미 정보 준비 중' : sign.meaning

  return (
    <Link
      to={`/learn/${sign.id}`}
      className="card"
      aria-label={`표현 ${no}, ${meaning}, ${s.spoken}`}
    >
      <ReferencePlaceholder refNo={sign.order} durationSec={sign.durationSec} tone="light" />
      <div className="card-body">
        <p className="card-kicker">표현 {no}</p>
        <div className="card-title-row">
          <h2 className="card-title">EXPRESSION {no}</h2>
          <Arrow className="card-arrow" />
        </div>
        <p className="card-meaning">{meaning}</p>
      </div>
      <div className="card-status" aria-hidden="true">
        <div className="card-status-row label">
          <span>{s.action}</span>
          <span>{s.state}</span>
        </div>
        <div className="card-rule">
          <div style={{ width: `${s.ratio * 100}%` }} />
        </div>
      </div>
    </Link>
  )
}
