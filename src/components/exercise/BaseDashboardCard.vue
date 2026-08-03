<template>
  <div class="card-container">
    <h3>{{ title }}</h3>
    <div class="card-content">
      <!-- 부모 컴포넌트가 넣어주는 HTML 요소들이 들어올 위치 -->
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.card-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.card-container h3 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.1rem;
  color: #333;
}
</style>
