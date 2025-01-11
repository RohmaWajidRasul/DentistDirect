<template>
    <div class="slots-calendar">
      <div v-if="slots" class="month-container">
        <div
          v-for="(weekSlots, week) in slots"
          :key="week"
          class="week-box"
        >
          <WeekContainer
            :week="week"
            :weekSlots="weekSlots"
            @book-slot="bookSlot"
          />
        </div>
      </div>
      <div v-else class="no-slots-message">No slots available for this month.</div>
    </div>
  </template>
  
  <script>
  import WeekContainer from "./WeekContainer.vue";
  
  export default {
    name: "SlotsCalendar",
    components: { WeekContainer },
    props: {
      slots: Object,
    },
    /* watch: {
      // Watch for changes in the 'slots' prop
      slots(newSlots) {
        console.log("Slots prop changed:", newSlots);

        // Only log if the slots prop is not null/undefined
        if (newSlots) {
          for (const [week, weekSlots] of Object.entries(newSlots)) {
            console.log(`Week: ${week}, Week Slots:`, weekSlots);
          }
        } else {
          console.error("Slots data is not available.");
        }
      }
    }, */
    methods: {
      bookSlot(data) {
        this.$emit("book-Slot", data);
      },
    },
  };
  </script>
  
  <style scoped>
  .slots-calendar {
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .week-box {
    margin-bottom: 20px;
    padding: 15px;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    background: #ffffff;
  }
  </style>
  