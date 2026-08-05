# 🌤️ 실시간 여행 날씨 정보 시스템

여행지의 실시간 날씨를 조회하고, 날씨 기반 여행 가이드와 Wikivoyage 도시 정보를 함께 보여주는 Vue 3 애플리케이션입니다.

이 프로젝트 하나에 **Vue 3 Composition API의 핵심 개념들이 거의 다 들어있습니다.** 아래 README는 "무엇을 만들었는가"와 "Vue의 어떤 개념으로 만들었는가"를 함께 정리했습니다.

---

## 1. 주요 기능

| 기능                        | 설명                                                             | 관련 파일                                      |
| --------------------------- | ---------------------------------------------------------------- | ---------------------------------------------- |
| 나라별 도시 날씨 조회       | 나라를 고르면 해당 나라 주요 도시들의 실시간 날씨를 한 번에 조회 | `WeatherHomeView.vue`                          |
| 지역별 날씨 (동적 라우트)   | `/weather/region/KR` 처럼 URL로 직접 특정 지역 날씨 페이지 진입  | `WeatherRegionView.vue`                        |
| 도시 상세 날씨              | 습도·기압·바람·가시거리·일출일몰 등 상세 관측 정보               | `WeatherDetailView.vue`                        |
| 날씨 기반 여행 가이드       | 기온/강수/바람 조건에 따라 준비물·활동·주의사항 자동 추천        | `WeatherDetailView.vue`                        |
| Wikivoyage 도시 가이드      | 영문 Wikivoyage 문서를 파싱 → 한국어로 자동 번역해 표시          | `WeatherDetailView.vue`                        |
| 도시 검색 & 페이지네이션    | 조회된 도시 목록을 검색어로 필터링, 페이지 단위로 표시           | `WeatherHomeView.vue`                          |
| 섭씨/화씨 단위 전환         | 전역 상태로 관리되어 모든 페이지에 동일하게 적용                 | `configStore` (Pinia)                          |
| 딥링크 & 새로고침 상태 유지 | 선택한 나라를 쿼리스트링에 반영해 새로고침해도 유지              | `WeatherHomeView.vue`                          |
| 최고/최저 기온 요약         | 조회된 도시 중 가장 덥고 추운 도시를 자동 계산해 카드로 표시     | `WeatherHomeView.vue`, `WeatherRegionView.vue` |
| Wikivoyage 전체보기 모달    | 카드에서 잘린 텍스트를 모달로 전체 확인                          | `WeatherDetailView.vue`                        |

---

## 2. 기술 스택

- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router 4** (동적 라우트, lazy loading, `scrollBehavior`)
- **Pinia** (전역 상태 관리 – 단위 설정)
- **Axios** (OpenWeather API, Wikivoyage API, 번역 API 호출)
- **DOMParser** (Wikivoyage HTML 응답 파싱)

---

## 3. 프로젝트 구조

```
src/
├── App.vue                        # 루트 컴포넌트 (헤더 + RouterView)
├── router/
│   └── index.js                   # 라우트 정의
├── stores/
│   └── configStore.js             # 단위(°C/°F) 전역 상태 (Pinia)
├── views/
│   ├── WeatherHomeView.vue        # 메인 대시보드 (나라 → 도시 흐름)
│   ├── WeatherRegionView.vue      # 지역 코드 기반 날씨 페이지
│   ├── WeatherDetailView.vue      # 도시 상세 + 여행 가이드 + Wikivoyage
│   ├── WeatherAboutView.vue       # 서비스 소개 (정적 페이지)
│   └── NotFoundView.vue           # 404 페이지
└── components/exercise/
    ├── UnitToggler.vue            # 단위 전환 스위치
    ├── BaseDashboardCard.vue      # 카드 레이아웃 wrapper (slot)
    └── WeatherCard.vue            # 도시 날씨 카드 (props + emit)
```

---

## 4. 라우팅 구조 (`router/index.js`)

```js
routes: [
  { path: '/', name: 'WeatherHome', component: WeatherHomeView },
  { path: '/about', component: () => import('../views/WeatherAboutView.vue') },
  { path: '/weather/region/:countryCode(KR|JP|CN)', component: () => import(...) },
  { path: '/weather/:cityId', component: () => import(...) },
  { path: '/:pathMatch(.*)*', component: () => import('../views/NotFoundView.vue') },
]
```

### 여기서 배울 수 있는 Vue Router 개념

- **정적 임포트 vs 지연 로딩(lazy loading)**: 홈 화면(`WeatherHomeView`)만 정적으로 import하고, 나머지는 `() => import(...)` 형태의 **동적 임포트**로 처리해 초기 번들 크기를 줄입니다. 사용자가 실제로 그 페이지에 진입할 때만 해당 청크(chunk)가 로드됩니다.
- **동적 라우트 파라미터 + 정규식 제약**: `:countryCode(KR|JP|CN)`처럼 괄호 안에 정규식을 넣어 URL 파라미터 값을 KR/JP/CN 중 하나로만 제한할 수 있습니다. 이 외의 값이 들어오면 라우트가 매칭되지 않습니다.
- **`:cityId` 같은 단순 동적 세그먼트**: `/weather/103`처럼 도시 ID를 URL에 그대로 싣고, 컴포넌트 내부에서 `route.params.cityId`로 꺼내 씁니다.
- **Catch-all 라우트**: `/:pathMatch(.*)*`는 위의 어떤 라우트에도 매칭되지 않는 모든 경로를 잡아내는 404 처리용 패턴입니다. 반드시 라우트 배열의 **맨 마지막**에 위치해야 합니다.
- **`scrollBehavior`**: 페이지 이동 시 스크롤 위치를 제어하는 훅입니다. 새 페이지로 이동하면 맨 위로, 브라우저 뒤로가기는 이전 스크롤 위치(`savedPosition`)를 복원합니다.

