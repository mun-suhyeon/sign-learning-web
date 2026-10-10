import { Navigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { VISIBLE_SIGNS, pad2 } from '../data/signs'

// Step 2 기반 화면. WATCH / PRACTICE / COMPARE는 Step 4~6에서 구현한다.
export default function Learn() {
  const { id } = useParams()
  const sign = VISIBLE_SIGNS.find((s) => s.id === id)
  if (!sign) return <Navigate to="/" replace />

  return (
    <div className="shell">
      <Header
        current={sign.order}
        total={VISIBLE_SIGNS.length}
        counterLabel={`${VISIBLE_SIGNS.length}개 표현 중 ${sign.order}번째`}
      />
      <main>
        <h1>EXPRESSION {pad2(sign.order)}</h1>
      </main>
    </div>
  )
}
