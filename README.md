# skala-vue
커스터마이징
1. 자음만 검색해도 항목이 나오도록 수정 <br>
WeatherParent.vue 파일의 filteredCities 계산 속성(computed)을 수정할 때, 초성 추출 함수    (getInitialConsonants)로 추출한 도시 이름의 초성 문자열이 사용자가 입력한 자음 검색어로 시작하는지(startsWith) 검사하여 첫 글자 자음이 일치하는 도시만 필터링하도록 변경했습니다.
2. 상세보기 버튼 튜닝하기<br>
WeatherCard.vue 파일의 기존 <button>을 부모 데이터(:city)를 전달하는 Named & Scoped Slot(name="detail")으로 감싸고, WeatherParent.vue 파일에서 <template #detail>을 사용해 클릭 이벤트(handleClickDetail)가 연결된 커스텀 민트색 버튼으로 대체했습니다.
3. filteredWeatherList 관련 로직(computed + watch)을 useWeatherSearch() Composable로 추출하여 재사용 <br>
WeatherParent.vue 파일에 화면 렌더링 코드와 검색·필터링 로직이 섞여 있던 구조를 개편하여, computed(필터링)와 watch / watchEffect(감시자) 로직을 독립된 useWeatherSearch() Composable JS 파일로 추출해 외부에서 필요한 상태값만 반환받아 사용하도록 깔끔하게 분리했습니다.

<img width="663" height="734" alt="image" src="https://github.com/user-attachments/assets/24d90b9f-4817-405a-839e-4e2151e3b263" />


This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```



