import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Learn from './pages/Learn'
import Mirror from './pages/Mirror'
import Practice from './pages/Practice'
import Register from './pages/Register'

const NAV = [
  { to: '/', label: '홈', end: true },
  { to: '/learn', label: '배우기' },
  { to: '/practice', label: '지문자 연습' },
  { to: '/mirror', label: '단어 거울 연습' },
  { to: '/register', label: '기준 동작 등록' },
]

export default function App() {
  return (
    <HashRouter>
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden>✋</span> 손끝 한국수어
        </NavLink>
        <nav>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/mirror" element={<Mirror />} />
          <Route path="/mirror/:wordId" element={<Mirror />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      <footer className="footer">
        카메라 영상은 브라우저 안에서만 처리되며 어디에도 전송되지 않습니다. 공식 수어 영상:{' '}
        <a href="https://sldict.korean.go.kr" target="_blank" rel="noreferrer">
          국립국어원 한국수어사전
        </a>
      </footer>
    </HashRouter>
  )
}
