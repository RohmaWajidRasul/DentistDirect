<template>
    <div v-if="show" :class="`alert alert-${type}`">
      {{ message }}
    </div>
  </template>
  
  <script>
  export default {
    props: {
      type: {
        type: String,
        default: "success", // Types = success or error
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
      }, 5000);
    },
  };
  </script>
  
  <style scoped>
  .alert {
    padding: 10px;
    margin: 15px 0;
    border-radius: 4px;
    font-size: 1rem;
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
  </style>
  