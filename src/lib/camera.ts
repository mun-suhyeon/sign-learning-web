/**
 * 웹캠 열기 (CLAUDE.md §6).
 * 카메라는 비교용 거울일 뿐이며, 판정·분석에 쓰지 않는다. 음성은 받지 않는다.
 */

export type CameraErrorKind = 'unsupported' | 'recorder-unsupported' | 'denied' | 'not-found' | 'busy' | 'unknown'

export const CAMERA_ERROR_MESSAGE: Record<CameraErrorKind, string> = {
  unsupported: '이 브라우저에서는 카메라를 사용할 수 없어요. 최신 Chrome 또는 Safari에서 열어 주세요.',
  'recorder-unsupported': '이 브라우저는 영상 녹화를 지원하지 않아요. 최신 Chrome 또는 Safari에서 열어 주세요.',
  denied: '카메라 권한이 거부되었어요. 주소창의 카메라 권한을 허용한 뒤 다시 시도해 주세요.',
  'not-found': '연결된 카메라를 찾을 수 없어요. 카메라를 연결한 뒤 다시 시도해 주세요.',
  busy: '카메라를 시작할 수 없어요. 다른 앱이 카메라를 쓰고 있는지 확인해 주세요.',
  unknown: '카메라를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.',
}

export class CameraError extends Error {
  readonly kind: CameraErrorKind
  constructor(kind: CameraErrorKind) {
    super(CAMERA_ERROR_MESSAGE[kind])
    this.kind = kind
  }
}

export async function openCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError('unsupported')
  if (typeof MediaRecorder === 'undefined') throw new CameraError('recorder-unsupported')
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
      audio: false,
    })
  } catch (e) {
    const name = e instanceof DOMException ? e.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') throw new CameraError('denied')
    if (name === 'NotFoundError' || name === 'OverconstrainedError') throw new CameraError('not-found')
    if (name === 'NotReadableError' || name === 'AbortError') throw new CameraError('busy')
    throw new CameraError('unknown')
  }
}

export function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
}
