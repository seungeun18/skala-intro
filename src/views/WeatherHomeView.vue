<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'
import UnitToggler from '../components/exercise/UnitToggler.vue'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore()
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'
const PAGE_SIZE = 6

// 위치를 요청하기 위한 데이터입니다. 날씨 이름·온도·상태는 API 응답값만 사용합니다.
const COUNTRIES = [
  {
    code: 'KR',
    label: '대한민국',
    flag: '🇰🇷',
    cities: ['Seoul,KR', 'Busan,KR', 'Jeju City,KR', 'Gyeongju,KR', 'Gangneung,KR', 'Incheon,KR'],
  },
  {
    code: 'JP',
    label: '일본',
    flag: '🇯🇵',
    cities: [
      'Tokyo,JP',
      'Osaka,JP',
      'Kyoto,JP',
      'Sapporo,JP',
      'Fukuoka,JP',
      'Nagoya,JP',
      'Kobe,JP',
      'Naha,JP',
    ],
  },
  {
    code: 'TH',
    label: '태국',
    flag: '🇹🇭',
    cities: [
      'Bangkok,TH',
      'Chiang Mai,TH',
      'Phuket,TH',
      'Pattaya,TH',
      'Krabi,TH',
      'Hat Yai,TH',
      'Hua Hin,TH',
    ],
  },
  { code: 'SG', label: '싱가포르', flag: '🇸🇬', cities: ['Singapore,SG'] },
  {
    code: 'VN',
    label: '베트남',
    flag: '🇻🇳',
    cities: [
      'Hanoi,VN',
      'Ho Chi Minh City,VN',
      'Da Nang,VN',
      'Nha Trang,VN',
      'Hoi An,VN',
      'Hue,VN',
    ],
  },
  {
    code: 'TW',
    label: '대만',
    flag: '🇹🇼',
    cities: ['Taipei,TW', 'Kaohsiung,TW', 'Taichung,TW', 'Tainan,TW', 'Hualien,TW'],
  },
  {
    code: 'FR',
    label: '프랑스',
    flag: '🇫🇷',
    cities: ['Paris,FR', 'Nice,FR', 'Lyon,FR', 'Marseille,FR', 'Bordeaux,FR', 'Strasbourg,FR'],
  },
  {
    code: 'IT',
    label: '이탈리아',
    flag: '🇮🇹',
    cities: ['Rome,IT', 'Milan,IT', 'Venice,IT', 'Florence,IT', 'Naples,IT', 'Bologna,IT'],
  },
  {
    code: 'ES',
    label: '스페인',
    flag: '🇪🇸',
    cities: ['Madrid,ES', 'Barcelona,ES', 'Seville,ES', 'Valencia,ES', 'Malaga,ES', 'Palma,ES'],
  },
  {
    code: 'US',
    label: '미국',
    flag: '🇺🇸',
    cities: [
      'New York,US',
      'Los Angeles,US',
      'San Francisco,US',
      'Honolulu,US',
      'Las Vegas,US',
      'Seattle,US',
    ],
  },
  {
    code: 'AU',
    label: '호주',
    flag: '🇦🇺',
    cities: ['Sydney,AU', 'Melbourne,AU', 'Brisbane,AU', 'Perth,AU', 'Cairns,AU', 'Gold Coast,AU'],
  },
  {
    code: 'RU',
    label: '러시아',
    flag: '🇷🇺',
    cities: [
      'Moscow,RU',
      'Saint Petersburg,RU',
      'Vladivostok,RU',
      'Irkutsk,RU',
      'Kazan,RU',
      'Sochi,RU',
    ],
  },
]

const selectedCode = ref('JP')
const countryPage = ref(1)
const cityPage = ref(1)
const searchQuery = ref('')
const weatherList = ref([])
const isLoading = ref(false)
const errorMessage = ref('')

