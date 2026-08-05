<template>
  <div class="about-page">
    <section class="about-hero">
      <p>ABOUT THE SERVICE</p>
      <h1>여행을 위한 날씨, 더 쉽게</h1>
      <span>현재 날씨와 도시별 여행 준비 정보를 한 화면에서 제공합니다.</span>
    </section>
    <section class="feature-grid">
      <article>
        <span>☀️</span>
        <h2>실시간 관측</h2>
        <p>
          선택한 여행지의 온도·습도·바람·가시거리 등 현재 관측값을 OpenWeather API에서 가져옵니다.
        </p>
      </article>
      <article>
        <span>🧳</span>
        <h2>여행 준비</h2>
        <p>현재 기온과 비·눈·바람 여부에 따라 의류와 준비물, 어울리는 활동을 안내합니다.</p>
      </article>
      <article>
        <span>🗺️</span>
        <h2>도시별 탐색</h2>
        <p>
          여행 국가와 주요 도시를 차례로 선택하고, 도시별 상세 관측 정보와 관광지 검색으로
          이어집니다.
        </p>
      </article>
      <article>
        <span>📖</span>
        <h2>Wikivoyage 도시 가이드</h2>
        <p>도시 개요·역사·주요 볼거리를 Wikivoyage 공개 문서에서 불러오고 원문으로 연결합니다.</p>
      </article>
    </section>
    <section class="notice-card">
      <h2>안전한 여행을 위해</h2>
      <p>
        이 서비스의 날씨 정보는 여행 계획을 돕는 참고용입니다. 여행경보·입국 조건·현지 재난 및 치안
        정보는 출발 직전에 외교부 해외안전여행에서 다시 확인하세요.
      </p>
      <a href="https://0404.go.kr/app/main/mainPage" target="_blank" rel="noopener noreferrer"
        >외교부 해외안전여행 확인하기 ↗</a
      >
    </section>
    <p class="source">
      Weather data powered by OpenWeather · 화면의 관측 시각을 기준으로 표시됩니다.
    </p>
  </div>
</template>

<style scoped>
.about-page {
  display: grid;
  gap: 18px;
  padding-top: 28px;
}
.about-hero {
  padding: 34px;
  border-radius: 24px;
  color: #fff;
  background: linear-gradient(135deg, #2b809e, #70c2d1);
}
.about-hero p {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  opacity: 0.85;
}
.about-hero h1 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.7rem);
  letter-spacing: -0.05em;
}
.about-hero span {
  display: block;
  margin-top: 11px;
  opacity: 0.9;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.feature-grid article,
.notice-card {
  padding: 24px;
  border: 1px solid #dfeaf1;
  border-radius: 19px;
  background: #fff;
  box-shadow: 0 9px 22px rgba(31, 69, 95, 0.05);
}
.feature-grid span {
  font-size: 1.55rem;
}
.feature-grid h2,
.notice-card h2 {
  margin: 12px 0 8px;
  color: #234862;
  font-size: 1.12rem;
}
.feature-grid p,
.notice-card p {
  margin: 0;
  color: #6f8798;
  line-height: 1.7;
  font-size: 0.92rem;
}
.notice-card {
  background: #eef9fc;
}
.notice-card a {
  display: inline-block;
  margin-top: 15px;
  color: #16759f;
  font-weight: 800;
  text-decoration: none;
}
.source {
  text-align: center;
  color: #8094a3;
  font-size: 0.8rem;
}
@media (max-width: 680px) {
  .feature-grid {
    grid-template-columns: 1fr;
  }
  .about-hero,
  .feature-grid article,
  .notice-card {
    padding: 22px;
  }
}
</style>
