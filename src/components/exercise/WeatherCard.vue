<template>
  <div class="weather-card" @click="emit('select-card', city)">
    <div class="card-header">
      <div class="city-info">
        <strong>{{ city.name }}</strong> ({{ city.weather }})
        <div class="temp">현재 기온: {{ city.temp }}°C</div>
        <span class="tag" :class="city.status === '더움' ? 'hot' : 'cool'">
          {{ city.status }}
        </span>
      </div>
      <button class="detail-btn" @click.stop="emit('click-detail', city)">상세보기</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  city: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])
</script>

<style scoped>
.weather-card {
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 10px;
  background-color: #fafafa;
  cursor: pointer;
  transition: background-color 0.2s;
}

.weather-card:hover {
  background-color: #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.temp {
  margin: 4px 0;
  font-size: 0.9rem;
  color: #555;
}

.tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 0.75rem;
  border-radius: 4px;
  color: #fff;
}

.tag.hot {
  background-color: #ff6b6b;
}

.tag.cool {
  background-color: #4dabf7;
}

.detail-btn {
  padding: 6px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.detail-btn:hover {
  background-color: #e9ecef;
}
</style>