const selectedCountry = computed(
  () => COUNTRIES.find((country) => country.code === selectedCode.value) ?? COUNTRIES[0],
)
const countryPageCount = computed(() => Math.ceil(COUNTRIES.length / PAGE_SIZE))
const visibleCountries = computed(() =>
  COUNTRIES.slice((countryPage.value - 1) * PAGE_SIZE, countryPage.value * PAGE_SIZE),
)
const filteredCities = computed(() => {
  const keyword = searchQuery.value.trim().toLocaleLowerCase()
  return keyword
    ? weatherList.value.filter((city) => city.name.toLocaleLowerCase().includes(keyword))
    : weatherList.value
})
const cityPageCount = computed(() =>
  Math.max(1, Math.ceil(filteredCities.value.length / PAGE_SIZE)),
)
const visibleCities = computed(() =>
  filteredCities.value.slice((cityPage.value - 1) * PAGE_SIZE, cityPage.value * PAGE_SIZE),
)
const hottestCity = computed(() => [...weatherList.value].sort((a, b) => b.temp - a.temp)[0])
const coldestCity = computed(() => [...weatherList.value].sort((a, b) => a.temp - b.temp)[0])
const isFahrenheit = computed(() => configStore.unit === 'fahrenheit')
const unitSymbol = computed(() => configStore.unitSymbol ?? (isFahrenheit.value ? '°F' : '°C'))
const displayTemp = (temp) =>
  temp === undefined ? '–' : Math.round(isFahrenheit.value ? (temp * 9) / 5 + 32 : temp)
const iconUrl = (icon) => (icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '')

