<template>
    <div class="slots-page">
      <div class="filters-container">
        <Filters
          :dentists="dentists"
          :locations="locations"
          @filter-change="handleFilterChange"
        />
      </div>
      <div>
        <Calendar
          ref="calendar"
          :events="events"
          :view="view"
          :selected-date="selectedDate"
          @cell-click="handleSlotClick"
          @view-change="handleViewChange"
        />
      </div>
    </div>
  </template>
  

  <script>
import { ref } from "vue";
import Calendar from "../components/Calendar.vue";
import Filters from "../components/Filters.vue";
import Api from "../Api.js";

export default {
  name: "Slots",
  components: { Calendar, Filters },
  data() {
    return {
      events: [],
      view: "month", // Default to month view
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
    async fetchSlotsAndDentists(filters = {}) {
        try {
            const response = await Api.get("/v1/slots/availability", { params: filters });

            // Transform slot data for calendar
            this.events = response.data.slots.map((slot) => ({
            start: `${slot.date}T${slot.startTime}`,
            end: `${slot.date}T${slot.endTime}`,
            title: `Available Slot: ${slot.dentistId.firstName} ${slot.dentistId.lastName}`,
            class: "available-slot",
            }));

            // Extract unique dentists and locations
            const uniqueDentists = new Map();
            response.data.slots.forEach((slot) => {
            if (slot.dentistId) {
                uniqueDentists.set(slot.dentistId._id, {
                name: `${slot.dentistId.firstName} ${slot.dentistId.lastName}`,
                location: slot.dentistId.location,
                });
            }
            });

            // Convert to arrays for filters
            this.dentists = Array.from(uniqueDentists.values()).map((dentist) => dentist.name);
            this.locations = Array.from(new Set(Array.from(uniqueDentists.values()).map((d) => d.location)));
        } catch (error) {
            console.error("Failed to fetch slots and dentists:", error);
        }
    },
    handleFilterChange(filters) {
      this.fetchSlots(filters);
    },
    handleSlotClick(event) {
      console.log("Cell clicked event data:", event);

      // Check if the event is a valid slot click
      if (event && event.start && event.end) {
        alert(`Selected slot: ${event.start} - ${event.end}`);
        return;
      }

      // Handle calendar navigation based on the clicked date
      if (event instanceof Date || event?.date) {
        const clickedDate = event instanceof Date ? event : new Date(event.date);

        // Switch to the appropriate view based on the current view
        if (this.view === "month") {
          this.selectedDate = clickedDate;
          this.view = "week"; // Switch to week view
        } else if (this.view === "week") {
          this.selectedDate = clickedDate;
          this.view = "day"; // Switch to day view
        } else if (this.view === "year") {
          this.selectedDate = clickedDate;
          this.view = "month"; // Switch to month view
        } else if (this.view === "years") {
          this.selectedDate = clickedDate;
          this.view = "year"; // Switch to year view
        }

        this.updateCalendarView(); // Programmatically update the calendar view
        return;
      }

      // Fallback for invalid clicks
      console.error("Invalid action. Event data:", event);
      alert("Invalid action. Please try again.");
    },
    handleViewChange(newView) {
      this.view = newView; // Update the calendar view dynamically
    },
    updateCalendarView() {
      // Access the vue-cal instance and programmatically update view and date
      const calendar = this.$refs.calendar;
      if (calendar && calendar.changeView) {
        calendar.changeView(this.view, this.selectedDate); // Sync the view and selected date
      }
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

.filters-container {
  margin-bottom: 20px;
}

.available-slot {
  background-color: green;
  color: white;
}
</style>
