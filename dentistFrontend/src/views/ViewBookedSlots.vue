<template>
  <div>
    <h1>Booked Slots</h1>
    <div class="list">
      <ul v-if="appointments.length">
        <li v-for="slot in appointments" :key="slot._id">
          <div class="slot">
            {{ slot.date }} | {{ slot.startTime }} - {{ slot.endTime }} |
            Patient: {{ slot.patient?.firstName }} {{ slot.patient?.lastName }}
            {{ slot.patient?.phoneNumber }}
          </div>
        </li>
      </ul>
      <p v-else>No booked slots available.</p>
    </div>
  </div>
</template>

<script>
import { getBookedAppointmentsForDentist } from "../api";

export default {
  data() {
    return {
      appointments: [],
    };
  },
  async created() {
    try {
      // Fetch the dentistId from localStorage
      const loggedInDentist = JSON.parse(localStorage.getItem("dentist"));
      const dentistId = loggedInDentist?._id; // Assuming _id is the dentist's ID
      console.log(dentistId);
      if (!dentistId) {
        console.error("Dentist ID not found. Please log in again.");
        return;
      }

      const response = await getBookedAppointmentsForDentist(dentistId);
      this.appointments = response.appointments;
    } catch (error) {
      console.error("Error loading booked slots:", error);
    }
  },
};
</script>

  <style scoped>
.list {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100vh;
  text-align: center;
  padding: 10px;
}
li {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  display: flex;
  justify-content: center;
  width: 100%;
}
.slot {
  border: 1px solid black;
  border-radius: 4px;
  padding: 10px;
  background-color: #6fd2f3;
  width: 100%;
}
</style>