async function loadCountryWeather() {
  if (!API_KEY) {
    errorMessage.value = 'VITE_OPENWEATHER_API_KEY가 설정되지 않았습니다.'
    return
  }
  isLoading.value = true
  errorMessage.value = ''
  weatherList.value = []
  try {
    const results = await Promise.allSettled(
      selectedCountry.value.cities.map((q) =>
        axios.get(BASE_URL, { params: { q, appid: API_KEY, units: 'metric', lang: 'kr' } }),
      ),
    )
    weatherList.value = results
      .filter((item) => item.status === 'fulfilled')
      .map(({ value }) => ({
        id: String(value.data.id),
        name: value.data.name,
        temp: value.data.main.temp,
        status: value.data.weather?.[0]?.description ?? '',
        icon: value.data.weather?.[0]?.icon ?? '',
        updatedAt: value.data.dt,
      }))
    if (!weatherList.value.length) throw new Error('도시 데이터를 받지 못했습니다.')
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ?? error.message ?? '실시간 날씨 정보를 가져오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}
function selectCountry(code) {
  selectedCode.value = code
  cityPage.value = 1
  searchQuery.value = ''
  loadCountryWeather()
}
function changeCountryPage(offset) {
  countryPage.value = Math.min(countryPageCount.value, Math.max(1, countryPage.value + offset))
}
function changeCityPage(offset) {
  cityPage.value = Math.min(cityPageCount.value, Math.max(1, cityPage.value + offset))
}
function openDetail(id) {
  router.push(`/weather/${id}`)
}
watch(searchQuery, () => {
  cityPage.value = 1
})
watch(cityPageCount, (count) => {
  if (cityPage.value > count) cityPage.value = count
})
onMounted(() => {
  const routeCountry = String(route.query.country || '').toUpperCase()
  if (COUNTRIES.some((country) => country.code === routeCountry)) selectedCode.value = routeCountry
  loadCountryWeather()
})
watch(selectedCode, (code) => router.replace({ query: { ...route.query, country: code } }))
</script>

<template>
  <div class="weather-page">
    <section class="intro">
      <p class="eyebrow">TRAVEL WEATHER</p>
      <h1>여행지 날씨를 미리 살펴보세요</h1>
      <p>선택한 나라의 주요 도시 관측 정보를 실시간으로 불러옵니다.</p>
    </section>
    <section class="panel country-panel">
      <div class="section-title">
        <div>
          <p class="label">STEP 1</p>
          <h2>나라별 날씨</h2>
        </div>
        <div class="pager">
          <button :disabled="countryPage === 1" @click="changeCountryPage(-1)">‹</button
          ><span>{{ countryPage }} / {{ countryPageCount }}</span
          ><button :disabled="countryPage === countryPageCount" @click="changeCountryPage(1)">
            ›
          </button>
        </div>
      </div>
      <div class="country-grid">
        <button
          v-for="country in visibleCountries"
          :key="country.code"
          class="country-button"
          :class="{ selected: selectedCode === country.code }"
          @click="selectCountry(country.code)"
        >
          <span>{{ country.flag }}</span
          >{{ country.label }}
        </button>
      </div>
    </section>
    <section class="city-heading">
      <div>
        <p class="label">STEP 2</p>
        <h2>{{ selectedCountry.flag }} {{ selectedCountry.label }} 도시별 날씨</h2>
        <p>카드를 선택하면 상세 관측 정보를 확인할 수 있습니다.</p>
      </div>
      <button class="refresh-button" :disabled="isLoading" @click="loadCountryWeather">
        {{ isLoading ? '불러오는 중' : '새로고침' }}
      </button>
    </section>
    <section class="extreme-grid">
      <article class="extreme-card warm">
        <span>현재 가장 더운 도시</span><strong>{{ hottestCity?.name ?? '집계 중' }}</strong
        ><b>{{ displayTemp(hottestCity?.temp) }}{{ unitSymbol }}</b
        ><small>{{ hottestCity?.status }}</small>
      </article>
      <article class="extreme-card cool">
        <span>현재 가장 추운 도시</span><strong>{{ coldestCity?.name ?? '집계 중' }}</strong
        ><b>{{ displayTemp(coldestCity?.temp) }}{{ unitSymbol }}</b
        ><small>{{ coldestCity?.status }}</small>
      </article>
    </section>
    <section class="panel city-panel">
      <div class="city-tools">
        <label class="search-box"
          ><span>⌕</span><input v-model="searchQuery" placeholder="표시된 도시 검색" /></label
        ><UnitToggler />
      </div>
      <p v-if="isLoading" class="notice">실시간 날씨 정보를 불러오는 중입니다.</p>
      <p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
      <template v-else
        ><div class="city-grid">
          <button
            v-for="city in visibleCities"
            :key="city.id"
            class="city-card"
            @click="openDetail(city.id)"
          >
            <img v-if="iconUrl(city.icon)" :src="iconUrl(city.icon)" :alt="city.status" />
            <div class="city-copy">
              <span>{{ city.name }}</span
              ><small>{{ city.status }}</small>
            </div>
            <strong>{{ displayTemp(city.temp) }}{{ unitSymbol }}</strong
            ><i>상세보기 →</i>
          </button>
        </div>
        <p v-if="!visibleCities.length" class="notice">일치하는 도시가 없습니다.</p>
        <div class="pager city-pager">
          <button :disabled="cityPage === 1" @click="changeCityPage(-1)">이전</button
          ><span>{{ cityPage }} / {{ cityPageCount }}</span
          ><button :disabled="cityPage === cityPageCount" @click="changeCityPage(1)">다음</button>
        </div></template
      >
    </section>
  </div>
</template>

<style scoped>
.weather-page {
  display: grid;
  gap: 18px;
  padding-top: 20px;
}
.intro {
  padding: 20px 4px 6px;
}
.eyebrow,
.label {
  margin: 0 0 6px;
  color: #4e9bc2;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
}
.intro h1,
.city-heading h2,
.section-title h2 {
  margin: 0;
  color: #234862;
  letter-spacing: -0.05em;
}
.intro h1 {
  font-size: clamp(1.75rem, 4vw, 2.6rem);
}
.intro > p:last-child,
.city-heading > div > p:last-child {
  margin: 9px 0 0;
  color: #7890a1;
}
.panel {
  padding: 24px;
  border: 1px solid #dfebf2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(33, 69, 93, 0.05);
}
.section-title,
.city-heading,
.city-tools {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.pager {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6c8496;
  font-size: 0.86rem;
  font-weight: 700;
}
.pager button {
  min-width: 32px;
  padding: 6px 9px;
  border: 1px solid #d7e7ef;
  border-radius: 8px;
  background: #fff;
  color: #397494;
  font-weight: 800;
  cursor: pointer;
}
.pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.country-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 18px;
}
.country-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 10px;
  border: 1px solid #e0ebf1;
  border-radius: 13px;
  background: #fbfdff;
  color: #496b80;
  font-weight: 800;
  cursor: pointer;
  transition: 0.18s;
}
.country-button:hover {
  border-color: #83c8dd;
  background: #effaff;
}
.country-button.selected {
  border-color: #4ca5c8;
  background: #e6f7fc;
  color: #17739e;
  box-shadow: 0 5px 12px rgba(75, 166, 201, 0.12);
}
.country-button span {
  font-size: 1.2rem;
}
.city-heading {
  padding: 10px 4px 0;
}
.city-heading h2 {
  font-size: 1.42rem;
}
.refresh-button {
  border: 0;
  padding: 10px 14px;
  border-radius: 11px;
  background: #2687b7;
  color: #fff;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 5px 12px rgba(38, 135, 183, 0.2);
}
.refresh-button:disabled {
  opacity: 0.65;
  cursor: wait;
}
.extreme-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.extreme-card {
  display: grid;
  gap: 4px;
  padding: 20px 24px;
  border-radius: 18px;
  color: #fff;
  box-shadow: 0 12px 25px rgba(36, 76, 108, 0.11);
}
.warm {
  background: linear-gradient(125deg, #f49c7b, #eeb35c);
}
.cool {
  background: linear-gradient(125deg, #5caed8, #6885c8);
}
.extreme-card span,
.extreme-card small {
  font-size: 0.82rem;
  font-weight: 700;
  opacity: 0.9;
}
.extreme-card strong {
  font-size: 1.18rem;
}
.extreme-card b {
  font-size: 1.9rem;
  letter-spacing: -0.06em;
}
.city-panel {
  display: grid;
  gap: 20px;
}
.city-tools {
  align-items: stretch;
}
.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 410px;
  padding: 0 12px;
  border: 1px solid #dce9f0;
  border-radius: 11px;
  background: #f8fbfd;
  color: #70a1b7;
}
.search-box input {
  width: 100%;
  padding: 10px 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #26495f;
}
.city-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.city-card {
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #e2edf2;
  border-radius: 15px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition: 0.18s;
}
.city-card:hover {
  transform: translateY(-2px);
  border-color: #7cc4dd;
  box-shadow: 0 9px 18px rgba(38, 100, 132, 0.09);
}
.city-card img {
  width: 58px;
  height: 58px;
  object-fit: contain;
  background: #eff8fb;
  border-radius: 13px;
}
.city-copy {
  display: grid;
  gap: 4px;
}
.city-copy span {
  color: #254a63;
  font-weight: 800;
}
.city-copy small {
  color: #7a93a3;
}
.city-card strong {
  color: #1d82b2;
  font-size: 1.18rem;
}
.city-card i {
  grid-column: 2/4;
  color: #6b98ae;
  font-size: 0.78rem;
  font-style: normal;
  font-weight: 700;
}
.city-pager {
  justify-content: center;
}
.notice {
  margin: 0;
  padding: 30px;
  text-align: center;
  color: #6c879a;
}
.error {
  color: #bd3b4a;
}
@media (max-width: 680px) {
  .country-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .city-heading,
  .city-tools {
    align-items: stretch;
    flex-direction: column;
  }
  .refresh-button {
    align-self: flex-start;
  }
  .city-grid {
    grid-template-columns: 1fr;
  }
  .extreme-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 400px) {
  .panel {
    padding: 18px;
  }
  .country-grid {
    grid-template-columns: 1fr;
  }
  .section-title {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
