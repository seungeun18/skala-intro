<template>
  <div class="weather-card" @click="emit('select-card', city)">
    <div class="card-header">
      <div class="city-info">
        <strong>{{ city.name }}</strong> ({{ city.weather }})
        <div class="temp">현재 기온: {{ city.temp }}°C</div>
        <div
          class="tag"
          :class="{
            hot: city.status === '더움',
            superhot: city.status === '폭염',
            cool: city.status === '선선함',
          }"
        >
          {{ city.status }}
        </div>
      </div>

      <!-- 🚀 Named Slot: 부모가 바꾼 커스텀 버튼이 들어오는 영역 -->
      <slot name="detail" :city="city">
        <!-- 부모가 슬롯을 안 채웠을 때 뜰 기본 버튼 -->
        <button class="detail-btn" @click.stop="emit('click-detail', city)">상세보기</button>
      </slot>
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

.tag.superhot {
  background-color: #d00000;
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
