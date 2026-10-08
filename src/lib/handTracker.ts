import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

let loading: Promise<HandLandmarker> | null = null

/** 손 인식 모델은 무겁기 때문에 한 번만 불러와 페이지 사이에서 재사용한다. */
export function getHandLandmarker(): Promise<HandLandmarker> {
  if (!loading) {
    loading = create().catch((err) => {
      loading = null
      throw err
    })
  }
  return loading
}

async function create(): Promise<HandLandmarker> {
  const base = import.meta.env.BASE_URL
  const fileset = await FilesetResolver.forVisionTasks(`${base}mediapipe/wasm`)
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: `${base}mediapipe/hand_landmarker.task`, delegate },
    runningMode: 'VIDEO' as const,
    numHands: 1,
    minHandDetectionConfidence: 0.6,
    minHandPresenceConfidence: 0.6,
    minTrackingConfidence: 0.5,
  })
  try {
    return await HandLandmarker.createFromOptions(fileset, options('GPU'))
  } catch {
    return HandLandmarker.createFromOptions(fileset, options('CPU'))
  }
}
