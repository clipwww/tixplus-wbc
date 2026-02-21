# WBC 2026 台灣 vs 日本 — 交易資料爬蟲與分析

爬取 [tixplus.jp](https://tradead.tixplus.jp/) WBC 2026 台灣 vs 日本場次的轉售交易資料，並以互動式圖表進行視覺化分析。

> **線上預覽：** <https://clipwww.github.io/tixplus-wbc/>

## 功能

### 爬蟲 (`crawler/`)

- 分頁爬取 tixplus 轉售交易 API
- 每頁間隔 500ms 避免過度請求
- 輸出以時間戳命名的 JSON 檔至 `output/`

### 分析儀表板 (`src/`)

- **ID 與建立時間列表** — 依序列出所有交易紀錄，觀察批次上架模式
- **賣家 / 買家比例** — 圓餅圖呈現集中度
- **交易總額分布** — 價格區間長條圖與統計摘要
- **更新時間熱力圖** — 日期 × 時段的結算活躍度
- **其他分析** — 座位類型、票數、成交速度
- 支援拖曳上傳 JSON 替換資料來源

## 技術棧

| 用途 | 技術 |
|---|---|
| 執行環境 | [Bun](https://bun.sh/) |
| 爬蟲 HTTP | [got](https://github.com/sindresorhus/got) |
| 爬蟲打包 | [tsdown](https://github.com/nicepkg/tsdown) |
| 前端框架 | [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/) |
| 圖表 | [ECharts](https://echarts.apache.org/) + [vue-echarts](https://github.com/ecomfe/vue-echarts) |
| CSS | [UnoCSS](https://unocss.dev/) |
| 部署 | GitHub Pages + GitHub Actions |

## 快速開始

```bash
# 安裝相依套件
bun install
```

### 啟動開發伺服器

```bash
bun run dev
```

### 執行爬蟲

```bash
bun run crawl
```

爬取結果會輸出至 `output/<timestamp>.json`，可複製到 `public/data.json` 供儀表板使用。

### 建構

```bash
# 建構網站
bun run build

# 建構爬蟲
bun run build:crawler
```

## 專案結構

```
├── crawler/            # 爬蟲程式碼
│   └── index.ts
├── src/                # Vue 分析儀表板
│   ├── components/     # 圖表元件
│   ├── composables/    # 組合式函式
│   ├── App.vue
│   ├── main.ts
│   └── types.ts
├── public/
│   └── data.json       # 爬蟲輸出的交易資料
├── vite.config.ts
├── uno.config.ts
├── tsdown.config.ts
└── .github/workflows/  # GitHub Pages 自動部署
```

## 部署

推送至 `main` 分支後，GitHub Actions 會自動建構並部署至 GitHub Pages。

## License

MIT
