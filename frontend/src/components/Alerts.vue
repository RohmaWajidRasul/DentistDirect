<template>
  <div v-if="show" :class="['alert', `alert-${type}`]">
    {{ message }}
  </div>
</template>

<script>
export default {
  props: {
    type: {
      type: String,
      default: "success", // Types = success, error, or info
      validator: (value) => ["success", "error", "info"].includes(value),
    },
    message: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      show: true,
    };
  },
  mounted() {
    setTimeout(() => {
      this.show = false;
      this.$emit("close");
    }, 3000);
  },
};
</script>

<style scoped>
.alert {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
  text-align: center;
  font-size: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}
</style>
