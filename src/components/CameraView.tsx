import { DrawingUtils, HandLandmarker } from '@mediapipe/tasks-vision'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { HandFrame } from '../lib/handFeatures'
import { getHandLandmarker } from '../lib/handTracker'

interface Props {
  /** 매 프레임 호출. 손이 없으면 null */
  onFrame?: (hand: HandFrame | null) => void
  /** false면 손 인식 없이 거울 화면만 보여 준다 */
  track?: boolean
  onStream?: (stream: MediaStream | null) => void
  children?: ReactNode
}

type Status = 'starting' | 'loading-model' | 'ready' | 'error'

export function CameraView({ onFrame, track = true, onStream, children }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onFrameRef = useRef(onFrame)
  const onStreamRef = useRef(onStream)
  const [status, setStatus] = useState<Status>('starting')
  const [error, setError] = useState('')

  useEffect(() => {
    onFrameRef.current = onFrame
    onStreamRef.current = onStream
  })

  useEffect(() => {
    let cancelled = false
    let stream: MediaStream | null = null
    let raf = 0

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 960 }, height: { ideal: 720 }, facingMode: 'user' },
          audio: false,
        })
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setError(
            e instanceof DOMException && e.name === 'NotAllowedError'
              ? '카메라 권한이 거부되었어요. 주소창의 카메라 아이콘에서 권한을 허용해 주세요.'
              : '카메라를 시작할 수 없어요. 다른 앱이 카메라를 쓰고 있는지 확인해 주세요.',
          )
        }
        return
      }
      if (cancelled) return stopStream()
      const video = videoRef.current!
      video.srcObject = stream
      await video.play().catch(() => {})
      onStreamRef.current?.(stream)

      if (!track) {
        setStatus('ready')
        return
      }

      setStatus('loading-model')
      let landmarker: HandLandmarker
      try {
        landmarker = await getHandLandmarker()
      } catch {
        if (!cancelled) {
          setStatus('error')
          setError('손 인식 모델을 불러오지 못했어요. `npm run setup` 으로 모델 파일을 받았는지 확인해 주세요.')
        }
        return
      }
      if (cancelled) return
      setStatus('ready')

      const canvas = canvasRef.current!
      const ctx = canvas.getContext('2d')!
      const drawer = new DrawingUtils(ctx)
      let lastTime = -1

      const loop = () => {
        raf = requestAnimationFrame(loop)
        if (video.readyState < 2 || video.currentTime === lastTime) return
        lastTime = video.currentTime
        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
        }
        const result = landmarker.detectForVideo(video, performance.now())
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const image = result.landmarks[0]
        if (!image) {
          onFrameRef.current?.(null)
          return
        }
        drawer.drawConnectors(image, HandLandmarker.HAND_CONNECTIONS, { color: '#5eead4', lineWidth: 4 })
        drawer.drawLandmarks(image, { color: '#0f766e', fillColor: '#ffffff', radius: 4, lineWidth: 2 })
        onFrameRef.current?.({
          image,
          world: result.worldLandmarks[0],
          handedness: result.handedness[0]?.[0]?.categoryName ?? 'Right',
          aspect: video.videoWidth / video.videoHeight,
        })
      }
      loop()
    }

    function stopStream() {
      stream?.getTracks().forEach((t) => t.stop())
    }

    start()
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      stopStream()
      onStreamRef.current?.(null)
    }
  }, [track])

  return (
    <div className="camera">
      <video ref={videoRef} playsInline muted />
      <canvas ref={canvasRef} />
      {status !== 'ready' && (
        <div className="camera-status">
          {status === 'error' ? (
            <p>{error}</p>
          ) : (
            <p>{status === 'starting' ? '카메라를 켜는 중…' : '손 인식 모델을 불러오는 중…'}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}
