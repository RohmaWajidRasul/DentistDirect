<template>
  <div class="form-container">
    <h2 class="form-title">Sign Up here</h2>
    <form @submit.prevent="handleSubmit" class="signup-form">
     
      <div class="form-group">
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

      <div class="form-group">
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
      
      <div class = "form-group">
        <label for="SSN">Social Security Number</label>
        <input
          type="text"
          class="form-control"
          id="SSN"
          v-model="user.SSN"
          placeholder="Enter your social security number"
          required
        />
      </div>

      <div class="form-group">
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

      <div class="form-group">
        <label for="password">Password</label>
        <input
          type="password"
          class="form-control"
          id="password"
          v-model="user.password"
          placeholder="Enter your password"
          required
        />
      </div>

      <div class="form-group">
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

      <div class="form-group">
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
        SSN: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: ''
      },
    };
  },
  methods: {
    async handleSubmit() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/patients/create';  
      const responseTopic = `response/patients/created/${correlationId}`; 

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
            this.$router.push('/');
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
:root {
  --background-color: #f4f4f9; /* Light background */
  --button-color: #007bff; /* Blue button color */
  --button-hover-color: #0056b3; /* Darker blue when hovered */
  --text-color: #2C3E50; /* Darker text color */
}
.form-container {
  background-color: #f4f4f9;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.form-title {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 5px;
  color: #555;
}


/* Submit Button */
.btn-primary {
  width: 100%;
  padding: 10px 15px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #0056b3;
}

/* Responsive Design */
@media (max-width: 700px) {
  .form-container {
    padding: 15px;
  }

  .form-title {
    font-size: 20px;
  }

  .form-control {
    font-size: 13px;
    padding: 8px;
  }

  .btn-primary {
    font-size: 14px;
    padding: 8px;
  }
}
</style>