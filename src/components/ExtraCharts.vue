<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { Listing } from '~/types'

use([PieChart, BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{ data: Listing[] }>()

const seatOption = computed(() => {
  const counts = new Map<string, number>()
  for (const item of props.data) {
    const name = item.seat_type?.name || '未知'
    counts.set(name, (counts.get(name) || 0) + 1)
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])

  return {
    title: { text: '座位類型分布', left: 'center' },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} 筆 ({d}%)',
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
      data: sorted.map(([name, value]) => ({ name, value })),
    }],
  }
})

const ticketCountOption = computed(() => {
  const counts = new Map<number, number>()
  for (const item of props.data)
    counts.set(item.ticket_count, (counts.get(item.ticket_count) || 0) + 1)

  const sorted = [...counts.entries()].sort((a, b) => a[0] - b[0])

  return {
    title: { text: '每筆交易票數分布', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].name} 張票<br/>${p[0].value} 筆交易`,
    },
    xAxis: {
      type: 'category',
      data: sorted.map(([c]) => `${c}張`),
      name: '票數',
    },
    yAxis: { type: 'value', name: '交易筆數' },
    series: [{
      type: 'bar',
      data: sorted.map(([, count]) => count),
      itemStyle: { color: '#fac858' },
      barWidth: '50%',
    }],
  }
})

const speedOption = computed(() => {
  // Calculate time from created_at to updated_at (settlement speed)
  const speeds: { id: number, minutes: number, seatType: string }[] = []
  for (const item of props.data) {
    const created = new Date(item.created_at.replace(' ', 'T') + '+09:00')
    const updated = new Date(item.updated_at.replace(' ', 'T') + '+09:00')
    const minutes = Math.round((updated.getTime() - created.getTime()) / 60000)
    if (minutes >= 0) {
      speeds.push({ id: item.id, minutes, seatType: item.seat_type?.name || '未知' })
    }
  }

  const ranges = new Map<string, number>()
  for (const s of speeds) {
    let label: string
    if (s.minutes <= 1)
      label = '≤1分'
    else if (s.minutes <= 5)
      label = '1~5分'
    else if (s.minutes <= 15)
      label = '5~15分'
    else if (s.minutes <= 30)
      label = '15~30分'
    else if (s.minutes <= 60)
      label = '30~60分'
    else
      label = '60分+'
    ranges.set(label, (ranges.get(label) || 0) + 1)
  }

  const order = ['≤1分', '1~5分', '5~15分', '15~30分', '30~60分', '60分+']
  const labels = order.filter(k => ranges.has(k))
  const values = labels.map(k => ranges.get(k) || 0)

  return {
    title: { text: '成交速度（建立→最後更新）', left: 'center' },
    tooltip: {
      trigger: 'axis',
      formatter: (p: any) => `${p[0].name}<br/>${p[0].value} 筆`,
    },
    xAxis: { type: 'category', data: labels },
    yAxis: { type: 'value', name: '筆數' },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: {
        color: (p: any) => {
          const colors = ['#91cc75', '#73c0de', '#5470c6', '#fac858', '#ee6666', '#ea7ccc']
          return colors[p.dataIndex % colors.length]
        },
      },
      barWidth: '50%',
    }],
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <VChart :option="seatOption" style="height: 350px" autoresize />
      <VChart :option="ticketCountOption" style="height: 350px" autoresize />
    </div>
    <VChart :option="speedOption" style="height: 350px" autoresize />
  </div>
</template>
