<template>
  <div class="notification-bubble">
    
    <div class="notification-body">
      {{ mailBody }}
      <div class="back-button" @click="goBack()">
        &lt; Back
      </div>
    </div>
    <div class="created-at">
      Sent at: {{ formattedDate }}
    </div>
  </div>
</template>

<script>
export default {
  name: "NotificationContents",
  props: {
    mailBody: String,
    createdAt: String,
  },
  computed: {
    formattedDate() {
      const date = new Date(this.createdAt);
      return date.toLocaleString();
    },
  },
  methods: {
    goBack() {
      this.$emit('go-back');
    },
  },
};
</script>

<style scoped>
.notification-bubble {
  background-color: #e8f4fa;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
  white-space: normal;
  width: calc(100% - 40px);
  margin: 0 auto;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  display: flex;
  flex-direction: column; 

}

.notification-body {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.created-at {
  text-align: right;
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 30px;
}

.back-button {
  position: absolute;
  bottom: 10px; 
  right: 10px;
  background-color: white;
  color: #5581af;
  border: 1px solid #5581af;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  align-self: flex-end;
}
.back-button:hover {
  background-color: #f0f0f0;
}

</style>
