<script setup>
// ===== 도시 상세 날씨 페이지 =====
// 특정 도시의 상세 관측 정보 + 여행 가이드 + Wikivoyage 도시 정보를 보여주는 페이지
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useConfigStore } from '@/stores/configStore'

const route = useRoute()
const router = useRouter()
const configStore = useConfigStore() // 섭씨/화씨 단위 설정 전역 스토어
const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather'

// ----- 상태 값 -----
const cityData = ref(null) // OpenWeather 응답 원본 데이터
const isLoading = ref(false)
const errorMessage = ref('')
const wikiTitle = ref('') // Wikivoyage 검색용 영어 도시명

// Wikivoyage 가이드 데이터 (번역 완료 상태 포함)
const wikiGuide = ref({
  isLoading: false,
  error: '',
  overview: '',
  history: '',
  sights: [],
  url: '',
})
const isWikiModalOpen = ref(false) // Wikivoyage 전체보기 모달 오픈 여부

// 전체보기 모달 열기/닫기
const openWikiModal = () => {
  isWikiModalOpen.value = true
}
const closeWikiModal = () => {
  isWikiModalOpen.value = false
}

// ----- 단위 변환 & 표시 포맷 -----
const isFahrenheit = computed(() => configStore.unit === 'fahrenheit')
const unitSymbol = computed(() => configStore.unitSymbol ?? (isFahrenheit.value ? '°F' : '°C'))

// 섭씨 값을 현재 단위 설정에 맞춰 반올림 변환
const displayTemp = (celsius) => {
  if (celsius === undefined || celsius === null) return '–'
  return Math.round(isFahrenheit.value ? (celsius * 9) / 5 + 32 : celsius)
}

// 풍속 표시 (단위 설정에 따라 m/s ↔ mph 변환)
const windText = computed(() => {
  if (!cityData.value) return '–'
  const metersPerSecond = cityData.value.wind.speed
  return isFahrenheit.value
    ? `${(metersPerSecond * 2.237).toFixed(1)} mph`
    : `${metersPerSecond.toFixed(1)} m/s`
})

// 날씨 아이콘 이미지 URL 생성
const iconUrl = computed(() => {
  const icon = cityData.value?.weather?.[0]?.icon
  return icon ? `https://openweathermap.org/img/wn/${icon}@4x.png` : ''
})

// 도시 현지 시간대 기준으로 시:분 포맷팅 (UTC + timezone offset 적용)
const cityTime = (unix) => {
  if (!cityData.value || !unix) return '–'
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  }).format(new Date((unix + cityData.value.timezone) * 1000))
}
const observedAt = computed(() => (cityData.value ? cityTime(cityData.value.dt) : '')) // 관측 시각
const visibilityText = computed(() =>
  cityData.value?.visibility ? `${(cityData.value.visibility / 1000).toFixed(1)} km` : '–',
)

// 구글 지도에서 "도시명 tourist attractions" 검색 링크 생성
const attractionSearchUrl = computed(() => {
  if (!cityData.value) return '#'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${cityData.value.name} tourist attractions`)}`
})

// ----- 여행 가이드 자동 생성 로직 -----
// 현재 기온·날씨 상태·풍속·가시거리 기반으로 준비물/활동/주의사항 규칙 기반 추천
const travelGuide = computed(() => {
  if (!cityData.value) return { packing: [], activities: [], caution: [] }
  const { temp } = cityData.value.main
  const condition = cityData.value.weather?.[0]?.main
  const wind = cityData.value.wind.speed
  const visibility = cityData.value.visibility ?? 10000
  const packing = ['여권·결제수단·보조배터리']
  const activities = []
  const caution = ['출발 직전에 여행경보·입국 조건·현지 재난 공지를 공식 채널에서 확인하세요.']

  // 강수 여부에 따른 준비물/활동 분기
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
  // 고온 주의
  if (temp >= 28) {
    packing.push('자외선 차단제·모자·물병')
    activities.push('오전·해 질 무렵 야외 활동')
    caution.push('낮 더위에는 수분을 자주 보충하고 장시간 야외 체류를 피하세요.')
  }
  // 저온 주의
  if (temp <= 10) {
    packing.push('보온 겉옷과 겹쳐 입을 옷')
    caution.push('기온이 낮으면 체감온도와 노면 상태를 확인하세요.')
  }
  // 강풍 주의
  if (wind >= 10) {
    packing.push('바람막이')
    caution.push('강한 바람에는 해안·고지대·간판 주변 활동에 유의하세요.')
  }
  // 저시정 주의
  if (visibility < 5000)
    caution.push(
      '가시거리가 낮습니다. 차량 이동 시 속도를 줄이고 항공·선박 운항 공지를 확인하세요.',
    )
  return { packing, activities, caution }
})

