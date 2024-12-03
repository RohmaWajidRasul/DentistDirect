<template>
    <div class="week-container">
      <h3 class="week-title">Week {{ week }}</h3>
      <table class="week-table">
        <thead>
          <tr>
            <th v-for="dayName in daysOfWeek" :key="dayName">{{ dayName }}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="day in daysOfWeek"
              :key="day"
              class="day-cell"
            >
              <DayContainer
                :day="day"
                :date="weekDates[day]"
                :daySlots="weekSlots[weekDates[day]] || []"
                @show-slot-details="showSlotDetails"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
  import DayContainer from "./DayContainer.vue";
  
  export default {
    name: "WeekContainer",
    components: { DayContainer },
    props: {
      week: Number,
      weekSlots: Object,
    },
    computed: {
      daysOfWeek() {
        return ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      },
      weekDates() {
        // Convert weekSlots keys (dates) into a map of { dayName: date } for matching
        const datesMap = {};
        Object.keys(this.weekSlots).forEach((date) => {
          const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" });
          datesMap[dayName] = date;
        });
        return datesMap;
      },
    },
    methods: {
      showSlotDetails(slot) {
        this.$emit("show-slot-details", slot);
      },
    },
  };
  </script>
  
  <style scoped>
  .week-container {
    margin-bottom: 20px;
  }
  
  .week-title {
    font-size: 1.2rem;
    margin-bottom: 10px;
  }
  
  .week-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .week-table th,
  .week-table td {
    border: 1px solid #dee2e6;
    text-align: center;
    vertical-align: top;
    padding: 10px;
  }
  
  .day-cell {
    background-color: #f8f9fa;
  }
  </style>
  