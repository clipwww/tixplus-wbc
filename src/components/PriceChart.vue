<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { Listing } from '~/types'

use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer])

const props = defineProps<{ data: Listing[] }>()

const option = computed(() => {
  // Group by price ranges
  const ranges = new Map<string, number>()
  for (const item of props.data) {
    const price = item.total_resale_price
    let label: string
    if (price <= 10000)
      label = '≤1万'
    else if (price <= 15000)
      label = '1~1.5万'
    else if (price <= 20000)
      label = '1.5~2万'
    else if (price <= 30000)
      label = '2~3万'
    else
      label = '3万+'
    ranges.set(label, (ranges.get(label) || 0) + 1)
  }

  const order = ['≤1万', '1~1.5万', '1.5~2万', '2~3万', '3万+']
  const labels = order.filter(k => ranges.has(k))
  const values = labels.map(k => ranges.get(k) || 0)
  const colors = ['#73c0de', '#5470c6', '#91cc75', '#fac858', '#ee6666']

  return {
    title: { text: '交易總額分布', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].name}<br/>${p[0].value} 筆`,
    },
    xAxis: {
      type: 'category',
      data: labels,
    },
    yAxis: { type: 'value', name: '筆數' },
    series: [{
      type: 'bar',
      data: values.map((v, i) => ({
        value: v,
        itemStyle: { color: colors[i % colors.length] },
      })),
      barWidth: '60%',
    }],
  }
})

const stats = computed(() => {
  const prices = props.data.map(d => d.total_resale_price)
  const sum = prices.reduce((a, b) => a + b, 0)
  return {
    min: Math.min(...prices).toLocaleString(),
    max: Math.max(...prices).toLocaleString(),
    avg: Math.round(sum / prices.length).toLocaleString(),
    total: sum.toLocaleString(),
  }
})
</script>

<template>
  <div>
    <VChart :option="option" style="height: 400px" autoresize />
    <div class="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
      <div class="rounded-lg bg-blue-50 p-3">
        <div class="text-blue-400">最低總額</div>
        <div class="text-lg font-bold tabular-nums">¥{{ stats.min }}</div>
      </div>
      <div class="rounded-lg bg-green-50 p-3">
        <div class="text-green-400">最高總額</div>
        <div class="text-lg font-bold tabular-nums">¥{{ stats.max }}</div>
      </div>
      <div class="rounded-lg bg-orange-50 p-3">
        <div class="text-orange-400">平均總額</div>
        <div class="text-lg font-bold tabular-nums">¥{{ stats.avg }}</div>
      </div>
      <div class="rounded-lg bg-red-50 p-3">
        <div class="text-red-400">全部加總</div>
        <div class="text-lg font-bold tabular-nums">¥{{ stats.total }}</div>
      </div>
    </div>
  </div>
</template>
