<template>
  <div class="weather-parent">
    <h2>🎯 과제 3: 날씨 (컴포넌트 + 초성 검색 기능)</h2>

    <!-- 1. 도시 검색 박스 -->
    <BaseDashboardCard title="🔍 도시 검색 (자음/초성 검색 지원)">
      <SearchBar :search-query="searchQuery" @update-query="handleUpdateQuery" />
    </BaseDashboardCard>

    <!-- 2. 지역별 날씨 현황 박스 -->
    <BaseDashboardCard title="📊 지역별 날씨 현황">
      <WeatherCard
        v-for="city in filteredCities"
        :key="city.id"
        :city="city"
        @select-card="handleSelectCard"
        @click-detail="handleClickDetail"
      >
        <!-- Named & Scoped Slot 적용된 버튼 -->
        <template #detail="{ city: slotCity }">
          <button class="custom-detail-btn" @click.stop="handleClickDetail(slotCity)">
            🔍 {{ slotCity.name }} 정보
          </button>
        </template>
      </WeatherCard>
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
const selectedMessage = ref('카드를 클릭하거나 초성으로 검색해 보세요.')

const cities = ref([
  { id: 1, name: '서울', weather: '맑음', temp: 28, status: '더움' },
  { id: 2, name: '수원', weather: '비', temp: 24, status: '선선함' },
  { id: 3, name: '부산', weather: '구름', temp: 26, status: '더움' },
  { id: 4, name: '성남', weather: '맑음', temp: 32, status: '폭염' },
])

// 🚀 [핵심 추가] 한글 초성(자음)만 추출하는 함수
const getInitialConsonants = (text) => {
  const CHOSUNG = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ]
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 44032
    // 완성형 한글 범위(가~힣) 내에 있는 글자라면 초성 추출
    if (code >= 0 && code <= 11172) {
      result += CHOSUNG[Math.floor(code / 588)]
    } else {
      result += text[i] // 영문, 자음 등은 그대로 유지
    }
  }
  return result
}

// 2. 검색어 필터링 (첫 글자 초성 우선 검사)
const filteredCities = computed(() => {
  const query = searchQuery.value.trim()
  if (!query) return cities.value

  return cities.value.filter((city) => {
    // 1) 일반 글자 포함 검색 (예: '서울')
    const matchesName = city.name.includes(query)

    // 2) 초성 추출
    const cityChosung = getInitialConsonants(city.name)

    // 3) 초성으로 시작하는지 검사 (예: 'ㅅ' 입력 시 'ㅅㅇ', 'ㅅㄴ'으로 시작하는 것만 검색)
    const matchesChosung = cityChosung.startsWith(query)

    return matchesName || matchesChosung
  })
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

.custom-detail-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  background-color: #20c997;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  transition: background-color 0.2s;
}

.custom-detail-btn:hover {
  background-color: #12b886;
}
</style>
