// app/composables/useData.ts
import { computed } from 'vue'
import type { Ref } from 'vue'

export function useData<T>(file: string, init: T): Ref<T> {
  const { data } = useFetch<T>(() => `/api/data?file=${encodeURIComponent(file)}`, {
    server: true,
    lazy: false,
  })
  // defaultは使わず、後段でフォールバック
  return computed(() => (data.value ?? init)) as Ref<T>
}
