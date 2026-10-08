import type { Source } from '../lib/classifier'

const LABEL: Record<Source, string> = {
  samples: '내 샘플로 채점',
  rule: '임시 규칙 채점',
  none: '채점 불가 · 등록 필요',
}

export function SourceBadge({ source }: { source: Source }) {
  return <span className={`badge badge-${source}`}>{LABEL[source]}</span>
}
