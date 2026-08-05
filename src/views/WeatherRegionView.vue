<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import BaseDashboardCard from '../components/exercise/BaseDashboardCard.vue'
import WeatherCard from '../components/exercise/WeatherCard.vue'

const route = useRoute()
const router = useRouter()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const REGION_QUERIES = {
  KR: [
    'Seoul,KR',
    'Suwon,KR',
    'Busan,KR',
    'Yangsan,KR',
    'Incheon,KR',
    'Daegu,KR',
    'Daejeon,KR',
    'Gwangju,KR',
  ],
  JP: [
    'Tokyo,JP',
    'Osaka,JP',
    'Kyoto,JP',
    'Yokohama,JP',
    'Sapporo,JP',
    'Fukuoka,JP',
    'Nagoya,JP',
    'Kobe,JP',
  ],
  CN: [
    'Beijing,CN',
    'Shanghai,CN',
    'Guangzhou,CN',
    'Shenzhen,CN',
    'Chengdu,CN',
    'Wuhan,CN',
    'Hangzhou,CN',
    'Xi’an,CN',
  ],
}
const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const countryCode = computed(() => String(route.params.countryCode || '').toUpperCase())
const countryLabel = computed(
  () => ({ KR: '한국', JP: '일본', CN: '중국' })[countryCode.value] ?? countryCode.value,
)
const hottestCity = computed(() => [...weatherList.value].sort((a, b) => b.temp - a.temp)[0])
const coldestCity = computed(() => [...weatherList.value].sort((a, b) => a.temp - b.temp)[0])
const text = (city) => (city ? `${city.name} · ${Math.round(city.temp)}°C` : '집계 중')
async function loadRegion() {
  const locations = REGION_QUERIES[countryCode.value]
  if (!locations) return router.replace('/')
  if (!API_KEY) {
    errorMessage.value = 'VITE_OPENWEATHER_API_KEY가 설정되지 않았습니다.'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  try {
    const results = await Promise.all(
      locations.map((q) =>
        axios.get(BASE_URL, { params: { q, appid: API_KEY, units: 'metric', lang: 'kr' } }),
      ),
    )
    weatherList.value = results.map(({ data }) => ({
      id: String(data.id),
      name: data.name,
      temp: data.main.temp,
      status: data.weather?.[0]?.description ?? '',
      icon: data.weather?.[0]?.icon ?? '',
    }))
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '실시간 날씨 정보를 가져오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}
onMounted(loadRegion)
watch(countryCode, loadRegion)
</script>

<template>
  <div class="weather-page">
    <section class="page-heading">
      <div>
        <p class="kicker">COUNTRY WEATHER</p>
        <h2>{{ countryLabel }} 지역별 날씨</h2>
        <p>불러온 도시의 최신 관측값입니다.</p>
      </div>
      <button :disabled="isLoading" @click="loadRegion">
        {{ isLoading ? '불러오는 중' : '새로고침' }}
      </button>
    </section>
    <section class="summary">
      <div>
        <span>현재 가장 더운 도시</span><strong>{{ text(hottestCity) }}</strong>
      </div>
      <div>
        <span>현재 가장 추운 도시</span><strong>{{ text(coldestCity) }}</strong>
      </div>
    </section>
    <BaseDashboardCard
      ><p v-if="isLoading" class="notice">실시간 데이터를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <div v-else class="city-list">
        <WeatherCard
          v-for="item in weatherList"
          :key="item.id"
          :city-item="item"
          @click-detail="router.push(`/weather/${item.id}`)"
        /></div
    ></BaseDashboardCard>
  </div>
</template>

<style scoped>
.weather-page {
  display: grid;
  gap: 16px;
}
.page-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.kicker {
  margin: 0 0 6px;
  color: #2c88bc;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.page-heading h2 {
  margin: 0;
  color: #183851;
  letter-spacing: -0.035em;
}
.page-heading p:not(.kicker) {
  margin: 6px 0 0;
  color: #6c8195;
}
.page-heading button {
  border: 0;
  padding: 10px 14px;
  border-radius: 11px;
  background: #2187bc;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
}
.summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.summary div {
  display: grid;
  gap: 5px;
  padding: 17px 20px;
  border: 1px solid #dcecf5;
  border-radius: 16px;
  background: #fff;
}
.summary span {
  color: #668095;
  font-size: 0.8rem;
  font-weight: 700;
}
.summary strong {
  color: #244b67;
}
.city-list {
  display: grid;
  gap: 10px;
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
@media (max-width: 640px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .summary {
    grid-template-columns: 1fr;
  }
}
</style>
