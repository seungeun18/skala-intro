<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import SearchBar from '../components/exercise/SearchBar.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'

const route = useRoute()
const router = useRouter()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const DASHBOARD_LOCATIONS = [
  'Seoul,KR',
  'Suwon,KR',
  'Busan,KR',
  'Yangsan,KR',
  'Tokyo,JP',
  'Osaka,JP',
  'Beijing,CN',
  'Shanghai,CN',
]

const weatherList = ref([])
const searchQuery = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const toCity = (data) => ({
  id: String(data.id),
  name: data.name,
  temp: data.main.temp,
  status: data.weather?.[0]?.description ?? '',
  icon: data.weather?.[0]?.icon ?? '',
  country: data.sys.country,
})
const filteredWeatherList = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase()
  return keyword
    ? weatherList.value.filter((city) => city.name.toLocaleLowerCase().includes(keyword))
    : weatherList.value
})
const hottestCity = computed(() => [...weatherList.value].sort((a, b) => b.temp - a.temp)[0])
const coldestCity = computed(() => [...weatherList.value].sort((a, b) => a.temp - b.temp)[0])
const degree = (city) => (city ? `${Math.round(city.temp)}°` : '–')

async function loadWeather() {
  if (!API_KEY) {
    errorMessage.value = 'VITE_OPENWEATHER_API_KEY가 설정되지 않았습니다.'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const settled = await Promise.allSettled(
      DASHBOARD_LOCATIONS.map((q) =>
        axios.get(BASE_URL, { params: { q, appid: API_KEY, units: 'metric', lang: 'kr' } }),
      ),
    )
    weatherList.value = settled
      .filter((result) => result.status === 'fulfilled')
      .map((result) => toCity(result.value.data))
    if (!weatherList.value.length) throw new Error('도시 데이터를 받지 못했습니다.')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? error.message ?? '실시간 날씨 정보를 가져오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}
function openDetail(id) {
  router.push(`/weather/${id}`)
}
onMounted(() => {
  searchQuery.value = typeof route.query.search === 'string' ? route.query.search : ''
  loadWeather()
})
watch(searchQuery, (value) =>
  router.replace({ path: route.path, query: value ? { search: value } : {} }),
)
</script>

<template>
  <div class="weather-page">
    <section class="page-heading">
      <div>
        <p class="kicker">TODAY'S SNAPSHOT</p>
        <h2>지금, 날씨가 궁금한 도시</h2>
        <p>현재 온도는 실시간 API 응답을 기준으로 정렬됩니다.</p>
      </div>
      <button class="refresh-button" :disabled="isLoading" @click="loadWeather">
        {{ isLoading ? '불러오는 중' : '새로고침' }}
      </button>
    </section>
    <section class="extreme-grid" aria-label="최고 및 최저 온도">
      <article class="extreme-card warm">
        <span class="extreme-label">현재 가장 더운 도시</span
        ><strong>{{ hottestCity?.name ?? '집계 중' }}</strong
        ><b>{{ degree(hottestCity) }}C</b><small>{{ hottestCity?.status ?? '' }}</small>
      </article>
      <article class="extreme-card cool">
        <span class="extreme-label">현재 가장 추운 도시</span
        ><strong>{{ coldestCity?.name ?? '집계 중' }}</strong
        ><b>{{ degree(coldestCity) }}C</b><small>{{ coldestCity?.status ?? '' }}</small>
      </article>
    </section>
    <BaseDashboardCard
      ><div class="search-section">
        <div>
          <h3>도시별 날씨</h3>
          <p>도시 카드를 눌러 상세 관측 정보를 확인하세요.</p>
        </div>
        <SearchBar
          :current-query="searchQuery"
          @update-query="(value) => (searchQuery = value)"
        /></div
    ></BaseDashboardCard>
    <BaseDashboardCard
      ><p v-if="isLoading" class="notice">최신 관측 데이터를 정리하고 있어요.</p>
      <p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <div v-else class="city-list">
        <WeatherCard
          v-for="item in filteredWeatherList"
          :key="item.id"
          :city-item="item"
          @click-detail="openDetail(item.id)"
        />
        <p v-if="!filteredWeatherList.length" class="notice">
          검색 조건과 일치하는 도시가 없습니다.
        </p>
      </div></BaseDashboardCard
    >
  </div>
</template>

<style scoped>
.weather-page {
  display: grid;
  gap: 16px;
}
.page-heading,
.search-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.kicker {
  margin: 0 0 6px;
  color: #2c88bc;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.page-heading h2,
.search-section h3 {
  margin: 0;
  color: #183851;
  letter-spacing: -0.035em;
}
.page-heading h2 {
  font-size: clamp(1.5rem, 3vw, 2rem);
}
.page-heading p:not(.kicker),
.search-section p {
  margin: 6px 0 0;
  color: #6c8195;
  font-size: 0.92rem;
}
.refresh-button {
  flex: 0 0 auto;
  border: 0;
  padding: 10px 14px;
  border-radius: 11px;
  color: #fff;
  background: #2187bc;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(33, 135, 188, 0.2);
}
.refresh-button:disabled {
  opacity: 0.65;
  cursor: wait;
}
.extreme-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.extreme-card {
  min-height: 160px;
  display: grid;
  align-content: center;
  gap: 4px;
  padding: 24px;
  border-radius: 20px;
  color: #fff;
  overflow: hidden;
  position: relative;
  box-shadow: 0 14px 28px rgba(23, 58, 85, 0.12);
}
.extreme-card::after {
  content: '';
  position: absolute;
  width: 160px;
  aspect-ratio: 1;
  top: -74px;
  right: -45px;
  border: 20px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
}
.warm {
  background: linear-gradient(135deg, #fa9670, #f3b253);
}
.cool {
  background: linear-gradient(135deg, #5db2df, #5a86ce);
}
.extreme-label {
  font-size: 0.85rem;
  font-weight: 700;
  opacity: 0.9;
}
.extreme-card strong {
  font-size: 1.45rem;
}
.extreme-card b {
  font-size: 2.2rem;
  letter-spacing: -0.06em;
}
.extreme-card small {
  font-weight: 600;
  opacity: 0.9;
}
.notice {
  margin: 0;
  padding: 30px;
  text-align: center;
  color: #638099;
}
.error {
  color: #bf3547;
}
.city-list {
  display: grid;
  gap: 10px;
}
@media (max-width: 640px) {
  .page-heading,
  .search-section {
    align-items: stretch;
    flex-direction: column;
  }
  .refresh-button {
    align-self: flex-start;
  }
  .extreme-grid {
    grid-template-columns: 1fr;
  }
  .extreme-card {
    min-height: 145px;
  }
}
</style>
