import { ref } from 'vue'
import type { Listing } from '~/types'

const data = ref<Listing[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const fileName = ref('tixplus-wbc/data.json')

export function useData() {
  async function load(file?: string) {
    if (file)
      fileName.value = file
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`/${fileName.value}`)
      if (!res.ok)
        throw new Error(`HTTP ${res.status}`)
      data.value = await res.json()
    }
    catch (e) {
      error.value = (e as Error).message
    }
    finally {
      loading.value = false
    }
  }

  return { data, loading, error, fileName, load }
}