---

## 5. 이 프로젝트로 배우는 Vue 3 핵심 개념

### 5-1. `<script setup>` + Composition API

모든 뷰가 Options API(`data`, `methods`, `computed` 객체) 대신 **Composition API**로 작성되어 있습니다.

```js
const selectedCode = ref('JP')       // 반응형 원시값
const weatherList = ref([])          // 반응형 배열
const selectedCountry = computed(() => ...)  // 파생 상태
```

- `ref()`: 원시값이나 객체를 반응형으로 감쌉니다. 템플릿에서는 자동 언래핑되어 `selectedCode`처럼 쓰지만, 스크립트 안에서는 `.value`로 접근합니다.
- `computed()`: 의존하는 반응형 값이 바뀔 때만 재계산되는 **캐싱된 파생 값**입니다. `hottestCity`, `visibleCities`처럼 원본 데이터를 가공해서 보여줄 때 사용합니다.

### 5-2. `watch` – 반응형 값 감시

`WeatherHomeView.vue`에는 watch 활용 패턴이 4가지나 나옵니다.

```js
// ① 검색어가 바뀌면 페이지를 1로 리셋
watch(searchQuery, () => {
  cityPage.value = 1
})

// ② 필터링 결과로 전체 페이지 수가 줄면 현재 페이지 보정
watch(cityPageCount, (count) => {
  if (cityPage.value > count) cityPage.value = count
})

// ③ 선택 나라가 바뀔 때마다 URL 쿼리스트링에 반영
watch(selectedCode, (code) => router.replace({ query: { ...route.query, country: code } }))

// ④ (Detail 화면) URL의 cityId가 바뀌면 새로 데이터 조회
watch(() => route.params.cityId, loadCityDetail)
```

포인트: `route.params.cityId`처럼 **반응형 객체의 특정 프로퍼티**를 감시하려면 `watch(() => route.params.cityId, ...)`처럼 **getter 함수**로 감싸야 합니다. `route.params`를 그대로 넘기면 원하는 대로 동작하지 않습니다.

### 5-3. `onMounted` – 생명주기 훅

```js
onMounted(() => {
  const routeCountry = String(route.query.country || '').toUpperCase()
  if (COUNTRIES.some((c) => c.code === routeCountry)) selectedCode.value = routeCountry
  loadCountryWeather()
})
```

컴포넌트가 DOM에 마운트된 직후 실행됩니다. 이 프로젝트에서는 **초기 데이터 페칭**과 **URL 쿼리스트링으로부터 상태 복원(딥링크 지원)**에 사용됩니다.

### 5-4. Pinia로 전역 상태 관리 (`configStore`)

```js
const configStore = useConfigStore()
const isFahrenheit = computed(() => configStore.unit === 'fahrenheit')
```

섭씨/화씨 단위는 여러 페이지(`Home`, `Detail`)에서 동시에 알아야 하는 상태입니다. 이런 값을 컴포넌트마다 props로 계속 전달하는 대신, Pinia 스토어에 두고 어디서든 `useConfigStore()`로 꺼내 씁니다. → **"여러 컴포넌트가 공유해야 하는 상태는 store로 뺀다"**는 Vue 생태계의 대표적인 패턴입니다.

### 5-5. 컴포넌트 통신 (Props / Emit)

`WeatherRegionView.vue`에서 자식 컴포넌트 사용 예:

```html
<WeatherCard
  v-for="item in weatherList"
  :key="item.id"
  :city-item="item"
  @click-detail="router.push(`/weather/${item.id}`)"
/>
```

- **Props (부모 → 자식)**: `:city-item="item"`으로 데이터를 내려줍니다.
- **Emit (자식 → 부모)**: 카드를 클릭하면 자식이 `click-detail` 이벤트를 발생시키고, 부모가 이를 받아 라우터 이동을 처리합니다. 자식 컴포넌트는 라우팅 로직을 몰라도 되고, 부모는 카드 UI를 몰라도 되는 **관심사 분리**가 이루어집니다.

`BaseDashboardCard`는 `<slot>`을 이용한 **레이아웃 wrapper 컴포넌트** 패턴으로 보입니다 (카드 테두리/그림자 같은 공통 스타일만 제공하고, 내용은 부모가 채워 넣는 구조).

### 5-6. `Teleport` – DOM 트리 밖으로 렌더링

```html
<Teleport to="body">
  <div v-if="isWikiModalOpen" class="modal-overlay" @click.self="closeWikiModal">...</div>
</Teleport>
```

