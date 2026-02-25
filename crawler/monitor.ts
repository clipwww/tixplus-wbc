import got from 'got'
import { CronJob } from 'cron'

// ── 設定 ─────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID
const TIMEZONE = 'Asia/Taipei'

const LISTINGS_URL = 'https://tradead.tixplus.jp/wbc2026/buy/bidding/listings/1517'
const CONCERTS_URL = 'https://tradead.tixplus.jp/wbc2026'

const INERTIA_HEADERS = {
  'accept': 'text/html, application/xhtml+xml',
  'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7,ja;q=0.6,zh-CN;q=0.5',
  'content-type': 'application/json',
  'sec-ch-ua': '"Not:A-Brand";v="99", "Google Chrome";v="145", "Chromium";v="145"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"macOS"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-inertia': 'true',
  'x-inertia-version': '52f9af2722878af6a3c1333e9a812f51',
  'x-requested-with': 'XMLHttpRequest',
}

// ── Telegram ─────────────────────────────────────────
async function sendTelegram(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log('[Telegram] BOT_TOKEN 未設定，僅印出訊息：')
    console.log(text)
    return
  }
  await got.post(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    json: {
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'Markdown',
    },
  })
}

async function sendError(error: unknown): Promise<void> {
  const msg = error instanceof Error ? error.message : String(error)
  const text = `n8n 檢查 WBC 讓票平台失敗\n- WBC 日本 vs 台灣票券監控\n- ${msg}`
  console.error(`[ERROR] ${msg}`)
  await sendTelegram(text).catch(() => {})
}

// ── 工具函式 ──────────────────────────────────────────
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function nowJST(): string {
  return new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Tokyo' })
}

// ── 任務 1：票券詳細頁監控（每 5 秒）────────────────────
async function checkListings(): Promise<void> {
  const response = await got(LISTINGS_URL, { headers: INERTIA_HEADERS })
  const body = response.body

  let data: any

  // 嘗試解析 JSON（Inertia 回應）
  try {
    data = JSON.parse(body)
  }
  catch {
    // fallback：從 HTML data-page 屬性解析
    const match = body.match(/data-page="([^"]*)"/)
    if (!match) {
      console.log(`[Listings] 無法解析頁面資料`)
      return
    }
    data = JSON.parse(decodeHtmlEntities(match[1]))
  }

  const props = data.props || {}
  const concert = props.concert || {}
  const concertName = concert.name || 'N/A'
  const concertDate = concert.concert_date || 'N/A'
  const concertTime = concert.start_time || 'N/A'

  const listingsData = props.listings || {}
  const tickets: any[] = listingsData.data || []

  const availableTickets = tickets.filter((ticket: any) => {
    const status = ticket.status || ''
    return status !== 'settlement_complete'
      && status !== 'cancelled'
      && ticket.is_biddable !== false
  })

  const ticketCount = availableTickets.length
  console.log(`[Listings] ${concertName} - 可用票數: ${ticketCount}`)

  if (ticketCount === 0)
    return

  const details = availableTickets.slice(0, 5).map((ticket: any, i: number) => {
    const seatType = ticket.seat_type?.name || 'N/A'
    const price: number = ticket.total_resale_price || 0
    const count = ticket.ticket_count || 1
    const buyUrl = `https://tradead.tixplus.jp/wbc2026/buy/bidding/payment-type/${ticket.id}`
    return `${i + 1}. ${seatType} - ¥${price.toLocaleString()} (x${count})\n ${buyUrl}`
  }).join('\n\n')

  const text = [
    `🎫 **有票了！快搶！**`,
    ``,
    `🏟️ ${concertName}`,
    `📅 ${concertDate} ${concertTime}`,
    `🎟️ 可用票數：**${ticketCount}** 張`,
    ``,
    details,
    ``,
    `🔗 ${LISTINGS_URL}`,
    `⏰ 檢查時間：${nowJST()}`,
  ].join('\n')

  await sendTelegram(text)
}

// ── 任務 2：比賽列表頁監控（每 1 分鐘）────────────────────
async function checkConcerts(): Promise<void> {
  const response = await got(CONCERTS_URL)
  const html = response.body

  const match = html.match(/data-page="([^"]*)"/)
  if (!match) {
    console.log(`[Concerts] 無法解析頁面資料`)
    return
  }

  const data = JSON.parse(decodeHtmlEntities(match[1]))
  const concerts: any[] = data.props?.concerts || []

  const japanConcerts = concerts.filter((c: any) => c.name?.includes('日本'))

  for (const concert of japanConcerts) {
    const ticketCount: number = concert.listings_count || 0
    console.log(`[Concerts] ${concert.name} - 在架票數: ${ticketCount}`)

    if (ticketCount === 0)
      continue

    const text = [
      `🎫 **日本隊比賽有票了！**`,
      ``,
      `📅 比賽：${concert.name}`,
      `🗓️ 日期：${concert.concert_date}`,
      `⏰ 開場：${concert.open_time} / 開賽：${concert.start_time}`,
      `🏟️ 場地：${concert.tour?.name || ''}`,
      `🎟️ 可用票數：${ticketCount} 張`,
      ``,
      `🔗 購票連結：https://tradead.tixplus.jp/wbc2026`,
    ].join('\n')

    await sendTelegram(text)
  }
}

// ── 啟動排程 ──────────────────────────────────────────
function main(): void {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN 未設定，通知將只輸出到 console')
  }

  console.log('🚀 WBC 票券監控已啟動')
  console.log(`   時區: ${TIMEZONE}`)
  console.log(`   任務 1: 票券詳細頁 - 每 5 秒 (06:00-23:59)`)
  console.log(`   任務 2: 比賽列表頁 - 每 1 分鐘 (06:00-23:59)`)
  console.log('')

  // 每 3 秒檢查票券詳細頁（6-23 時）
  const listingsJob = new CronJob(
    '*/3 * * * * *', // 每 3 秒
    async () => {
      const hour = new Date().toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false })
      const h = Number.parseInt(hour)
      if (h < 6) return // 只在 6-23 時執行

      try {
        await checkListings()
      }
      catch (err) {
        await sendError(err)
      }
    },
    null,
    true,
    TIMEZONE,
  )

  // 每 1 分鐘檢查比賽列表頁（6-23 時）
  const concertsJob = new CronJob(
    '0 * * * * *', // 每分鐘第 0 秒
    async () => {
      const hour = new Date().toLocaleString('en-US', { timeZone: TIMEZONE, hour: 'numeric', hour12: false })
      const h = Number.parseInt(hour)
      if (h < 6) return

      try {
        await checkConcerts()
      }
      catch (err) {
        await sendError(err)
      }
    },
    null,
    true,
    TIMEZONE,
  )

  listingsJob.start()
  concertsJob.start()

  // 立即執行一次
  checkListings().catch(err => sendError(err))
  checkConcerts().catch(err => sendError(err))

  sendTelegram('🚀 WBC 票券監控已啟動！').catch(() => {})
}

main()
