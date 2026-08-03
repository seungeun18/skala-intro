import { ref, computed, watch, watchEffect } from 'vue'

export function useWeatherSearch(initialList) {
  // 반응형 상태
  const weatherList = ref(initialList)
  const searchQuery = ref('')
  const selectedCityInfo = ref('')

  // 1. computed를 이용한 필터링 로직
  const filteredWeatherList = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()
    if (!query) return weatherList.value
    return weatherList.value.filter((city) => city.name.toLowerCase().includes(query))
  })

  // 2. watch / watchEffect 감시자 로직
  watch(selectedCityInfo, (newVal) => {
    console.log(`[watch 감지] 상태 바 문구가 업데이트되었습니다: ${newVal}`)
  })

  watchEffect(() => {
    console.log(
      `[watchEffect 자동 호출] 현재 검색어 '${searchQuery.value}'에 매칭된 도시 수: ${filteredWeatherList.value.length}`,
    )
  })

  // 외부(컴포넌트)에서 필요한 값과 함수만 리턴!
  return {
    weatherList,
    searchQuery,
    selectedCityInfo,
    filteredWeatherList,
  }
}
