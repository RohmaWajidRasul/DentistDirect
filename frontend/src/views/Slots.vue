<template>
  <div class="slots-page">
    <!-- Filters -->
    <div class="filters-container">
      <Filters
        :dentists="dentists || []"
        :locations="locations || []"
        v-model:filters="filters"
      />
      <button class="btn btn-primary apply-filters-button" @click="applyFilters">
        Apply Filters
      </button>
    </div>

    <!-- Month Navigation -->
    <MonthNavigation
      :currentMonth="currentMonth"
      @prevMonth="prevMonth"
      @nextMonth="nextMonth"
    />

    <!-- Slots Calendar -->
    <SlotsCalendar
      :slots="groupedSlotsByMonth[currentMonth]"
      @book-slot="bookSlot"
    />
  </div>
</template>

<script>
import Filters from "../components/Filters.vue";
import MonthNavigation from "../components/MonthNavigation.vue";
import SlotsCalendar from "../components/SlotsCalendar.vue";
import mqttClient from "../mqttClient.js";
import { format, getWeek, addMonths, subMonths } from "date-fns";

export default {
  name: "slots-page",
  components: { Filters, MonthNavigation, SlotsCalendar  },
  data() {
    return {
      slots: [],
      groupedSlotsByMonth: {},
      dentists: [],
      locations: [],
      filters: {
        dentistId: null,
        location: null,
      },
      currentDate: new Date(),
    };
  },
  computed: {
    currentMonth() {
      return format(this.currentDate, "MMMM yyyy");
    },
  },
  mounted() {
    this.mqttClient = mqttClient;
    this.fetchSlotsAndDentists();
  },
  methods: {
    async fetchSlotsAndDentists() {
      try {
        const correlationId = Date.now().toString();

        const payload = {
          correlationId,
          dentistId: this.filters.dentistId || null,
          location: this.filters.location || null,
        };

        console.log("Filters applied:", this.filters);

        console.log("Publishing payload:", payload);

        this.mqttClient.publish(
          "request/availability/fetch",
          JSON.stringify({ correlationId, payload }),
          (err) => {
            if (err) {
              console.error("Failed to publish request:", err);
              throw new Error("Failed to publish request");
            }
            console.log(`Request published with correlationId: ${correlationId}`);
          }
        );

        const responseTopic = `response/availability/fetched/${correlationId}`;
        this.mqttClient.subscribe(responseTopic, (err) => {
          if (err) {
            console.error("Failed to subscribe to response topic:", err);
            throw new Error("Failed to subscribe to response topic");
          }
          console.log(`Subscribed to response topic: ${responseTopic}`);
        });

        this.mqttClient.on("message", (topic, message) => {
          if (topic === responseTopic) {
            const response = JSON.parse(message.toString());
            console.log("Response received:", response);
            console.log("Filtered slots response:", response.slots);

            if (response.status === "success") {
              this.processSlots(response.slots);
            } else {
              console.error("Error response:", response.message);
              //alert(response.message);
            }

            this.mqttClient.unsubscribe(responseTopic, (err) => {
              if (err) {
                console.error("Failed to unsubscribe from response topic:", err);
              } else {
                console.log(`Unsubscribed from response topic: ${responseTopic}`);
              }
            });
          }
        });
      } catch (error) {
        console.error("Error in fetchSlotsAndDentists:", error.message);
        alert("An error occurred while fetching slots. Please try again later.");
      }
    },
    processSlots(slots) {
      this.slots = slots.map((slot) => ({
        id: slot._id,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        dentistName: `${slot.dentistId?.firstName || "Unknown"} ${slot.dentistId?.lastName || ""}`,
        location: slot.dentistId?.location || "Unknown Location",
      }));

      console.log("Formatted slots:", this.slots);

      this.groupSlots();
      this.extractFilters(slots);
    },
    extractFilters(slots) {
      const uniqueDentists = new Map();
      const uniqueLocations = new Set();

      slots.forEach((slot) => {
        if (slot.dentistId) {
          uniqueDentists.set(slot.dentistId._id, {
            id: slot.dentistId._id,
            name: `${slot.dentistId.firstName} ${slot.dentistId.lastName}`,
          });
        }

        if (slot.dentistId?.location) {
          uniqueLocations.add(slot.dentistId.location);
        }
      });

      this.dentists = Array.from(uniqueDentists.values());
      this.locations = Array.from(uniqueLocations);

      console.log("Dentists for filter:", this.dentists);
      console.log("Locations for filter:", this.locations);
    },
    groupSlots() {
      const groupedByMonth = {};

      this.slots.forEach((slot) => {
        const month = format(new Date(slot.date), "MMMM yyyy");
        const week = getWeek(new Date(slot.date));
        const day = format(new Date(slot.date), "EEEE, MMM d");

        if (!groupedByMonth[month]) {
          groupedByMonth[month] = {};
        }

        if (!groupedByMonth[month][week]) {
          groupedByMonth[month][week] = {};
        }

        if (!groupedByMonth[month][week][day]) {
          groupedByMonth[month][week][day] = [];
        }

        groupedByMonth[month][week][day].push(slot);
      });

      this.groupedSlotsByMonth = groupedByMonth;
      console.log("Grouped slots by month:", this.groupedSlotsByMonth);
    },
    applyFilters() {
      console.log("Applying filters:", this.filters);
      this.fetchSlotsAndDentists();
    },
    prevMonth() {
      this.currentDate = subMonths(this.currentDate, 1);
    },
    nextMonth() {
      this.currentDate = addMonths(this.currentDate, 1);
    },
    bookSlot(slot) {
      alert(`Slot booked: ${slot.startTime} - ${slot.endTime} on ${slot.date}`);
    },
  },
};
</script>

<style scoped>
.slots-page {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
}

.filters-container {
  margin-bottom: 20px;
}

.apply-filters-button {
  margin-top: 10px;
}

.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.slots-calendar {
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.month-container {
  margin-bottom: 30px;
}

.week-title {
  font-size: 1.4rem;
  margin-bottom: 10px;
}

.days-row {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.day-container {
  flex: 1 0 30%;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 10px;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}
</style>
