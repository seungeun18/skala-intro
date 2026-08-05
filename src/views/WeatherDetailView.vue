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
const wikiTitle = ref('')
const wikiGuide = ref({
  isLoading: false,
  error: '',
  overview: '',
  history: '',
  sights: [],
  url: '',
})

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
const attractionSearchUrl = computed(() => {
  if (!cityData.value) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cityData.value.name} tourist attractions`)}`
})
const travelGuide = computed(() => {
  if (!cityData.value) return { packing: [], activities: [], caution: [] }
  const { temp } = cityData.value.main
  const condition = cityData.value.weather?.[0]?.main
  const wind = cityData.value.wind.speed
  const visibility = cityData.value.visibility ?? 10000
  const packing = ['여권·결제수단·보조배터리']
  const activities = []
  const caution = ['출발 직전에 여행경보·입국 조건·현지 재난 공지를 공식 채널에서 확인하세요.']

  if (condition === 'Rain' || condition === 'Drizzle') {
    packing.push('접이식 우산 또는 방수 재킷', '미끄럼 방지 신발')
    activities.push('박물관·미술관·시장 등 실내 명소 탐방')
  } else if (condition === 'Snow') {
    packing.push('방수 신발', '보온 장갑과 목도리')
    activities.push('실내 문화시설 또는 눈 풍경 감상')
  } else {
    packing.push('가벼운 겉옷')
    activities.push('도보 산책과 주요 관광지 탐방')
  }
  if (temp >= 28) {
    packing.push('자외선 차단제·모자·물병')
    activities.push('오전·해 질 무렵 야외 활동')
    caution.push('낮 더위에는 수분을 자주 보충하고 장시간 야외 체류를 피하세요.')
  }
  if (temp <= 10) {
    packing.push('보온 겉옷과 겹쳐 입을 옷')
    caution.push('기온이 낮으면 체감온도와 노면 상태를 확인하세요.')
  }
  if (wind >= 10) {
    packing.push('바람막이')
    caution.push('강한 바람에는 해안·고지대·간판 주변 활동에 유의하세요.')
  }
  if (visibility < 5000)
    caution.push(
      '가시거리가 낮습니다. 차량 이동 시 속도를 줄이고 항공·선박 운항 공지를 확인하세요.',
    )
  return { packing, activities, caution }
})