// ----- Wikivoyage HTML 파싱 유틸 -----

// 공백 정리 + 지정 길이 초과 시 말줄임(…) 처리
const compactText = (text, maxLength = 340) => {
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}…` : normalized
}

// 지정한 헤딩(h2/h3) 이름과 일치하는 섹션의 본문 텍스트 추출
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

// "See/Sights/Attractions" 섹션에서 볼거리 목록 추출 (최대 4개)
// "See/Sights/Attractions" 섹션에서 소제목(카테고리) + 요약 문단을 추출
// 예: "Palaces, shrines, and walls of Joseon Dynasty — 경복궁, 창덕궁 등 조선왕조..."
// 소제목 없이 <li> 목록만 있는 문서는 항목을 그대로 사용 (fallback)
const getSightEntries = (document) => {
  const headings = [...document.querySelectorAll('h2')]
  const heading = headings.find((item) =>
    ['see', 'sights', 'attractions'].includes(item.textContent.trim().toLowerCase()),
  )
  if (!heading) return []

  const entries = []
  let node = heading.nextElementSibling
  let currentTitle = ''
  let currentParts = []

  const pushCurrent = () => {
    if (!currentTitle) return
    const summary = compactText(currentParts.join(' '), 90)
    entries.push(summary ? `${currentTitle} — ${summary}` : currentTitle)
  }

  while (node && node.tagName !== 'H2') {
    if (node.tagName === 'H3' || node.tagName === 'H4') {
      // 새 소제목(카테고리) 시작 → 이전 카테고리 내용 저장
      pushCurrent()
      currentTitle = node.textContent.trim()
      currentParts = []
    } else if (currentTitle && node.matches?.('p, ul')) {
      currentParts.push(node.textContent)
    } else if (!currentTitle && node.matches?.('li')) {
      // 소제목 없이 목록만 있는 문서 대비
      entries.push(compactText(node.textContent, 90))
    }
    node = node.nextElementSibling
  }
  pushCurrent()

  return entries.slice(0, 6)
}
// ----- 번역 -----
// 영어 텍스트 → 한국어 번역 (MyMemory 무료 API, API 키 불필요)
// 요청 실패 시 원문(영어)을 그대로 반환해 화면 공백 방지
const translateToKorean = async (text) => {
  if (!text) return text
  try {
    const { data } = await axios.get('https://api.mymemory.translated.net/get', {
      params: { q: text, langpair: 'en|ko' },
    })
    return data?.responseData?.translatedText || text
  } catch (error) {
    return text
  }
}

// ----- Wikivoyage 가이드 불러오기 -----
// 1) 영어 도시명으로 Wikivoyage 문서 검색
// 2) 문서 HTML 파싱 → 개요/역사/볼거리 추출
// 3) 추출한 텍스트 전체 한국어 번역 후 상태에 반영
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

    // 검색된 문서의 렌더링된 HTML 본문 요청
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
    // 본문 단락 중 의미 있는 길이(60자 초과)만 추출
    const paragraphs = [...document.querySelectorAll('.mw-parser-output > p')]
      .map((item) => item.textContent)
      .filter((item) => item.trim().length > 60)

    const overviewEn = compactText(paragraphs[0] ?? '') // 첫 단락 = 도시 개요
    const historyEn =
      getSectionText(document, ['history', 'understand']) || compactText(paragraphs[1] ?? '')
    const sightsEn = getSightEntries(document)
    const url = `https://en.wikivoyage.org/wiki/${encodeURIComponent(pageTitle.replaceAll(' ', '_'))}`

    // 개요/역사/볼거리 텍스트 병렬 번역
    const [overview, history, ...sights] = await Promise.all([
      translateToKorean(overviewEn),
      translateToKorean(historyEn),
      ...sightsEn.map((sight) => translateToKorean(sight)),
    ])

    wikiGuide.value = { isLoading: false, error: '', overview, history, sights, url }
  } catch (error) {
    // 검색 실패/네트워크 오류 시 안내 문구 + 원문 링크만 표시
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

// ----- 상세 날씨 데이터 로드 -----
// 한국어(화면 표시용)와 영어(Wikivoyage 검색용) 응답을 동시에 요청
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
    fetchWikivoyageGuide() // 날씨 로드 완료 후 Wikivoyage 가이드 순차 로드
  } catch (error) {
    errorMessage.value = error.response?.data?.message ?? '상세 날씨 정보를 가져오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadCityDetail)
watch(() => route.params.cityId, loadCityDetail) // URL의 도시 ID 변경 시 재조회
</script>

<template>
  <div class="detail-page">
    <button class="back-button" @click="router.back()">← 이전 화면</button>

    <p v-if="isLoading" class="notice">상세 관측 정보를 불러오는 중입니다.</p>
    <p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>

    <template v-else-if="cityData">
      <!-- 상단 히어로: 도시명, 현재 온도, 날씨 아이콘 -->
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

      <!-- 상세 관측 정보: 습도/기압/바람/가시거리/최고최저/구름량 -->
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

      <!-- 일출/일몰 시각 -->
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

      <!-- Wikivoyage 도시 가이드: 개요/역사/볼거리 (한글 번역, 카드별 더보기 모달 제공) -->
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
          <!-- 도시 개요: 5줄 초과 시 말줄임 처리, 더보기로 전체 확인 -->
          <article>
            <h3>도시 개요</h3>
            <p class="clamp-text">
              {{ wikiGuide.overview || '도시 개요가 아직 제공되지 않습니다.' }}
            </p>
            <button class="more-button" @click="openWikiModal">더보기</button>
          </article>
          <!-- 역사와 배경: 5줄 초과 시 말줄임 처리 -->
          <article>
            <h3>역사와 배경</h3>
            <p class="clamp-text">
              {{ wikiGuide.history || '역사 섹션이 아직 제공되지 않습니다.' }}
            </p>
            <button class="more-button" @click="openWikiModal">더보기</button>
          </article>
          <!-- 주요 볼거리 목록 (최대 4개) -->
          <article>
            <h3>주요 볼거리</h3>
            <ul v-if="wikiGuide.sights.length" class="clamp-list">
              <li v-for="sight in wikiGuide.sights" :key="sight">{{ sight }}</li>
            </ul>
            <p v-else>원문에서 최신 볼거리 정보를 확인해 보세요.</p>
            <button v-if="wikiGuide.sights.length" class="more-button" @click="openWikiModal">
              더보기
            </button>
          </article>
        </div>
        <p class="attribution">
          여행 콘텐츠 출처: Wikivoyage (CC BY-SA). 문서의 최신 내용은 원문에서 확인하세요.
        </p>

        <!-- Wikivoyage 전체보기 모달: body에 텔레포트해서 레이아웃 영향 없이 최상단 오버레이로 표시 -->
        <Teleport to="body">
          <div v-if="isWikiModalOpen" class="modal-overlay" @click.self="closeWikiModal">
            <div class="modal-panel">
              <div class="modal-header">
                <div>
                  <p class="travel-label">WIKIVOYAGE</p>
                  <h2>{{ cityData.name }} 도시 가이드 전체보기</h2>
                </div>
                <button class="modal-close" @click="closeWikiModal" aria-label="닫기">✕</button>
              </div>
              <div class="modal-body">
                <section>
                  <h3>도시 개요</h3>
                  <p>{{ wikiGuide.overview || '도시 개요가 아직 제공되지 않습니다.' }}</p>
                </section>
                <section>
                  <h3>역사와 배경</h3>
                  <p>{{ wikiGuide.history || '역사 섹션이 아직 제공되지 않습니다.' }}</p>
                </section>
                <section>
                  <h3>주요 볼거리</h3>
                  <ul v-if="wikiGuide.sights.length">
                    <li v-for="sight in wikiGuide.sights" :key="sight">{{ sight }}</li>
                  </ul>
                  <p v-else>원문에서 최신 볼거리 정보를 확인해 보세요.</p>
                </section>
                <a
                  v-if="wikiGuide.url"
                  class="modal-source-link"
                  :href="wikiGuide.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Wikivoyage 원문 보기 ↗</a
                >
              </div>
            </div>
          </div>
        </Teleport>
      </section>

      <!-- 여행 가이드: 실시간 날씨 조건 기반 준비물/활동/안전 추천 -->
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
          <!-- 준비물 -->
          <article>
            <span class="guide-icon">🧳</span>
            <h3>챙기면 좋은 준비물</h3>
            <ul>
              <li v-for="item in travelGuide.packing" :key="item">{{ item }}</li>
            </ul>
          </article>
          <!-- 추천 활동 -->
          <article>
            <span class="guide-icon">🗺️</span>
            <h3>오늘의 활동 제안</h3>
            <ul>
              <li v-for="item in travelGuide.activities" :key="item">{{ item }}</li>
            </ul>
          </article>
          <!-- 안전/재난 대비 + 외교부 여행경보 링크 -->
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
/* 상단 히어로 카드 */
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
/* 상세 관측 정보 카드 */
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
/* 여행 가이드 카드 */
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
/* Wikivoyage 카드 */
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
/* 카드 높이 고정 (내용 길이 달라도 균일한 레이아웃 유지) */
.wiki-grid article {
  display: flex;
  flex-direction: column;
  height: 220px;
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
/* 개요/역사 텍스트 5줄 초과 시 말줄임 처리 */
.clamp-text {
  flex: 1;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
}
/* 볼거리 목록도 카드 높이 안에서 넘치지 않게 자르기 */
.clamp-list {
  flex: 1;
  overflow: hidden;
}
/* 더보기 버튼: 클릭 시 전체보기 모달 오픈 */
.more-button {
  align-self: flex-start;
  margin-top: 10px;
  padding: 6px 12px;
  border: 1px solid #d8c6ad;
  border-radius: 20px;
  background: #fff;
  color: #9b6a2a;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
}
.more-button:hover {
  background: #f5ead9;
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
/* Wikivoyage 전체보기 모달 */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(30, 40, 50, 0.55);
}
.modal-panel {
  width: min(560px, 100%);
  max-height: 82vh;
  overflow-y: auto;
  border-radius: 20px;
  background: #fffdf9;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25);
}
.modal-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 22px 24px 16px;
  background: #fffdf9;
  border-bottom: 1px solid #eee1cf;
}
.modal-header h2 {
  margin: 0;
  color: #514234;
  font-size: 1.15rem;
}
.modal-close {
  border: 0;
  background: #f3e8d8;
  color: #6a4d32;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-weight: 800;
  cursor: pointer;
  flex-shrink: 0;
}
.modal-close:hover {
  background: #eadcc4;
}
.modal-body {
  display: grid;
  gap: 20px;
  padding: 20px 24px 26px;
}
.modal-body h3 {
  margin: 0 0 8px;
  color: #6a4d32;
  font-size: 0.98rem;
}
.modal-body p,
.modal-body ul {
  margin: 0;
  color: #786c60;
  font-size: 0.92rem;
  line-height: 1.75;
}
.modal-body ul {
  padding-left: 18px;
  display: grid;
  gap: 6px;
}
.modal-source-link {
  justify-self: start;
  color: #9b6a2a;
  font-weight: 800;
  text-decoration: none;
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
/* 태블릿/모바일 대응 */
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
  .wiki-grid article {
    height: auto;
    max-height: 260px;
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
