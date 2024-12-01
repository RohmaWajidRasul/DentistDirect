<template>
    <div>
      <vue-cal
        :events="events"
        :selected-date="selectedDate"
        :view="view"
        time="24"
        @cell-click="handleSlotClick"
      />
    </div>
  </template>
  
  <script>
  import VueCal from 'vue-cal';
  import 'vue-cal/dist/vuecal.css';
  
  export default {
    name: 'Calendar',
    components: { VueCal },
    props: {
      events: {
        type: Array,
        required: true,
      },
      view: {
        type: String,
        default: 'month',
      },
      selectedDate: {
        type: Date,
        default: () => new Date(),
      },
    },
    emits: ['slot-click'],
    methods: {
      handleSlotClick(event) {
        this.$emit('slot-click', event); // Emit the selected slot to parent
      },
    },
  };
  </script>
  
  <style scoped>
  /* Add any calendar-specific styling if needed */
  </style>
  