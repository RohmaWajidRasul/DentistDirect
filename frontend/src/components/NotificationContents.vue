<template>
    <div class="form-container">

      <div>
        {{ mailBody }}
      </div>

    </div>
  </template>
  
  <script>

  
  export default {
    name: "inbox",
    props: {
    mailBody: String,
  },
    data() {
      return {
        isLoading: false,
        alertMessage: null, 
        alertType: 'success',
        notifications: []
      };
    },
}
  </script>
  
  <style scoped>
  </style>
  