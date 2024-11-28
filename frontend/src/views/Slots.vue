<template>
    <div class="slots-page">
      <Filters
        :dentists="dentists"
        :locations="locations"
        @filter-change="handleFilterChange"
      />
      <Calendar
        :events="events"
        :view="view"
        :selected-date="selectedDate"
        @slot-click="handleSlotClick"
      />
    </div>
  </template>
  
  <script>
  import Calendar from '../components/Calendar.vue';
  import Filters from '../components/Filters.vue';
  import Api from '../Api.js';
  
  export default {
    name: 'Slots',
    components: { Calendar, Filters },
    data() {
      return {
        events: [],
        view: 'month',
        selectedDate: new Date(),
        dentists: [],
        locations: [],
      };
    },
    mounted() {
      this.fetchDentists();
      this.fetchSlots();
    },
    methods: {
      async fetchDentists() {
        try {
          const response = await Api.get('/v1/dentists');
          this.dentists = response.data;
          this.locations = [...new Set(response.data.map(dentist => dentist.location))];
        } catch (error) {
          console.error('Failed to fetch dentists:', error);
        }
      },
      async fetchSlots(filters = {}) {
        try {
          const response = await Api.get('/v1/slots/availability', { params: filters });
          this.events = response.data.slots.map(slot => ({
            start: `${slot.date}T${slot.startTime}`,
            end: `${slot.date}T${slot.endTime}`,
            title: 'Available Slot',
            class: 'available-slot',
          }));
        } catch (error) {
          console.error('Failed to fetch slots:', error);
        }
      },
      handleFilterChange(filters) {
        this.fetchSlots(filters);
      },
      handleSlotClick(event) {
        alert(`Selected slot: ${event.start} - ${event.end}`);
      },
    },
  };
  </script>
  
  <style scoped>
  .slots-page {
    max-width: 900px;
    margin: auto;
    padding: 20px;
  }
  
  .available-slot {
    background-color: green;
    color: white;
  }
  </style>
  