<template>
    <div class="day-container">
      <p class="day-date">{{ date }}</p>
      <div v-if="daySlots.length === 0" class="no-slots">
        No Slots
      </div>
      <ul v-else class="slots-list">
        <li
          v-for="slot in sortedSlots"
          :key="slot.id"
          class="slot-item available-slot"
          @click="showSlotDetails(slot)"
        >
          <div class="slot-box">
            <span class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</span>
            <span class="slot-location">{{ slot.location }}</span>
            <span class="slot-dentist">Dentist: {{ slot.dentistName }}</span>
          </div>
        </li>
      </ul>

      <!-- SlotCard component -->
      <SlotCard
        v-if="selectedSlot"
        :slot="selectedSlot"
        @close="selectedSlot = null"
      />
    </div>
  </template>
  
  <script>
  import SlotCard from './SlotCard.vue';

  export default {
    name: "DayContainer",
    components: { SlotCard },
    props: {
      day: String,
      date: String,
      daySlots: Array,
    },
    data() {
      return {
        selectedSlot: null, // Holds the currently selected slot
      };
    },
    computed: {
      sortedSlots() {
        return [...this.daySlots].sort(
          (a, b) => new Date(`1970-01-01T${a.startTime}`) - new Date(`1970-01-01T${b.startTime}`)
        );
      },
    },
    methods: {
      showSlotDetails(slot) {
        //this.$emit("show-slot-details", slot);
        this.selectedSlot = slot; // Open the SlotCard with the clicked slot
      },
    },
  };
  </script>
  
  <style scoped>
  .day-container {
    padding: 5px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .day-date {
    font-size: 0.9rem;
    color: #6c757d;
    margin-bottom: 5px;
  }
  
  .no-slots {
    color: #6c757d;
    font-style: italic;
  }
  
  .slots-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .slot-item {
    margin-bottom: 10px;
    cursor: pointer;
  }
  
  .available-slot {
    background-color: #d4edda; /* Green shade */
    border: 1px solid #c3e6cb;
    border-radius: 8px;
    padding: 10px;
    transition: transform 0.2s ease;
    width: 100%;
  }
  
  .available-slot:hover {
    transform: scale(1.02);
  }
  
  .slot-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .slot-time,
  .slot-location,
  .slot-dentist {
    margin-bottom: 5px;
    font-size: 0.9rem;
  }
  </style>
  