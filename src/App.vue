<template>
  <div class="app-container">
    <!-- 상단 헤더: 브랜드 로고 + 주요 메뉴 -->
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">☁</span>
        <span>실시간 날씨 정보 시스템</span>
      </RouterLink>
      <nav aria-label="주요 메뉴">
        <RouterLink to="/" class="nav-item">대시보드</RouterLink>
        <RouterLink to="/about" class="nav-item">서비스 소개</RouterLink>
      </nav>
    </header>
    <!-- 라우터로 매칭된 페이지 컴포넌트가 렌더링되는 영역 -->
    <main class="page-content"><RouterView /></main>
  </div>
</template>

<style>
/* 폰트 & 공통 스타일시트 로드 */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700;800&display=swap');
@import '@/assets/exercise.css';

* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #f6f9fc;
  font-family: 'DM Sans', 'Noto Sans KR', sans-serif;
}
button,
input {
  font: inherit;
}
.app-container {
  min-height: 100vh;
  color: #213f57;
}
/* 상단 헤더 레이아웃 */
.app-header {
  width: min(1180px, calc(100% - 32px));
  min-height: 74px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin: 0 auto;
}
/* 브랜드 로고 (아이콘 + 서비스명) */
.brand {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #234862;
  font-size: clamp(1.1rem, 2.2vw, 1.45rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  text-decoration: none;
}
.brand-mark {
  display: grid;
  width: 33px;
  height: 33px;
  place-items: center;
  border-radius: 11px;
  color: #fff;
  background: linear-gradient(135deg, #5dc5dc, #6e8bd9);
  font-size: 1.18rem;
  box-shadow: 0 6px 13px rgba(84, 154, 202, 0.22);
}
/* 상단 네비게이션 메뉴 */
.app-header nav {
  display: flex;
  gap: 5px;
}
.nav-item {
  padding: 9px 11px;
  color: #617b8f;
  font-size: 0.91rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: 10px;
}
.nav-item:hover {
  background: #e9f3f8;
  color: #237fad;
}
/* Vue Router가 현재 경로와 정확히 일치하는 링크에 자동으로 붙여주는 클래스 */
.nav-item.router-link-exact-active {
  color: #237fad;
  background: #e7f5fb;
}
/* 페이지 본문 영역 (헤더와 동일한 최대 너비로 정렬) */
.page-content {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 50px;
}
/* 모바일 대응 */
@media (max-width: 520px) {
  .app-header {
    width: min(100% - 22px, 1180px);
    min-height: 66px;
  }
  .brand {
    font-size: 1rem;
  }
  .page-content {
    width: min(100% - 22px, 1180px);
  }
}
</style>
