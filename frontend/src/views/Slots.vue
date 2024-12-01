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
  import mqttClient from "../mqttClient.js";
  
  export default {
    name: "slots-page",
    components: { Calendar, Filters },
    data() {
      return {
        events: [],
        view: "month",
        selectedDate: new Date(),
        dentists: [],
        locations: [],
        isLoading: false,
      };
    },
    mounted() {
      this.mqttClient = mqttClient;
      this.fetchSlotsAndDentists();
    },
    methods: {
      async fetchSlotsAndDentists(filters = {}) {
        try {
            const correlationId = Date.now().toString(); // Generate unique correlationId

            const payload = {
                correlationId,
                dentistId: filters.dentistId || null, // Default to null if not provided
                date: filters.date || null,          // Default to null if not provided
                location: filters.location || null,  // Default to null if not provided
            };

            console.log("Publishing payload:", payload);

            this.mqttClient.publish(
                "request/availability/fetch",
                JSON.stringify({ correlationId, payload }),
                (err) => {
                    if (err) {
                        console.error("Failed to publish request:", err);
                        throw new Error("Failed to publish request");
                    } else {
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                }
            );

            const responseTopic = `response/availability/fetched/${correlationId}`;
            this.mqttClient.subscribe(responseTopic, (err) => {
                if (err) {
                    console.error("Failed to subscribe to response topic:", err);
                    throw new Error("Failed to subscribe to response topic");
                } else {
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                }
            });

            this.mqttClient.on("message", (topic, message) => {
                if (topic === responseTopic) {
                    const response = JSON.parse(message.toString());
                    console.log("Response received:", response);

                    if (response.status === "success") {
                        this.events = response.slots.map((slot) => ({
                            start: `${slot.date}T${slot.startTime}`,
                            end: `${slot.date}T${slot.endTime}`,
                            title: `Available Slot: ${slot.dentistId?.firstName || "Unknown"} ${
                                slot.dentistId?.lastName || ""
                            }`,
                            class: "available-slot",
                        }));
                    } else {
                        console.error("Error response:", response.message);
                        alert(response.message);
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
        // Transform slot data for the calendar
        this.events = slots.map((slot) => ({
          start: `${slot.date}T${slot.startTime}`,
          end: `${slot.date}T${slot.endTime}`,
          title: `Available Slot: ${slot.dentistId?.firstName || "Unknown"} ${
            slot.dentistId?.lastName || ""
          }`,
          class: "available-slot",
        }));
  
        // Extract unique dentists and locations
        const uniqueDentists = new Map();
        slots.forEach((slot) => {
          if (slot.dentistId) {
            uniqueDentists.set(slot.dentistId._id, {
              name: `${slot.dentistId.firstName} ${slot.dentistId.lastName}`,
              location: slot.dentistId.location,
            });
          }
        });
  
        this.dentists = Array.from(uniqueDentists.values()).map((dentist) => dentist.name);
        this.locations = Array.from(
          new Set(Array.from(uniqueDentists.values()).map((d) => d.location))
        );
      },
      handleFilterChange(filters) {
        this.fetchSlotsAndDentists(filters);
      },
      handleSlotClick(event) {
        console.log("Cell clicked event data:", event);
  
        if (event && event.start && event.end) {
          alert(`Selected slot: ${event.start} - ${event.end}`);
          return;
        }
  
        if (event instanceof Date || event?.date) {
          const clickedDate = event instanceof Date ? event : new Date(event.date);
  
          if (this.view === "month") {
            this.selectedDate = clickedDate;
            this.view = "week";
          } else if (this.view === "week") {
            this.selectedDate = clickedDate;
            this.view = "day";
          } else if (this.view === "year") {
            this.selectedDate = clickedDate;
            this.view = "month";
          } else if (this.view === "years") {
            this.selectedDate = clickedDate;
            this.view = "year";
          }
  
          this.updateCalendarView();
          return;
        }
  
        console.error("Invalid action. Event data:", event);
        alert("Invalid action. Please try again.");
      },
      handleViewChange(newView) {
        this.view = newView;
      },
      updateCalendarView() {
        const calendar = this.$refs.calendar;
        if (calendar && calendar.changeView) {
          calendar.changeView(this.view, this.selectedDate);
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
  