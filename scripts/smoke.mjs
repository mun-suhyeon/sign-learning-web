// 실제 브라우저(설치된 Chrome)로 각 페이지를 열어 동작을 확인하는 스모크 테스트.
// 사용법: npm run dev 실행 후 `npm run smoke [URL]`
// 웹캠 대신 손 사진을 그린 캔버스 스트림을 카메라로 주입해 손 인식까지 확인한다.
import { readFileSync, mkdirSync } from 'node:fs'
import { chromium } from 'playwright-core'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const OUT = '.smoke'
const HAND_IMAGE = process.env.HAND_IMAGE ?? `${OUT}/hand.jpg`
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await context.newPage()

const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

await page.route('**/__hand.jpg', (r) => r.fulfill({ body: readFileSync(HAND_IMAGE), contentType: 'image/jpeg' }))
await page.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = async () => {
    const img = new Image()
    img.src = '/__hand.jpg'
    await img.decode()
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext('2d')
    const draw = () => {
      ctx.fillStyle = '#888'
      ctx.fillRect(0, 0, 640, 480)
      const s = 480 / img.height
      ctx.drawImage(img, (640 - img.width * s) / 2, 0, img.width * s, 480)
      requestAnimationFrame(draw)
    }
    draw()
    return canvas.captureStream(30)
  }
})

const results = []
async function step(name, fn) {
  try {
    await fn()
    results.push(`✅ ${name}`)
  } catch (e) {
    results.push(`❌ ${name}: ${e.message.split('\n')[0]}`)
  }
  await page.screenshot({ path: `${OUT}/${name.replace(/\W+/g, '_')}.png` })
}

await step('home', async () => {
  await page.goto(`${BASE}/#/`)
  await page.getByText('보고, 따라 하고').waitFor()
})

await step('learn', async () => {
  await page.goto(`${BASE}/#/learn`)
  await page.locator('.jamo-tile', { hasText: 'ㄴ' }).first().click()
  await page.locator('.detail-name', { hasText: '니은' }).waitFor()
  await page.getByRole('tab', { name: '기초 단어' }).click()
  await page.getByText('안녕하세요').waitFor()
})

await step('practice-hand-tracking', async () => {
  await page.goto(`${BASE}/#/practice`)
  await page.getByRole('button', { name: /순서대로/ }).click()
  await page.locator('.camera-status').waitFor({ state: 'detached', timeout: 30000 })
  // 손이 잡히면 '손이 보이지 않아요' 경고가 사라진다
  await page.waitForFunction(() => {
    const t = document.querySelector('.practice-panel')?.textContent ?? ''
    return t.includes('지금 인식된 글자') && !t.includes('손이 보이지 않아요')
  }, null, { timeout: 15000 })
})

await step('register-record', async () => {
  await page.goto(`${BASE}/#/register?letter=m`)
  await page.locator('.camera-status').waitFor({ state: 'detached', timeout: 30000 })
  await page.getByRole('button', { name: /3초 녹화하기/ }).click()
  await page.getByText(/ㅁ 샘플 \d+개를 저장했어요/).waitFor({ timeout: 12000 })
  // 샘플이 생기면 ㅁ이 채점 가능해지고, 같은 손을 ㅁ으로 인식해야 한다
  await page.locator('.recognized b', { hasText: 'ㅁ' }).waitFor({ timeout: 5000 })
})

await step('practice-sample-scoring', async () => {
  await page.goto(`${BASE}/#/practice?letter=m`)
  await page.locator('.practice-meta', { hasText: /1회 성공|[2-9]회 성공/ }).waitFor({ timeout: 20000 })
})

await step('mirror', async () => {
  await page.goto(`${BASE}/#/mirror/hello`)
  await page.locator('.camera-status').waitFor({ state: 'detached', timeout: 10000 })
  await page.getByRole('button', { name: /초 녹화/ }).click()
  await page.locator('.replay video').waitFor({ timeout: 10000 })
})

await browser.close()
console.log(results.join('\n'))
console.log(errors.length ? `\n콘솔 에러 ${errors.length}건:\n${[...new Set(errors)].join('\n')}` : '\n콘솔 에러 없음')
process.exit(results.some((r) => r.startsWith('❌')) ? 1 : 0)
