import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { VISIBLE_SIGNS, pad2 } from '../data/signs'
import { getProgress, useProgress } from '../lib/progress'

// Step 2 기반 화면. 01_HOME.png 디자인은 Step 3에서 구현한다.
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
        <ul>
          {VISIBLE_SIGNS.map((s) => (
            <li key={s.id}>
              <Link to={`/learn/${s.id}`}>EXPRESSION {pad2(s.order)}</Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
