<template>
  <div class="notification-bubble">
    <div class="notification-body">
      {{ mailBody }}
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
  width: calc(100% - 40px); /* Full width minus 20px on each side */
  margin: 0 auto; /* Center the bubble horizontally */
  max-width: 100%; /* Prevent overflowing */
  box-sizing: border-box; /* Ensure padding is included in the width */
}

.notification-body {
  font-size: 1.2rem;
  margin-bottom: 10px;
}

.created-at {
  text-align: right;
  font-size: 0.9rem;
  color: #555;
}
</style>