Wikivoyage 전체보기 모달을 `<body>` 최상단으로 순간이동(teleport)시킵니다. 모달이 부모 컴포넌트 안에 있으면 부모의 `overflow: hidden`이나 `z-index` 스택킹 컨텍스트에 갇힐 수 있는데, `Teleport`로 이 문제를 피하면서도 로직(`isWikiModalOpen`, 데이터)은 그대로 원래 컴포넌트에 둘 수 있습니다.

### 5-7. 비동기 데이터 페칭 패턴

**병렬 요청 + 부분 실패 허용 (`Promise.allSettled`)**

```js
const results = await Promise.allSettled(
  selectedCountry.value.cities.map((q) => axios.get(BASE_URL, { params: { q, ... } })),
)
weatherList.value = results.filter((r) => r.status === 'fulfilled').map(...)
```

도시 중 하나의 API 호출이 실패해도 나머지 도시 데이터는 정상적으로 화면에 표시됩니다.

**병렬 요청 + 전체 성공 필요 (`Promise.all`)**

```js
const [{ data }, { data: englishData }] = await Promise.all([
  axios.get(BASE_URL, { params: { id: cityId, lang: 'kr' } }),
  axios.get(BASE_URL, { params: { id: cityId, lang: 'en' } }),
])
```

상세 화면 진입 시 한국어(화면 표시용)와 영어(Wikivoyage 검색용) 데이터를 동시에 요청해 왕복 시간을 줄입니다.

**로딩/에러/데이터 3단계 상태 관리**

모든 API 호출 함수는 `isLoading`, `errorMessage`, 실제 `data` 세 가지 ref를 함께 관리하는 동일한 패턴을 따릅니다. 템플릿에서는 `v-if / v-else-if / v-else`로 이 세 상태를 분기 처리합니다.

```html
<p v-if="isLoading" class="notice">불러오는 중입니다.</p>
<p v-else-if="errorMessage" class="notice error">{{ errorMessage }}</p>
<template v-else>...실제 콘텐츠...</template>
```

### 5-8. 계산된 값으로 규칙 기반 로직 구현 (`travelGuide`)

```js
const travelGuide = computed(() => {
  if (!cityData.value) return { packing: [], activities: [], caution: [] }
  const { temp } = cityData.value.main
  const condition = cityData.value.weather?.[0]?.main
  ...
  if (condition === 'Rain' || condition === 'Drizzle') { ... }
  if (temp >= 28) { ... }
  if (temp <= 10) { ... }
  return { packing, activities, caution }
})
```

날씨 데이터가 바뀔 때마다 `computed`가 자동으로 재실행되어, "비 오면 우산", "더우면 자외선 차단제"처럼 **조건 기반 추천 리스트**를 항상 최신 상태로 유지합니다. 별도의 이벤트 핸들러나 watch 없이도 반응형으로 동작하는 것이 포인트입니다.

### 5-9. 외부 HTML 파싱 (`DOMParser`)

```js
const document = new DOMParser().parseFromString(pageResponse.data.parse.text, 'text/html')
const paragraphs = [...document.querySelectorAll('.mw-parser-output > p')]
```

Wikivoyage API가 돌려주는 HTML 문자열을 브라우저 내장 `DOMParser`로 파싱해 실제 DOM처럼 `querySelectorAll` 등을 사용합니다. Vue와 직접적인 관련은 없지만, **API 응답이 JSON이 아닌 경우 어떻게 다루는지** 보여주는 실전 예시입니다.

### 5-10. 라우터 네비게이션 함수

- `router.push('/weather/123')`: 히스토리에 새 항목을 쌓으며 이동 (뒤로가기 가능)
- `router.replace({ query: {...} })`: 현재 히스토리 항목을 교체 (뒤로가기 시 중간 상태가 남지 않음) — 나라 선택 시 쿼리스트링 갱신에 사용
- `router.back()`: 브라우저 뒤로가기와 동일

---

## 6. 참고 사항 / 다음 단계 정리 시 확인하면 좋은 부분

아래 파일들은 이번에 함께 검토하지 못했습니다. README에 컴포넌트 구조를 더 정확히 남기고 싶다면 이 파일들도 확인해서 보완하는 것을 추천합니다.

- `stores/configStore.js` — 단위 상태를 `ref`/`reactive` 중 무엇으로 관리하는지, `unitSymbol`을 getter로 두는지 등
- `components/exercise/UnitToggler.vue` — 스토어 상태를 어떻게 변경하는지 (버튼 클릭 → store 액션 호출 패턴 확인 가능)
- `components/exercise/WeatherCard.vue`, `BaseDashboardCard.vue` — props 정의(`defineProps`)와 emit 정의(`defineEmits`) 방식
- `views/NotFoundView.vue`

---

## 7. 환경 변수

```
VITE_OPENWEATHER_API_KEY=발급받은_API_키
```

`import.meta.env.VITE_OPENWEATHER_API_KEY`로 접근하며, `.env` 파일에 `VITE_` 접두사가 붙은 변수만 Vite 빌드에 노출됩니다.
