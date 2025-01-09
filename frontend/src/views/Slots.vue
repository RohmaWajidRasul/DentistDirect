<template>
  <div class="slots-page">
    <!-- Alert Messages -->
    <Alert
      v-if="alertMessage"
      :type="alertType"
      :message="alertMessage"
      @close="alertMessage = null"
    />

    <!-- Filters -->
    <div class="filters-container">
      <Filters
        :dentists="dentists || []"
        :locations="locations || []"
        :clinics="clinics || []"
        :filters="filters"
        @update:filters="(value) => { filters = value; console.log('Filters updated:', value); }"
      />

      <button
        class="btn btn-primary apply-filters-button"
        @click="applyFilters"
      >
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
import Alert from "../components/Alerts.vue";
import { format, getISOWeek, addMonths, subMonths } from "date-fns";

export default {
  name: "slots-page",
  components: { Filters, MonthNavigation, SlotsCalendar, Alert },
  props: {
    clinicId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      allAppointments: [],
      appointments: [],
      groupedSlotsByMonth: {},
      dentists: [],
      locations: [],
      clinics: [],
      filters: {
        dentistId: null,
        location: null,
        clinicId: null,
      },
      currentDate: new Date(),
      alertMessage: null,
      alertType: "success", // alertType = success or error
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
    this.subscribeToAppointmentUpdates();
    if (this.clinicId) {
    this.filters.clinicId = this.clinicId;
    this.applyFilters();
  }
  },
  beforeUnmount() {
    this.unsubscribeFromAppointmentUpdates();
  },

  methods: {
    subscribeToAppointmentUpdates() {
      const topics = [
        "response/appointment-management/#",
        "response/create-appointment/#",
      ];

      try {
        topics.forEach((topic) => {
          this.mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error(`Failed to subscribe to topic: ${topic}`, err);
            } else {
              console.log(`Subscribed to topic: ${topic}`);
            }
          });
        });

        if (!this.mqttMessageHandlerSet) {
          this.mqttClient.on("message", (topic, message) => {
            if (topic.startsWith("response/appointment-management/")) {
              this.handleAppointmentUpdates(topic, message);
            } else if (topic.startsWith("response/create-appointment/")) {
              this.handleCreatedAppointments(topic, message);
            }
          });
          this.mqttMessageHandlerSet = true;
        }
      } catch (error) {
        console.error("Error subscribing to topics:", error.message);
      }
    },
    unsubscribeFromAppointmentUpdates() {
      const topics = [
        "response/appointment-management/#",
        "response/create-appointment/#",
      ];

      try {
        topics.forEach((topic) => {
          this.mqttClient.unsubscribe(topic, (err) => {
            if (err) {
              console.error(`Failed to unsubscribe from topic: ${topic}`, err);
            } else {
              console.log(`Unsubscribed from topic: ${topic}`);
            }
          });
        });

        this.mqttClient.off("message", this.handleAppointmentUpdates);
      } catch (error) {
        console.error("Error unsubscribing from topic:", error.message);
      }
    },
    
    handleAppointmentUpdates(topic, message) {
      try {
        const response = JSON.parse(message.toString());
        console.log("Manage response received:", response);

        if (response.status === "success") {
          console.log("Appointment updated successfully, refreshing slots.");
          this.fetchSlotsAndDentists();
        } else {
          console.error("Error in appointment update:", response.message);
        }
      } catch (error) {
        console.error("Error processing appointment update:", error.message);
      }
    },
    handleCreatedAppointments(topic, message) {
      try {
        const response = JSON.parse(message.toString());
        console.log("Created appointment response received:", response);

        if (response.status === "success") {
          console.log(
            "New appointment created successfully, refreshing slots."
          );
          this.fetchSlotsAndDentists();
        } else {
          console.error(
            "Error in created appointment response:",
            response.message
          );
        }
      } catch (error) {
        console.error(
          "Error processing created appointment response:",
          error.message
        );
      }
    },

    async fetchSlotsAndDentists() {
      try {
        const correlationId = Date.now().toString();

        const payload = {};

        console.log("Fetching all slots and dentists...");

        this.mqttClient.publish(
          "request/available-appointments/available",
          JSON.stringify({ correlationId, payload }),
          (err) => {
            if (err) {
              console.error("Failed to publish request:", err);
              throw new Error("Failed to publish request");
            }
            console.log(`Request published with correlationId: ${correlationId}`);
          }
        );

        const responseTopic = `response/available-appointments/available/${correlationId}`;
        this.mqttClient.subscribe(responseTopic, (err) => {
          if (err) {
            console.error("Failed to subscribe to response topic:", err);
            throw new Error("Failed to subscribe to response topic");
          }
          console.log(`Subscribed to response topic: ${responseTopic}`);
        });

        const timeout = setTimeout(() => {
          mqttClient.unsubscribe(responseTopic);
          this.showAlert("Server did not respond. Please try again later.", "error");
        }, 5000);

        this.mqttClient.on("message", (topic, message) => {
          if (topic === responseTopic) {
            clearTimeout(timeout);
            const response = JSON.parse(message.toString());
            console.log("Response received:", response);

            if (response.status === "success") {
              if(response.message == 'No appointments found.') {
                this.showAlert("No slots available", "error");
              } else {
              this.processSlots(response.appointments);
              }
              //this.showAlert("Slots fetched successfully!", "success");
            } else {
              console.error("Error response:", response);
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
        this.showAlert("An error occurred while fetching slots. Please try again later.", "error");
      }
    },

    showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
    },

    processSlots(appointments) {
      this.allAppointments = [];
      this.groupedSlotsByMonth = {};
      this.allAppointments = appointments.map((appointment) => ({
        id: appointment._id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        clinicId: appointment.clinicId,
        dentistId: appointment.dentistId,
        dentistName: `${appointment.dentist?.firstName || "Unknown"} ${
          appointment.dentist?.lastName || ""
        }`,
        location: appointment.clinic?.location || "Unknown Location",
        clinicName: appointment.clinic?.name || "Unknown Clinic",


      }));

      console.log("Formatted slots:", this.allAppointments);

      this.extractFilters(appointments);
      this.applyFilters();
    },
    extractFilters(appointments) {
      const uniqueDentists = new Map();
      const uniqueLocations = new Set();
      const uniqueClinics = new Map(); 

      appointments.forEach((appointment) => {
        if (appointment.dentist) {
          const dentist = appointment.dentist;
          uniqueDentists.set(dentist._id, {
            id: dentist._id,
            name: `${dentist.firstName || "Unknown"} ${dentist.lastName || ""}`,
          });
        }

        if (appointment.clinic?.location) {
          uniqueLocations.add(appointment.clinic.location);
        }

        if (appointment.clinic) {
            const clinic = appointment.clinic;
            uniqueClinics.set(clinic._id, {
                id: clinic._id,
                name: clinic.name || "Unknown Clinic",
            });
        }

      });

      this.dentists = Array.from(uniqueDentists.values());
      this.locations = Array.from(uniqueLocations);
      this.clinics = Array.from(uniqueClinics.values());

      console.log("Dentists for filter:", this.dentists);
      console.log("Locations for filter:", this.locations);
      console.log("Clinics for filter:", this.clinics);
    },

    groupSlots() {
      const groupedByMonth = {};

      this.appointments.forEach((appointment) => {
        const month = format(new Date(appointment.date), "MMMM yyyy");
        const week = getISOWeek(new Date(appointment.date));
        const day = format(new Date(appointment.date), "EEEE, MMM d");

        if (!groupedByMonth[month]) {
          groupedByMonth[month] = {};
        }

        if (!groupedByMonth[month][week]) {
          groupedByMonth[month][week] = {};
        }

        if (!groupedByMonth[month][week][day]) {
          groupedByMonth[month][week][day] = [];
        }

        groupedByMonth[month][week][day].push(appointment);
      });

      this.groupedSlotsByMonth = groupedByMonth;
      console.log("Grouped slots by month:", this.groupedSlotsByMonth);
    },
    applyFilters() {
      console.log("Applying filters:", this.filters);
      this.appointments = this.allAppointments.filter((appointment) => {
        const matchesDentist =
          !this.filters.dentistId || appointment.dentistId === this.filters.dentistId;
        const matchesLocation = 
          !this.filters.location || appointment.location === this.filters.location;
        const matchesClinic =
          !this.filters.clinicId || appointment.clinicId === this.filters.clinicId;
        console.log(matchesClinic, matchesDentist, matchesLocation, this.filters.location, appointment.location);

        return matchesDentist && matchesLocation && matchesClinic;
      });
      this.groupSlots();
    },

    prevMonth() {
      this.currentDate = subMonths(this.currentDate, 1);
    },
    nextMonth() {
      this.currentDate = addMonths(this.currentDate, 1);
    },
    bookSlot(data) {
      try {
        const correlationId = Date.now().toString();
         

        const payload = data.payload;

        console.log("Publishing payload:", payload);

        mqttClient.publish(
          "request/appointment-management",
          JSON.stringify({ correlationId, payload }),
          (err) => {
            if (err) {
              console.error("Failed to publish request:", err);
              throw new Error("Failed to publish request");
            }
            console.log(`Request published with correlationId: ${correlationId}`);
          }
        );

        const responseTopic = `response/appointment-management/updated/${correlationId}`;
        mqttClient.subscribe(responseTopic, (err) => {
          if (err) {
            console.error("Failed to subscribe to response topic:", err);
            throw new Error("Failed to subscribe to response topic");
          }
          console.log(`Subscribed to response topic: ${responseTopic}`);
        });

        const timeout = setTimeout(() => {
          mqttClient.unsubscribe(responseTopic);
          this.showAlert("Server did not respond. Please try again later.", "error");
        }, 5000);

        mqttClient.on("message", (topic, message) => {
          if (topic === responseTopic) {
            clearTimeout(timeout);
            const response = JSON.parse(message.toString());
            console.log("Response received:", response);

            if (response.status === "success") {
              console.log("success");
              this.showAlert(data.successMessage);
            } else if(response.status === "error") {
              console.error("Error response:", response.message);
              this.showAlert("Appointment could not be booked");
            }

            mqttClient.unsubscribe(responseTopic, (err) => {
              if (err) {
                console.error("Failed to unsubscribe from response topic:", err);
              } else {
                console.log(`Unsubscribed from response topic: ${responseTopic}`);
              }
            });
          }
        });
      } catch (error) {
        console.error("Error in slot card:", error.message);
        this.showAlert("An error occurred while booking slots. Please try again later.",error);
      }
    },
  },
};
</script>

<style scoped>
/* General styles */
.slots-page {
  max-width: 1200px;
  margin: auto;
  padding: 20px;
}

/* Filters container */
.filters-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
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
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.slot-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

/* Responsive styles for different screen sizes */
@media (max-width: 1024px) {
  /* Laptop */
  .slots-page {
    max-width: 100%;
    padding: 15px;
  }

  .day-container {
    flex: 1 0 45%; /* Adjust day container to take up more space */
    min-width: 120px;
  }
}

@media (max-width: 768px) {
  /* Tablet */
  .month-navigation h2 {
    font-size: 1.2rem;
  }

  .days-row {
    flex-direction: column; /* Stack days vertically */
    gap: 10px;
  }

  .day-container {
    flex: 1 0 100%; /* Full width for day container */
  }
}

@media (max-width: 480px) {
  /* Mobile L */
  .month-navigation h2 {
    font-size: 1rem;
  }

  .day-container {
    padding: 8px;
  }

  .available-slot {
    font-size: 0.8rem;
  }
}

@media (max-width: 320px) {
  /* Mobile S */
  .month-navigation h2 {
    font-size: 0.9rem;
  }

  .day-container {
    padding: 5px;
  }

  .available-slot {
    font-size: 0.7rem;
  }
}
</style>
