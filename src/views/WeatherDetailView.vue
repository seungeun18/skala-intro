<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

const cityData = ref(null)
const isLoading = ref(false)
const errorMessage = ref('')

const isFahrenheit = computed(() => configStore.unit === 'fahrenheit')
const unitSymbol = computed(() => configStore.unitSymbol ?? (isFahrenheit.value ? '°F' : '°C'))
const displayTemp = (celsius) => {
  if (celsius === undefined || celsius === null) return '–'
  return Math.round(isFahrenheit.value ? (celsius * 9) / 5 + 32 : celsius)
}
const windText = computed(() => {
  if (!cityData.value) return '–'
  const metersPerSecond = cityData.value.wind.speed
  return isFahrenheit.value
    ? `${(metersPerSecond * 2.237).toFixed(1)} mph`
    : `${metersPerSecond.toFixed(1)} m/s`
})
const iconUrl = computed(() => {
  const icon = cityData.value?.weather?.[0]?.icon
  return icon ? `https://openweathermap.org/img/wn/${icon}@4x.png` : ''
})
const cityTime = (unix) => {
  if (!cityData.value || !unix) return '–'
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date((unix + cityData.value.timezone) * 1000))
}
const observedAt = computed(() => (cityData.value ? cityTime(cityData.value.dt) : ''))
const visibilityText = computed(() =>
  cityData.value?.visibility ? `${(cityData.value.visibility / 1000).toFixed(1)} km` : '–',
)

const loadCityDetail = async () => {
  if (!API_KEY) {
    errorMessage.value = 'VITE_OPENWEATHER_API_KEY가 설정되지 않았습니다.'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  cityData.value = null
  try {
    // 메인 카드가 전달한 실제 OpenWeather 도시 ID를 그대로 사용합니다.
    const { data } = await axios.get(BASE_URL, {
      params: { id: route.params.cityId, appid: API_KEY, units: 'metric', lang: 'kr' },
    })
    cityData.value = data
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '상세 날씨 정보를 가져오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadCityDetail)
watch(() => route.params.cityId, loadCityDetail)
</script>

<template>
  <div class="detail-page">
    <button class="back-button" @click="router.back()">← 이전 화면</button>

    <p v-if="isLoading" class="notice">상세 관측 정보를 불러오는 중입니다.</p>
    <p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <template v-else-if="cityData">
      <section class="weather-hero">
        <div>
          <p class="eyebrow">{{ cityData.sys.country }} · {{ observedAt }} 기준</p>
          <h1>{{ cityData.name }}</h1>
          <p class="condition">{{ cityData.weather?.[0]?.description }}</p>
          <strong class="main-temperature"
            >{{ displayTemp(cityData.main.temp) }}<small>{{ unitSymbol }}</small></strong
          >
          <p class="feels-like">
            체감온도 {{ displayTemp(cityData.main.feels_like) }}{{ unitSymbol }}
          </p>
        </div>
        <img v-if="iconUrl" :src="iconUrl" :alt="cityData.weather?.[0]?.description" />
      </section>

      <section class="detail-card">
        <h2>상세 관측 정보</h2>
        <div class="metric-grid">
          <article>
            <span>습도</span><strong>{{ cityData.main.humidity }}%</strong>
          </article>
          <article>
            <span>기압</span><strong>{{ cityData.main.pressure }} hPa</strong>
          </article>
          <article>
            <span>바람</span><strong>{{ windText }}</strong>
          </article>
          <article>
            <span>가시거리</span><strong>{{ visibilityText }}</strong>
          </article>
          <article>
            <span>최고 / 최저</span
            ><strong
              >{{ displayTemp(cityData.main.temp_max) }}° /
              {{ displayTemp(cityData.main.temp_min) }}°</strong
            >
          </article>
          <article>
            <span>구름량</span><strong>{{ cityData.clouds.all }}%</strong>
          </article>
        </div>
      </section>

      <section class="detail-card">
        <h2>일출과 일몰</h2>
        <div class="sun-grid">
          <p>
            <span>일출</span><strong>{{ cityTime(cityData.sys.sunrise) }}</strong>
          </p>
          <p>
            <span>일몰</span><strong>{{ cityTime(cityData.sys.sunset) }}</strong>
          </p>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  display: grid;
  gap: 16px;
}
.back-button {
  justify-self: start;
  padding: 5px 2px;
  border: 0;
  background: transparent;
  color: #54738d;
  font-weight: 800;
  cursor: pointer;
}
.weather-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 260px;
  padding: 34px 40px;
  overflow: hidden;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(135deg, #277eae, #5bb9dc);
  box-shadow: 0 16px 30px rgba(31, 109, 151, 0.2);
}
.eyebrow {
  margin: 0 0 8px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  opacity: 0.82;
}
.weather-hero h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  letter-spacing: -0.05em;
}
.condition {
  margin: 6px 0 16px;
  font-weight: 600;
}
.main-temperature {
  font-size: 4rem;
  line-height: 1;
  letter-spacing: -0.08em;
}
.main-temperature small {
  font-size: 1.45rem;
  letter-spacing: 0;
}
.feels-like {
  margin: 10px 0 0;
  font-weight: 600;
  opacity: 0.9;
}
.weather-hero img {
  width: 160px;
  filter: drop-shadow(0 12px 14px rgba(16, 64, 93, 0.2));
}
.detail-card {
  padding: 24px;
  border: 1px solid #e0ecf4;
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 8px 20px rgba(24, 65, 93, 0.05);
}
.detail-card h2 {
  margin: 0 0 16px;
  color: #183851;
  font-size: 1.08rem;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.metric-grid article,
.sun-grid p {
  display: grid;
  gap: 5px;
  margin: 0;
  padding: 16px;
  border-radius: 14px;
  background: #f3f8fb;
}
.metric-grid span,
.sun-grid span {
  color: #6c8195;
  font-size: 0.82rem;
  font-weight: 700;
}
.metric-grid strong,
.sun-grid strong {
  color: #264e6c;
}
.sun-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.notice {
  margin: 0;
  padding: 42px;
  text-align: center;
  color: #638099;
}
.error {
  color: #bf3547;
}
@media (max-width: 640px) {
  .weather-hero {
    min-height: 220px;
    padding: 28px;
  }
  .weather-hero img {
    width: 110px;
  }
  .main-temperature {
    font-size: 3rem;
  }
  .metric-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .sun-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 390px) {
  .weather-hero img {
    display: none;
  }
}
</style>
