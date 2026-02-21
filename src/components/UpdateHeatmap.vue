<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { HeatmapChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { Listing } from '~/types'

use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer])

const props = defineProps<{ data: Listing[] }>()

const option = computed(() => {
  // Heatmap: x=hour(0~23), y=date, value=count
  const dateHourMap = new Map<string, number>()
  const dates = new Set<string>()
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)

  for (const item of props.data) {
    const dt = item.updated_at
    const date = dt.slice(0, 10)
    const hour = Number.parseInt(dt.slice(11, 13))
    dates.add(date)
    const key = `${date}|${hour}`
    dateHourMap.set(key, (dateHourMap.get(key) || 0) + 1)
  }

  const sortedDates = [...dates].sort()

  const heatmapData: [number, number, number][] = []
  for (let yi = 0; yi < sortedDates.length; yi++) {
    for (let xi = 0; xi < 24; xi++) {
      const key = `${sortedDates[yi]}|${xi}`
      const val = dateHourMap.get(key) || 0
      heatmapData.push([xi, yi, val])
    }
  }

  const maxVal = Math.max(...heatmapData.map(d => d[2]), 1)

  return {
    title: { text: 'updated_at 更新時間熱力圖', left: 'center' },
    tooltip: {
      formatter: (p: any) => {
        const [hour, dateIdx, count] = p.value
        return `${sortedDates[dateIdx]} ${String(hour).padStart(2, '0')}:00<br/>${count} 筆更新`
      },
    },
    xAxis: {
      type: 'category',
      data: hours,
      name: '時段',
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: sortedDates,
      name: '日期',
      splitArea: { show: true },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#f0f0f0', '#bae7ff', '#69b1ff', '#0958d9', '#002c8c'],
      },
    },
    series: [{
      type: 'heatmap',
      data: heatmapData,
      label: {
        show: true,
        formatter: (p: any) => p.value[2] || '',
        fontSize: 10,
      },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' },
      },
    }],
  }
})
</script>

<template>
  <VChart :option="option" style="height: 360px" autoresize />
</template>
