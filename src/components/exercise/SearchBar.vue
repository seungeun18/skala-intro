<template>
  <div class="search-bar">
    <input
      type="text"
      :value="searchQuery"
      @input="onInput"
      placeholder="검색할 도시 이름 입력"
      class="search-input"
    />
    <p class="search-info">검색 중인 도시: {{ searchQuery }}</p>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update-query'])

const onInput = (event) => {
  // 입력할 때마다 update-query 이벤트를 통해 부모로 전달 (한글 즉시 동기화)
  emit('update-query', event.target.value)
}
</script>

<style scoped>
.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 0.95rem;
}

.search-info {
  margin-top: 8px;
  margin-bottom: 0;
  font-size: 0.85rem;
  color: #666;
}
</style>
