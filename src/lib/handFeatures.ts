import type { Landmark, NormalizedLandmark } from '@mediapipe/tasks-vision'

export type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky'
export type Direction = 'up' | 'down' | 'side'

export const FINGERS: FingerName[] = ['thumb', 'index', 'middle', 'ring', 'pinky']
export const FINGER_LABEL: Record<FingerName, string> = {
  thumb: '엄지',
  index: '검지',
  middle: '중지',
  ring: '약지',
  pinky: '소지',
}
export const DIRECTION_LABEL: Record<Direction, string> = { up: '위', down: '아래', side: '옆' }

/** 카메라 한 프레임에서 잡힌 손 하나 */
export interface HandFrame {
  image: NormalizedLandmark[]
  world: Landmark[]
  handedness: string
  /** video width / height — 정규화 좌표의 x 비율 보정용 */
  aspect: number
}

/** 사람이 읽을 수 있는 손 모양 특징 (규칙 채점용) */
export interface HandFeatures {
  extended: Record<FingerName, boolean>
  direction: Record<FingerName, Direction>
  thumbIndexTouch: boolean
}

// 손가락별 [MCP, PIP, DIP, TIP] 랜드마크 번호
const JOINTS: Record<FingerName, [number, number, number, number]> = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
}

type P = { x: number; y: number; z: number }
const sub = (a: P, b: P): P => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const len = (a: P) => Math.hypot(a.x, a.y, a.z)
const dist = (a: P, b: P) => len(sub(a, b))
function angleDeg(a: P, b: P): number {
  const cos = (a.x * b.x + a.y * b.y + a.z * b.z) / (len(a) * len(b) || 1)
  return (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI
}

export function extractFeatures(hand: HandFrame): HandFeatures {
  const w = hand.world
  const palm = dist(w[0], w[9]) || 1

  const extended = {} as Record<FingerName, boolean>
  const direction = {} as Record<FingerName, Direction>

  for (const f of FINGERS) {
    const [mcp, pip, dip, tip] = JOINTS[f]
    if (f === 'thumb') {
      const straight = angleDeg(sub(w[dip], w[pip]), sub(w[tip], w[dip])) < 40
      const awayFromPalm = dist(w[tip], w[5]) > 0.55 * palm && dist(w[tip], w[9]) > 0.7 * palm
      extended[f] = straight && awayFromPalm
    } else {
      const bend = angleDeg(sub(w[pip], w[mcp]), sub(w[tip], w[pip]))
      extended[f] = bend < 50 && dist(w[0], w[tip]) > dist(w[0], w[pip])
    }

    // 방향은 화면 좌표로 판단 (y는 아래로 증가)
    const a = hand.image[mcp]
    const b = hand.image[tip]
    const dx = (b.x - a.x) * hand.aspect
    const dy = b.y - a.y
    direction[f] = Math.abs(dx) > Math.abs(dy) ? 'side' : dy < 0 ? 'up' : 'down'
  }

  return {
    extended,
    direction,
    thumbIndexTouch: dist(w[4], w[8]) < 0.35 * palm,
  }
}

/**
 * 직접 녹화한 샘플과 비교하기 위한 벡터.
 * 손목 기준 이동, 손바닥 크기로 정규화, 왼손은 좌우 반전해 같은 공간에 둔다.
 * 손의 방향(위/아래/옆)은 지문자 구분에 중요하므로 회전은 정규화하지 않는다.
 */
export function toVector(hand: HandFrame): number[] {
  const pts = hand.image.map((p) => ({ x: p.x * hand.aspect, y: p.y, z: p.z * hand.aspect }))
  const origin = pts[0]
  const scale = dist(pts[0], pts[9]) || 1
  const mirror = hand.handedness === 'Left' ? -1 : 1
  const out: number[] = []
  for (let i = 1; i < pts.length; i++) {
    out.push(
      round3((mirror * (pts[i].x - origin.x)) / scale),
      round3((pts[i].y - origin.y) / scale),
      round3((pts[i].z - origin.z) / scale),
    )
  }
  return out
}

const round3 = (n: number) => Math.round(n * 1000) / 1000

/** 랜드마크 하나당 평균 거리 */
export function vectorDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i += 3) {
    sum += Math.hypot(a[i] - b[i], a[i + 1] - b[i + 1], a[i + 2] - b[i + 2])
  }
  return sum / (a.length / 3)
}
