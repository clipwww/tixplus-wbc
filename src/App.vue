<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useData } from '~/composables/useData'
import IdTimeChart from '~/components/IdTimeChart.vue'
import SellerChart from '~/components/SellerChart.vue'
import BuyerChart from '~/components/BuyerChart.vue'
import PriceChart from '~/components/PriceChart.vue'
import UpdateHeatmap from '~/components/UpdateHeatmap.vue'
import ExtraCharts from '~/components/ExtraCharts.vue'

const { data, loading, error, load } = useData()
const fileInput = ref<HTMLInputElement>()

onMounted(() => load())

function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      data.value = JSON.parse(reader.result as string)
    }
    catch {
      alert('JSON 格式錯誤')
    }
  }
  reader.readAsText(file)
}

const sections = [
  { id: 'id-time', label: 'ID 時間' },
  { id: 'seller', label: '賣家' },
  { id: 'buyer', label: '買家' },
  { id: 'price', label: '價格' },
  { id: 'heatmap', label: '熱力圖' },
  { id: 'extra', label: '其他' },
]

const activeSection = ref('')

function scrollTo(id: string) {
  activeSection.value = id
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="min-h-dvh bg-gray-50">
    <!-- Header -->
    <header class="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <h1 class="text-lg font-bold text-balance">
          WBC 2026 台灣 vs 日本 交易資料分析
        </h1>
        <div class="flex items-center gap-3">
          <nav class="hidden gap-1 md:flex">
            <button
              v-for="s in sections"
              :key="s.id"
              class="rounded-md px-2.5 py-1.5 text-sm transition-colors"
              :class="activeSection === s.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'"
              @click="scrollTo(s.id)"
            >
              {{ s.label }}
            </button>
          </nav>
          <button
            class="rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-100"
            @click="fileInput?.click()"
          >
            <span class="i-carbon-upload mr-1 inline-block align-middle" />
            替換資料
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".json"
            class="hidden"
            @change="onFileUpload"
          >
        </div>
      </div>
    </header>

    <!-- Loading / Error -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <span class="text-gray-400">載入中...</span>
    </div>
    <div v-else-if="error" class="flex items-center justify-center py-20">
      <span class="text-red-500">載入失敗：{{ error }}</span>
    </div>

    <!-- Content -->
    <main v-else class="mx-auto max-w-6xl space-y-8 px-4 py-6">
      <!-- Summary -->
      <div class="rounded-xl bg-white p-4 shadow-sm">
        <div class="mb-2 text-sm text-gray-400">
          總覽：共 <span class="font-bold text-gray-700 tabular-nums">{{ data.length }}</span> 筆交易記錄
        </div>
      </div>

      <!-- 1. ID + Time -->
      <section id="id-time" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">ID 與建立時間規律</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">依照 ID 降冪列出所有交易記錄，觀察 ID 遞增規律、建立時段與批次上架模式。</p>
        <IdTimeChart :data="data" />
      </section>

      <!-- 2. Seller -->
      <section id="seller" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">賣家比例分析</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">各賣家（from_user_id）出品次數佔比，觀察是否有大量賣家集中出貨。</p>
        <SellerChart :data="data" />
      </section>

      <!-- 3. Buyer -->
      <section id="buyer" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">買家比例分析</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">各買家（to_user_id）購買次數佔比，觀察是否有特定買家大量掃貨。</p>
        <BuyerChart :data="data" />
      </section>

      <!-- 4. Price -->
      <section id="price" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">交易總額分布</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">各筆交易的 total_resale_price 分段統計，了解票價集中區間與整體消費規模。</p>
        <PriceChart :data="data" />
      </section>

      <!-- 5. Heatmap -->
      <section id="heatmap" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">更新時間熱力圖</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">以日期 × 時段繪製 updated_at 熱力圖，觀察交易結算的活躍時段。</p>
        <UpdateHeatmap :data="data" />
      </section>

      <!-- 6. Extra -->
      <section id="extra" class="rounded-xl bg-white p-5 shadow-sm">
        <h2 class="text-xl font-bold text-balance">其他分析</h2>
        <p class="mb-4 text-sm text-gray-400 text-pretty">座位類型分布、每筆交易票數、以及從建立到結算的成交速度分析。</p>
        <ExtraCharts :data="data" />
      </section>
    </main>
  </div>
</template>
