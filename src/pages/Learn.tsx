import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SourceBadge } from '../components/SourceBadge'
import { JAMO, dictionaryUrl, type Jamo } from '../data/jamo'
import { WORDS } from '../data/words'
import { describeRule, sourceFor } from '../lib/classifier'
import { MASTERED_BOX, progressStore, samplesStore, useStore } from '../lib/storage'

export default function Learn() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'words' ? 'words' : 'jamo'

  return (
    <>
      <h1>배우기</h1>
      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'jamo'} onClick={() => setParams({})}>
          지문자 (자음·모음)
        </button>
        <button role="tab" aria-selected={tab === 'words'} onClick={() => setParams({ tab: 'words' })}>
          기초 단어
        </button>
      </div>
      {tab === 'jamo' ? <JamoTab /> : <WordsTab />}
    </>
  )
}

function JamoTab() {
  const progress = useStore(progressStore)
  const samples = useStore(samplesStore)
  const [selected, setSelected] = useState<Jamo>(JAMO[0])

  const group = (kind: Jamo['kind'], title: string) => (
    <section>
      <h2>{title}</h2>
      <div className="jamo-grid">
        {JAMO.filter((j) => j.kind === kind).map((j) => {
          const mastered = (progress[j.id]?.box ?? 0) >= MASTERED_BOX
          return (
            <button
              key={j.id}
              className={`jamo-tile ${selected.id === j.id ? 'active' : ''} ${mastered ? 'mastered' : ''}`}
              onClick={() => setSelected(j)}
            >
              <span className="jamo-char">{j.char}</span>
              <span className="jamo-name">{j.name}</span>
              {mastered && <span className="jamo-check" aria-label="익힘">✓</span>}
            </button>
          )
        })}
      </div>
    </section>
  )

  const source = sourceFor(selected.id, samples)
  const p = progress[selected.id]

  return (
    <div className="learn-layout">
      <div>
        <p className="muted">
          지문자는 한글 자모를 손 모양으로 나타낸 것으로, 이름이나 사전에 없는 단어를 표현할 때 씁니다. 글자를 눌러 자세히 보세요.
        </p>
        {group('consonant', '자음 14')}
        {group('vowel', '모음 10')}
      </div>

      <aside className="detail card">
        <div className="detail-char">{selected.char}</div>
        <div className="detail-name">{selected.name}</div>
        <SourceBadge source={source} />

        <a className="btn primary block" href={dictionaryUrl(selected.char)} target="_blank" rel="noreferrer">
          공식 시연 영상 보기 ↗
        </a>
        <p className="small muted">국립국어원 한국수어사전에서 정확한 손 모양과 방향을 확인하세요.</p>

        {selected.rule && (
          <div className="rule-box">
            <h4>자동 채점 기준 (임시)</h4>
            <ul>
              {describeRule(selected.rule).map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="small muted">
              카메라 채점을 위한 근사 규칙이며 전문가 검수 전입니다. 공식 영상과 다르면 영상을 따르고, 기준 동작을 직접 등록하세요.
            </p>
          </div>
        )}

        {p && (
          <p className="small">
            연습 {p.attempts}회 · 성공 {p.correct}회 · 숙련도 {'●'.repeat(p.box)}
            {'○'.repeat(5 - p.box)}
          </p>
        )}

        <div className="row">
          {source !== 'none' && (
            <Link className="btn" to={`/practice?letter=${selected.id}`}>
              이 글자 연습
            </Link>
          )}
          <Link className="btn" to={`/register?letter=${selected.id}`}>
            기준 동작 등록
          </Link>
        </div>
      </aside>
    </div>
  )
}

function WordsTab() {
  const progress = useStore(progressStore)
  const categories = [...new Set(WORDS.map((w) => w.category))]
  return (
    <>
      <p className="muted">
        단어 수어는 손의 움직임이 중요해 자동 채점 대신 <b>거울 연습</b>으로 익힙니다. 공식 영상을 보고 내 동작을 녹화해 비교해 보세요.
      </p>
      {categories.map((c) => (
        <section key={c}>
          <h2>{c}</h2>
          <div className="word-grid">
            {WORDS.filter((w) => w.category === c).map((w) => {
              const mastered = (progress[`word:${w.id}`]?.box ?? 0) >= MASTERED_BOX
              return (
                <Link key={w.id} to={`/mirror/${w.id}`} className={`word-tile ${mastered ? 'mastered' : ''}`}>
                  {w.text}
                  {mastered && <span className="jamo-check">✓</span>}
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
