import got from 'got'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface PaginatedResponse {
  current_page: number
  data: unknown[]
  next_page_url: string | null
  last_page: number
  total: number
}

const START_URL = 'https://tradead.tixplus.jp/wbc2026/buy/bidding/listings/more/1517?order=1'
const DELAY_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function formatTimestamp(): string {
  const now = new Date()
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')
}

async function fetchAllPages(): Promise<unknown[]> {
  const allData: unknown[] = []
  let url: string | null = START_URL
  let page = 0

  while (url) {
    page++
    console.log(`正在取得第 ${page} 頁: ${url}`)

    const response = await got(url, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).json<PaginatedResponse>()

    allData.push(...response.data)
    console.log(`  取得 ${response.data.length} 筆資料 (累計: ${allData.length}/${response.total})`)

    url = response.next_page_url
    if (url) {
      await sleep(DELAY_MS)
    }
  }

  return allData
}

async function main(): Promise<void> {
  console.log('開始爬取 WBC 2026 交易資料...\n')

  const data = await fetchAllPages()

  const outputDir = join(process.cwd(), 'output')
  await mkdir(outputDir, { recursive: true })

  const filename = `${formatTimestamp()}.json`
  const filepath = join(outputDir, filename)

  await writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`\n完成! 共 ${data.length} 筆資料，已寫入 ${filepath}`)
}

main().catch((err) => {
  console.error('爬取失敗:', err)
  process.exit(1)
})
