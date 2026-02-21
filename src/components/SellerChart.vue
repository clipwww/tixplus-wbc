<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { Listing } from '~/types'

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{ data: Listing[] }>()

const option = computed(() => {
  const counts = new Map<number, number>()
  for (const item of props.data)
    counts.set(item.from_user_id, (counts.get(item.from_user_id) || 0) + 1)

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 次 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle',
    },
    series: [{
      type: 'pie',
      radius: ['35%', '65%'],
      center: ['58%', '50%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: {
        label: { show: true, fontWeight: 'bold' },
      },
      data: sorted.map(([id, value]) => ({ name: `#${id}`, value })),
    }],
  }
})

const stats = computed(() => {
  const counts = new Map<number, number>()
  for (const item of props.data)
    counts.set(item.from_user_id, (counts.get(item.from_user_id) || 0) + 1)
  return {
    total: counts.size,
    top: [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
  }
})
</script>

<template>
  <div>
    <VChart :option="option" style="height: 400px" autoresize />
    <div class="mt-3 text-sm text-gray-500">
      共 <span class="font-bold tabular-nums">{{ stats.total }}</span> 位賣家，
      前三名：
      <span v-for="([id, count], i) in stats.top" :key="id" class="tabular-nums">
        {{ i > 0 ? '、' : '' }}#{{ id }}（{{ count }}次）
      </span>
    </div>
  </div>
</template>
