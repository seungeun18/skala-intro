<script setup>
//defineProps: 부모에게서 데이터 받기(입력)
defineProps({
  parentData: {
    type: String,
    required: true,
  },
})
//부모 컴포넌트가 넘겨주는 데이터를 받는 수신함이다.
//parentData라는 이름으로 데이터 받을거고,
//받을 데이터는 문자열이여야함.
//그리고 부모가 이 데이터를 안보내면 에러를 띄움

//defineEmits: 부모에게 보낼 신호 이름 등록하기
const emit = defineEmits(['update-request'])
//부모에게 update-request라는 이름의 신호를 보낼 준비함.

//sendNotification : 신호와 데이터 발사
const sendNotification = () => {
  const payload = 'Child에서 가공한 새로운 데이터'
  emit('update-request', payload)
}
//버튼을 클릭햇을 때 신호 발사하는 함수
// payload: 부모에게 함께 넘겨줄 진짜 내용(데이터)
//emit('update-request', payload): 부모한테 update-request신호를 쏘면서
//payload라는 데이터를 함께 보냄
</script>

<template>
  <div class="child-container">
    <h2>하위 컴포넌트 (Child)</h2>
    <!-- 1. Props로 받은 parentData를 화면에 짠! 하고 보여줌 -->
    <p>
      수신된 Props 데이터: <strong>{{ parentData }}</strong>
    </p>
    <br />
    <!-- 2. 버튼을 누르면 위에서 만든 sendNotification 함수 실행 -->
    <button @click="sendNotification">상위 컴포넌트로 갱신 요청 (Emit)</button>
  </div>
</template>

//{{ parentData }}: 부모가 보낸 데이터 화면에 보여주기 // @click="sendNotification": 사용자가 버튼
클릭하면 3번 함수가 실행되면서 부모한테 신호가 날아감