const compactText = (text, maxLength = 340) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized
}
const getSectionText = (document, names) => {
  const headings = [...document.querySelectorAll('h2, h3')]
  const heading = headings.find((item) => names.includes(item.textContent.trim().toLowerCase()))
  if (!heading) return ''
  const parts = []
  let node = heading.nextElementSibling
  while (node && !/^H[23]$/.test(node.tagName)) {
    if (node.matches?.('p, ul')) parts.push(node.textContent)
    node = node.nextElementSibling
  }
  return compactText(parts.join(' '))
}
const getSightNames = (document) => {
  const headings = [...document.querySelectorAll('h2, h3')]
  const heading = headings.find((item) =>
    ['see', 'sights', 'attractions'].includes(item.textContent.trim().toLowerCase()),
  )
  if (!heading) return []
  const names = []
  let node = heading.nextElementSibling
  while (node && !/^H[23]$/.test(node.tagName) && names.length < 4) {
    if (node.matches?.('li')) names.push(compactText(node.textContent, 90))
    node = node.nextElementSibling
  }
  return names
}
const fetchWikivoyageGuide = async () => {
  if (!wikiTitle.value) return
  wikiGuide.value = { isLoading: true, error: '', overview: '', history: '', sights: [], url: '' }
  try {
    // 도시명이 영어로 된 OpenWeather 응답을 사용해 영어 Wikivoyage를 검색합니다.
    const searchResponse = await axios.get('https://en.wikivoyage.org/w/api.php', {
      params: {
        action: 'query',
        list: 'search',
        srsearch: wikiTitle.value,
        srlimit: 1,
        format: 'json',
        origin: '*',
      },
    })
    const pageTitle = searchResponse.data.query?.search?.[0]?.title
    if (!pageTitle) throw new Error('Wikivoyage 문서를 찾지 못했습니다.')
    const pageResponse = await axios.get('https://en.wikivoyage.org/w/api.php', {
      params: {
        action: 'parse',
        page: pageTitle,
        prop: 'text',
        formatversion: 2,
        format: 'json',
        origin: '*',
      },
    })
    const document = new DOMParser().parseFromString(pageResponse.data.parse.text, 'text/html')
    const paragraphs = [...document.querySelectorAll('.mw-parser-output > p')]
      .map((item) => item.textContent)
      .filter((item) => item.trim().length > 60)
    wikiGuide.value = {
      isLoading: false,
      error: '',
      overview: compactText(paragraphs[0] ?? ''),
      history:
        getSectionText(document, ['history', 'understand']) || compactText(paragraphs[1] ?? ''),
      sights: getSightNames(document),
      url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(pageTitle.replaceAll(' ', '_'))}`,
    }
  } catch (error) {
    wikiGuide.value = {
      isLoading: false,
      error: '이 도시의 Wikivoyage 여행 문서를 불러오지 못했습니다.',
      overview: '',
      history: '',
      sights: [],
      url: `https://en.wikivoyage.org/wiki/${encodeURIComponent(wikiTitle.value.replaceAll(' ', '_'))}`,
    }
  }
}

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
    const [{ data }, { data: englishData }] = await Promise.all([
      axios.get(BASE_URL, {
        params: { id: route.params.cityId, appid: API_KEY, units: 'metric', lang: 'kr' },
      }),
      axios.get(BASE_URL, {
        params: { id: route.params.cityId, appid: API_KEY, units: 'metric', lang: 'en' },
      }),
    ])
    cityData.value = data
    wikiTitle.value = englishData.name
    fetchWikivoyageGuide()
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

      <section class="travel-card">
        <div class="travel-heading">
          <div>
            <p class="travel-label">TRAVEL NOTE</p>
            <h2>{{ cityData.name }} 여행 가이드</h2>
          </div>
          <a :href="attractionSearchUrl" target="_blank" rel="noopener noreferrer"
            >주변 관광지 찾기 ↗</a
          >
        </div>
        <div class="guide-grid">
          <article>
            <span class="guide-icon">🧳</span>
            <h3>챙기면 좋은 준비물</h3>
            <ul>
              <li v-for="item in travelGuide.packing" :key="item">{{ item }}</li>
            </ul>
          </article>
          <article>
            <span class="guide-icon">🗺️</span>
            <h3>오늘의 활동 제안</h3>
            <ul>
              <li v-for="item in travelGuide.activities" :key="item">{{ item }}</li>
            </ul>
          </article>
          <article>
            <span class="guide-icon">🛟</span>
            <h3>안전·재난 대비</h3>
            <ul>
              <li v-for="item in travelGuide.caution" :key="item">{{ item }}</li>
            </ul>
            <a
              class="safety-link"
              href="https://0404.go.kr/app/main/mainPage"
              target="_blank"
              rel="noopener noreferrer"
              >외교부 여행경보 확인 ↗</a
            >
          </article>
        </div>
      </section>

      <section class="wiki-card">
        <div class="wiki-heading">
          <div>
            <p class="travel-label">WIKIVOYAGE</p>
            <h2>{{ cityData.name }} 도시 가이드</h2>
          </div>
          <a v-if="wikiGuide.url" :href="wikiGuide.url" target="_blank" rel="noopener noreferrer"
            >Wikivoyage 원문 ↗</a
          >
        </div>
        <p v-if="wikiGuide.isLoading" class="wiki-notice">
          Wikivoyage 여행 정보를 불러오는 중입니다.
        </p>
        <p v-else-if="wikiGuide.error" class="wiki-notice">{{ wikiGuide.error }}</p>
        <div v-else class="wiki-grid">
          <article>
            <h3>도시 개요</h3>
            <p>{{ wikiGuide.overview || '도시 개요가 아직 제공되지 않습니다.' }}</p>
          </article>
          <article>
            <h3>역사와 배경</h3>
            <p>{{ wikiGuide.history || '역사 섹션이 아직 제공되지 않습니다.' }}</p>
          </article>
          <article>
            <h3>주요 볼거리</h3>
            <ul v-if="wikiGuide.sights.length">
              <li v-for="sight in wikiGuide.sights" :key="sight">{{ sight }}</li>
            </ul>
            <p v-else>원문에서 최신 볼거리 정보를 확인해 보세요.</p>
          </article>
        </div>
        <p class="attribution">
          여행 콘텐츠 출처: Wikivoyage (CC BY-SA). 문서의 최신 내용은 원문에서 확인하세요.
        </p>
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
.travel-card {
  padding: 24px;
  border: 1px solid #dbecef;
  border-radius: 18px;
  background: linear-gradient(135deg, #f5fcfd, #f4f8ff);
}
.travel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.travel-heading h2 {
  margin: 0;
  color: #183851;
  font-size: 1.12rem;
}
.travel-label {
  margin: 0 0 5px;
  color: #4b9abd;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.12em;
}
.travel-heading > a,
.safety-link {
  color: #1878a2;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
}
.guide-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.guide-grid article {
  padding: 17px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.86);
}
.guide-icon {
  font-size: 1.25rem;
}
.guide-grid h3 {
  margin: 8px 0;
  color: #2b5169;
  font-size: 0.94rem;
}
.guide-grid ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
  color: #647e8f;
  font-size: 0.85rem;
  line-height: 1.5;
}
.safety-link {
  display: inline-block;
  margin-top: 12px;
}
.wiki-card {
  padding: 24px;
  border: 1px solid #e6dfd5;
  border-radius: 18px;
  background: #fffdf9;
}
.wiki-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.wiki-heading h2 {
  margin: 0;
  color: #514234;
  font-size: 1.12rem;
}
.wiki-heading > a {
  color: #9b6a2a;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
}
.wiki-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.wiki-grid article {
  padding: 17px;
  border-radius: 14px;
  background: #faf6f0;
}
.wiki-grid h3 {
  margin: 0 0 8px;
  color: #6a4d32;
  font-size: 0.94rem;
}
.wiki-grid p,
.wiki-grid ul {
  margin: 0;
  color: #786c60;
  font-size: 0.85rem;
  line-height: 1.65;
}
.wiki-grid ul {
  display: grid;
  gap: 7px;
  padding-left: 17px;
}
.wiki-notice {
  margin: 0;
  padding: 18px;
  color: #897766;
  text-align: center;
}
.attribution {
  margin: 14px 0 0;
  color: #9b8c7d;
  font-size: 0.75rem;
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
  .sun-grid,
  .guide-grid,
  .wiki-grid {
    grid-template-columns: 1fr;
  }
  .travel-heading,
  .wiki-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 390px) {
  .weather-hero img {
    display: none;
  }
}
</style>
