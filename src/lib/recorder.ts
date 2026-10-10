/**
 * 학습자 녹화 (CLAUDE.md §6).
 * 녹화본은 메모리의 Blob URL로만 존재한다. 저장·업로드·전송하지 않는다.
 * 사용이 끝나면 호출한 쪽에서 URL.revokeObjectURL로 해제한다.
 */

export interface Recording {
  url: string
  /** 실제로 녹화한 길이(초). MediaRecorder webm은 duration이 Infinity로 보고될 수 있어 따로 잰다. */
  durationSec: number
}

const CANDIDATES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4']

function pickMimeType(): string | undefined {
  return CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t))
}

export interface RecordingSession {
  done: Promise<Recording>
  /** 녹화를 중단하고 결과를 버린다 */
  cancel: () => void
}

/** 지금 즉시 녹화를 시작해 durationMs 뒤에 멈춘다 */
export function recordFor(stream: MediaStream, durationMs: number): RecordingSession {
  const mimeType = pickMimeType()
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
  const chunks: Blob[] = []
  let cancelled = false
  let startedAt = 0
  let timer = 0

  const done = new Promise<Recording>((resolve, reject) => {
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data)
    }
    recorder.onerror = () => reject(new Error('recording failed'))
    recorder.onstop = () => {
      if (cancelled) return reject(new Error('cancelled'))
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'video/webm' })
      resolve({ url: URL.createObjectURL(blob), durationSec: (performance.now() - startedAt) / 1000 })
    }
  })

  recorder.start()
  startedAt = performance.now()
  timer = window.setTimeout(() => recorder.state !== 'inactive' && recorder.stop(), durationMs)

  return {
    done,
    cancel: () => {
      cancelled = true
      clearTimeout(timer)
      if (recorder.state !== 'inactive') recorder.stop()
    },
  }
}
