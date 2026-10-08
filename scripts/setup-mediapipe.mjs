// MediaPipe wasm 파일과 손 인식 모델을 public/ 아래로 준비한다.
// npm install 시 postinstall로 자동 실행된다.
import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const wasmSrc = join(root, 'node_modules/@mediapipe/tasks-vision/wasm')
const wasmDst = join(root, 'public/mediapipe/wasm')
const modelDst = join(root, 'public/mediapipe/hand_landmarker.task')
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

mkdirSync(wasmDst, { recursive: true })
cpSync(wasmSrc, wasmDst, { recursive: true })
console.log('[mediapipe] wasm 복사 완료')

if (!existsSync(modelDst)) {
  console.log('[mediapipe] 손 인식 모델 다운로드 중...')
  const res = await fetch(MODEL_URL)
  if (!res.ok) {
    console.error(`[mediapipe] 모델 다운로드 실패: ${res.status}. 나중에 npm run setup 으로 다시 시도하세요.`)
    process.exit(0)
  }
  writeFileSync(modelDst, Buffer.from(await res.arrayBuffer()))
  console.log('[mediapipe] 모델 저장 완료')
}
