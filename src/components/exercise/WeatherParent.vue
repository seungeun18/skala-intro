<template>
  <div class="weather-parent">
    <h2>🎯 과제 3: 날씨 (컴포넌트)</h2>

    <!-- 1. 도시 검색 박스 (BaseDashboardCard + SearchBar) -->
    <BaseDashboardCard title="🔍 도시 검색 (한글 즉시 동기화)">
      <SearchBar :search-query="searchQuery" @update-query="handleUpdateQuery" />
    </BaseDashboardCard>

    <!-- 2. 지역별 날씨 현황 박스 (BaseDashboardCard + WeatherCard 목록) -->
    <BaseDashboardCard title="📊 지역별 날씨 현황">
      <WeatherCard
        v-for="city in filteredCities"
        :key="city.id"
        :city="city"
        @select-card="handleSelectCard"
        @click-detail="handleClickDetail"
      />
    </BaseDashboardCard>

    <!-- 선택된 도시 결과 안내 하단 바 -->
    <div class="footer-msg">
      {{ selectedMessage }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

// 1. 모든 반응형 데이터 정의
const searchQuery = ref('')
const selectedMessage = ref('카드를 클릭하거나 검색해 보세요.')

const cities = ref([
  { id: 1, name: '서울', weather: '맑음', temp: 28, status: '더움' },
  { id: 2, name: '수원', weather: '비', temp: 24, status: '선선함' },
  { id: 3, name: '부산', weather: '구름', temp: 26, status: '더움' },
])

// 2. 검색어 필터링 계산된 속성 (Computed)
const filteredCities = computed(() => {
  if (!searchQuery.value) return cities.value
  return cities.value.filter((city) => city.name.includes(searchQuery.value))
})

// 3. 이벤트 핸들러 함수들
const handleUpdateQuery = (newQuery) => {
  searchQuery.value = newQuery
}

const handleSelectCard = (city) => {
  selectedMessage.value = `선택한 도시: ${city.name} (${city.weather}, ${city.temp}°C)`
}

const handleClickDetail = (city) => {
  alert(`${city.name}의 상세 날씨 정보입니다.\n상태: ${city.weather}\n기온: ${city.temp}°C`)
}
</script>

<style scoped>
.weather-parent {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.footer-msg {
  background-color: #e6fcf5;
  border: 1px solid rgb(158, 156, 211);
  color: #099268;
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  font-size: 0.9rem;
}
</style>
