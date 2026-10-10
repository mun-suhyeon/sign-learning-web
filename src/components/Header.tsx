import { Link } from 'react-router-dom'
import { pad2 } from '../data/signs'

interface Props {
  /** 오른쪽 위 카운터 (예: 01 / 04) */
  current: number
  total: number
  /** 스크린리더용 카운터 설명 */
  counterLabel: string
}

export function Header({ current, total, counterLabel }: Props) {
  return (
    <header className="site-header">
      <Link to="/" className="brand">
        <span className="brand-mark" aria-hidden="true">KSL</span>
        <span className="brand-name">VISUAL ARCHIVE</span>
      </Link>
      <div className="site-header-meta">
        <span className="label muted">LEARNING PROTOTYPE</span>
        <span className="counter" aria-label={counterLabel}>
          {pad2(current)} / {pad2(total)}
        </span>
      </div>
    </header>
  )
}
