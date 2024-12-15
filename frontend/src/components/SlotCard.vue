<template>
    <div class="slot-card-overlay">
      <div class="slot-card">
        <h3>Slot Details</h3>
        <p><strong>Time:</strong> {{ slot.startTime }} - {{ slot.endTime }}</p>
        <p><strong>Location:</strong> {{ slot.location }}</p>
        <p><strong>Dentist:</strong> {{ slot.dentistName }}</p>
        <p><strong>Date:</strong> {{ slot.date }}</p>
        <div class="actions">
          <button class="btn btn-primary" @click="bookSlot">Book</button>
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import mqttClient from '../mqttClient.js';


  export default {
    name: "SlotCard",
    props: {
      slot: Object,
    },
    methods: {
      bookSlot() {
        alert(`Booking slot: ${this.slot.startTime} - ${this.slot.endTime}`);

        this.$emit("book-slot");
        this.$emit("close");
        this.book();
      },
      async book() {
      try {
        const correlationId = Date.now().toString();
        const user = JSON.parse(localStorage.getItem("user"));

        const payload = {
          patientId: user.userId,
          appointmentId: this.slot.id
        };

        console.log("Publishing payload:", payload);

        mqttClient.publish(
          "request/appointment-management/book",
          JSON.stringify({ correlationId, payload }),
          (err) => {
            if (err) {
              console.error("Failed to publish request:", err);
              throw new Error("Failed to publish request");
            }
            console.log(`Request published with correlationId: ${correlationId}`);
          }
        );

        const responseTopic = `response/appointment-management/booked/${correlationId}`;
        mqttClient.subscribe(responseTopic, (err) => {
          if (err) {
            console.error("Failed to subscribe to response topic:", err);
            throw new Error("Failed to subscribe to response topic");
          }
          console.log(`Subscribed to response topic: ${responseTopic}`);
        });

        mqttClient.on("message", (topic, message) => {
          if (topic === responseTopic) {
            const response = JSON.parse(message.toString());
            console.log("Response received:", response);
            console.log("Filtered slots response:", response.appointments);

            if (response.status === "success") {
              alert("succesfully booked")
            } else {
              console.error("Error response:", response.message);
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
        console.error("Error in slotcard:", error.message);
        alert("An error occurred while booking slots. Please try again later.");
      }
    },
    },
  };
  </script>
  
  <style scoped>
  .slot-card-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .slot-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: left;
    max-width: 400px;
    width: 100%;
  }
  
  .slot-card h3 {
    margin-bottom: 15px;
  }
  
  .slot-card p {
    margin-bottom: 10px;
  }
  
  .actions {
    display: flex;
    justify-content: space-between;
  }
  
  .btn {
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  }
  
  .btn-primary {
    background-color: #007bff;
    color: white;
  }
  
  .btn-secondary {
    background-color: #6c757d;
    color: white;
  }
  </style>
  