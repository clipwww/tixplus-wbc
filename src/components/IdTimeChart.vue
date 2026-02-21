<script setup lang="ts">
import { computed } from 'vue'
import type { Listing } from '~/types'

const props = defineProps<{ data: Listing[] }>()

const rows = computed(() => {
  return [...props.data].sort((a, b) => b.id - a.id).map((item) => {
    const seatName = item.seat_type?.name || '未知'
    return {
      id: item.id,
      createdAt: item.created_at,
      seatType: seatName,
      ticketCount: item.ticket_count,
      price: item.total_resale_price,
      status: item.status,
    }
  })
})

const stats = computed(() => {
  const ids = props.data.map(i => i.id)
  const minId = Math.min(...ids)
  const maxId = Math.max(...ids)
  const totalGap = maxId - minId + 1 - ids.length

  const batches = new Map<string, number>()
  for (const item of props.data) {
    const key = item.created_at.slice(0, 16)
    batches.set(key, (batches.get(key) || 0) + 1)
  }

  return {
    minId,
    maxId,
    count: ids.length,
    totalGap,
    batchCount: batches.size,
    avgPerBatch: (ids.length / batches.size).toFixed(1),
  }
})
</script>

<template>
  <div>
    <!-- Stats cards -->
    <div class="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
      <div class="rounded-lg bg-blue-50 p-3">
        <div class="text-blue-400">ID 範圍</div>
        <div class="text-lg font-bold tabular-nums">{{ stats.minId }} ~ {{ stats.maxId }}</div>
      </div>
      <div class="rounded-lg bg-green-50 p-3">
        <div class="text-green-400">資料筆數</div>
        <div class="text-lg font-bold tabular-nums">{{ stats.count }}</div>
      </div>
      <div class="rounded-lg bg-orange-50 p-3">
        <div class="text-orange-400">缺失 ID 數</div>
        <div class="text-lg font-bold tabular-nums">{{ stats.totalGap }}</div>
      </div>
      <div class="rounded-lg bg-purple-50 p-3">
        <div class="text-purple-400">批次數 / 平均</div>
        <div class="text-lg font-bold tabular-nums">{{ stats.batchCount }} 批 / {{ stats.avgPerBatch }} 筆</div>
      </div>
    </div>

    <!-- Table -->
    <div class="max-h-120 overflow-auto rounded-lg border border-gray-200">
      <table class="w-full text-left text-sm">
        <thead class="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2.5">ID</th>
            <th class="px-4 py-2.5">建立時間</th>
            <th class="px-4 py-2.5">座位類型</th>
            <th class="px-4 py-2.5 text-right">票數</th>
            <th class="px-4 py-2.5 text-right">總額</th>
            <th class="px-4 py-2.5">狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="row.id"
            class="border-t border-gray-100 hover:bg-gray-50"
          >
            <td class="px-4 py-2 font-mono tabular-nums">{{ row.id }}</td>
            <td class="px-4 py-2 tabular-nums">{{ row.createdAt }}</td>
            <td class="px-4 py-2">{{ row.seatType }}</td>
            <td class="px-4 py-2 text-right tabular-nums">{{ row.ticketCount }}</td>
            <td class="px-4 py-2 text-right tabular-nums">¥{{ row.price.toLocaleString() }}</td>
            <td class="px-4 py-2">
              <span class="inline-block rounded-full px-2 py-0.5 text-xs" :class="row.status === 'settlement_complete' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'">
                {{ row.status === 'settlement_complete' ? '已完成' : row.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
