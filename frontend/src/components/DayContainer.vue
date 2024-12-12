<template>
  <div class="day-container">
    <p class="day-date">{{ date }}</p>
    <div v-if="daySlots.length === 0" class="no-slots">
      No Slots
    </div>
    <ul v-else class="slots-list">
      <li
        v-for="slotInfo in sortedSlots"
        :key="slotInfo.id"
        class="slot-item available-slot"
        @click="showSlotDetails(slotInfo)"
      >
        <div class="slot-box">
          <span class="slot-time">{{ slotInfo.startTime }} - {{ slotInfo.endTime }}</span>
          <span class="slot-location">{{ slotInfo.location }}</span>
          <span class="slot-dentist">Dentist: {{ slotInfo.dentistName }}</span>
        </div>
      </li>
    </ul>

    <!-- SlotCard component -->
    <SlotCard
      v-if="selectedSlotInfo"
      :slotInfo="selectedSlotInfo"
      @close="selectedSlotInfo = null"
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
      selectedSlotInfo: null, // Holds the currently selected slot
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
    showSlotDetails(slotInfo) {
      //this.$emit("show-slot-details", slotInfo);
      this.selectedSlotInfo = slotInfo; // Open the SlotCard with the clicked slot
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
  justify-content: flex-start; /* Added for responsiveness*/
  box-sizing: border-box; /* Added for responsiveness*/
  white-space: normal; /* Allow wrapping of text */
  word-wrap: break-word; /* Break long words if necessary */
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
  display: flex;
  flex-direction: column;
  gap: 5px; /* Add spacing between slot items */
  width: 100%;
}

.slot-item {
  margin-bottom: 10px;
  cursor: pointer;
}

.available-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid #c3e6cb;
  background-color: #d4edda; /* Green shade */
  transition: transform 0.2s ease;
  overflow: hidden;
  width: 100%;
}

.available-slot:hover {
  transform: scale(1.02);
}

.slot-box {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: center;
  font-size: 0.9rem;
  width: 100%;
  overflow-wrap: break-word;
}

.slot-time,
.slot-location,
.slot-dentist {
  margin-bottom: 5px;
  white-space: normal; /* Allow wrapping of text */
  word-wrap: break-word; /* Break long words if necessary */
}

/* Responsive scaling */
@media (max-width: 480px) { /* Mobile L */
  .available-slot {
    flex-direction: column;
    padding: 10px;
    overflow-y: auto; /* Enable vertical scrolling */
    overflow-x: auto;
  }

  .slot-box,
  .no-slots {
    font-size: 0.5rem;
    text-align: center;
  }
}

@media (max-width: 320px) { /* Mobile S */
  .available-slot {
    flex-direction: column;
    padding: 15px;
    overflow-y: auto; /* Enable vertical scrolling */
    overflow-x: auto;
  }

  .slot-box,
  .no-slots {
    font-size: 0.3rem;
    text-align: center;
  }

  .slot-time,
  .slot-location,
  .slot-dentist {
    font-size: 0.3rem;
    margin-bottom: 3px;
  }
}

</style>
