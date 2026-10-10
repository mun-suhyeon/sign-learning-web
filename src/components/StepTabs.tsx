export type Step = 'watch' | 'practice' | 'compare'

const STEPS: { id: Step; no: string; label: string; spoken: string }[] = [
  { id: 'watch', no: '01', label: 'WATCH', spoken: '보기' },
  { id: 'practice', no: '02', label: 'PRACTICE', spoken: '따라 하기' },
  { id: 'compare', no: '03', label: 'COMPARE', spoken: '비교' },
]

interface Props {
  current: Step
  /** 지금 이동할 수 있는 단계 */
  reachable: Step[]
  onSelect: (step: Step) => void
}

/** 01 WATCH / 02 PRACTICE / 03 COMPARE — 현재 단계까지 검은 선으로 채운다 */
export function StepTabs({ current, reachable, onSelect }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current)
  return (
    <nav className="step-tabs" aria-label="학습 단계">
      <ol>
        {STEPS.map((s, i) => (
          <li key={s.id} className={i <= currentIndex ? 'is-reached' : undefined}>
            <button
              type="button"
              aria-current={s.id === current ? 'step' : undefined}
              aria-label={`${s.no} ${s.spoken}`}
              disabled={!reachable.includes(s.id)}
              onClick={() => onSelect(s.id)}
            >
              <span className="step-no">{s.no}</span> {s.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
