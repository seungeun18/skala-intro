<script setup>
import UnitToggler from './components/exercise/UnitToggler.vue'
</script>

<template>
  <div class="app-container">
    <header class="sky-header">
      <div class="header-content">
        <p class="eyebrow">LIVE WEATHER NETWORK</p>
        <h1>실시간 날씨 정보 시스템</h1>
        <p class="header-description">도시별 최신 관측 데이터를 한눈에 살펴보세요.</p>
      </div>
    </header>

    <div class="dashboard-shell">
      <nav class="navigation-bar" aria-label="주요 메뉴">
        <div class="navigation-links">
          <RouterLink to="/" class="nav-item">대시보드</RouterLink>
          <RouterLink to="/weather/region/KR" class="nav-item">한국</RouterLink>
          <RouterLink to="/weather/region/JP" class="nav-item">일본</RouterLink>
          <RouterLink to="/weather/region/CN" class="nav-item">중국</RouterLink>
          <RouterLink to="/about" class="nav-item">서비스 소개</RouterLink>
        </div>
        <UnitToggler class="unit-toggler" />
      </nav>
      <main class="page-content"><RouterView /></main>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
@import '@/assets/exercise.css';

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #f4f8fc;
  font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
}
button,
input {
  font: inherit;
}
.app-container {
  min-height: 100vh;
  color: #1d344b;
}
.sky-header {
  min-height: 270px;
  display: grid;
  place-items: center;
  padding: 48px 20px 80px;
  background:
    linear-gradient(108deg, rgba(25, 74, 116, 0.87), rgba(53, 158, 195, 0.4)),
    url('https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=2000&q=85')
      center/cover;
}
.header-content {
  width: min(1120px, 100%);
  color: #fff;
  text-shadow: 0 2px 18px rgba(8, 31, 51, 0.28);
}
.eyebrow {
  margin: 0 0 10px;
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.18em;
}
.sky-header h1 {
  margin: 0;
  font-size: clamp(2.25rem, 5vw, 4.3rem);
  line-height: 1.12;
  letter-spacing: -0.055em;
}
.header-description {
  margin: 15px 0 0;
  font-size: 1.05rem;
  font-weight: 500;
}
.dashboard-shell {
  width: min(1120px, calc(100% - 32px));
  margin: -42px auto 48px;
}
.navigation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 11px 14px;
  border: 1px solid rgba(255, 255, 255, 0.82);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.93);
  box-shadow: 0 16px 38px rgba(22, 68, 101, 0.14);
  backdrop-filter: blur(12px);
}
.navigation-links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.nav-item {
  padding: 9px 12px;
  color: #52708a;
  font-size: 0.92rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 10px;
  transition:
    background 0.2s,
    color 0.2s;
}
.nav-item:hover {
  background: #edf6fb;
  color: #1976b1;
}
.nav-item.router-link-exact-active {
  color: #fff;
  background: #2187bc;
  box-shadow: 0 4px 10px rgba(33, 135, 188, 0.22);
}
.unit-toggler {
  flex: 0 0 auto;
}
.page-content {
  padding-top: 24px;
}
@media (max-width: 650px) {
  .sky-header {
    min-height: 230px;
    padding-bottom: 70px;
  }
  .dashboard-shell {
    width: min(100% - 20px, 1120px);
    margin-top: -34px;
  }
  .navigation-bar {
    align-items: stretch;
    flex-direction: column;
  }
  .navigation-links {
    justify-content: center;
  }
  .unit-toggler {
    align-self: center;
  }
  .page-content {
    padding-top: 16px;
  }
}
</style>
