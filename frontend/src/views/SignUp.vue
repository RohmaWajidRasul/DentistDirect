<template>
  <div class="container mt-5">
    <h2>Sign Up to Dentist Direct</h2>
    <form @submit.prevent="handleSubmit">

      <div class="form-group col-md-6">
        <label for="firstName">First Name</label>
        <input
          type="text"
          class="form-control"
          id="firstName"
          v-model="user.firstName"
          placeholder="Enter your first name"
          required
        />
      </div>

      <div class="form-group col-md-6">
        <label for="lastName">Last Name</label>
        <input
          type="text"
          class="form-control"
          id="lastName"
          v-model="user.lastName"
          placeholder="Enter your last name"
          required
        />
      </div>

      <div class="form-group col-md-6">
        <label for="email">Email</label>
        <input
          type="email"
          class="form-control"
          id="email"
          v-model="user.email"
          placeholder="Enter your email"
          required
        />
      </div>

      <div class="form-group col-md-6">
        <label for="phoneNumber">Phone Number</label>
        <input
          type="tel"
          class="form-control"
          id="phoneNumber"
          v-model="user.phoneNumber"
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div class="form-group col-md-6">
        <label for="dateOfBirth">Date of Birth</label>
        <input
          type="date"
          class="form-control"
          id="dateOfBirth"
          v-model="user.dateOfBirth"
          required
        />
      </div>

      <button type="submit" class="btn btn-primary">Sign Up</button>
    </form>
  </div>
</template>

<script>
import mqttClient from '../mqttClient.js';

export default {
  data() {
    return {
      user: {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: ''
      },
    };
  },
  methods: {
    async handleSubmit() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/patient/create';  
      const responseTopic = `response/patient/created/${correlationId}`; 

      const payload = {
        correlationId,
        payload: this.user
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          console.error('Failed to subscribe to response topic:', err);
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          console.error('Failed to publish request to MQTT:', err);
        }
      });

      mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic); 

          if (response.status === 'success') {
            alert('Patient registered successfully');
            this.resetForm();
          } else {
            alert('Failed to register patient: ' + response.message);
          }
        }
      });
    },
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>

  