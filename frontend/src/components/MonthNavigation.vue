<template>
    <div class="month-navigation">
      <button @click="$emit('prevMonth')" class="btn btn-secondary">Previous</button>
      <h2>{{ currentMonth }}</h2>
      <button @click="$emit('nextMonth')" class="btn btn-secondary">Next</button>
    </div>
  </template>
  
  <script>
  export default {
    name: "MonthNavigation",
    props: {
      currentMonth: String,
    },
  };
  </script>
  
  <style scoped>
  .month-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  </style>
  