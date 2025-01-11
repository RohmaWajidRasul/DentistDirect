<template>
  <div>
    <h1>Create Time Slot</h1>
    <form class="form" @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="date">Date:</label>
        <input type="date" v-model="formData.date" required />
      </div>
      <div class="form-group">
        <label for="startTime">Start Time:</label>
        <input type="time" v-model="formData.startTime" required />
      </div>
      <div class="form-group">
        <label for="endTime">End Time:</label>
        <input type="time" v-model="formData.endTime" required />
      </div>
      <div class="button-div">
        <button type="submit">Create Slot</button>
      </div>
    </form>
    <p v-if="successMessage">{{ successMessage }}</p>
    <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
  </div>
</template>


<script>
import { createAppointment } from "../api";

export default {
  data() {
    return {
      formData: {
        dentistId: "",
        clinicId: "",
        date: "",
        startTime: "",
        endTime: "",
        duration: "",
      },
      successMessage: "",
      errorMessage: "",
    };
  },
  methods: {
    async handleSubmit() {
      try {
        const response = await createAppointment(this.formData);
        console.log("At least there is an id:", this.formData.dentistId); // Debugging
        this.successMessage = "Time slot created successfully!";
        this.errorMessage = "";
      } catch (error) {
        this.successMessage = "";
        this.errorMessage = "Failed to create time slot.";
      }
    },
  },

  mounted() {
    const dentist = localStorage.getItem("dentist");
    if (dentist) {
      try {
        const dentistObject = JSON.parse(dentist);
        this.formData.dentistId = dentistObject._id;
        this.formData.clinicId = dentistObject.clinicId;
        console.log("Dentist ID and clininc ID retrieved:", this.formData.dentistId, this.formData.clinicId); // Debugging
      } catch (error) {
        console.error("Error parsing dentist data from localStorage:", error);
      }
    } else {
      console.error("Dentist data not found. Ensure the user is logged in.");
    }
  },
};
</script>
  
<style scoped>
.form {
  color: black;
  text-align: left;
  padding: 40px;
}
.form-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
label {
  margin-right: 10px;
  min-width: 140px;
}
.button-div {
  display: flex;
  justify-content: center;
  width: 100%;
}
button {
  display: flex;
  align-items: center;
  margin: 30px;
  border: 1px solid black;
  border-radius: 4px;
  background-color: #6fd2f3;
}
h1 {
  padding: 40px;
}
</style>