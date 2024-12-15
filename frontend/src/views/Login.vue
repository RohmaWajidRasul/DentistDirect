<template>
    <div class="form-container">
      <!-- Alert Messages -->
      <Alert
        v-if="alertMessage"
        :type="alertType"
        :message="alertMessage"
        @close="alertMessage = null"
      />
      <h2 class="form-title">Login here</h2>
      <form @submit.prevent="handleLogin" class="login-form">
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
  
        <button type="submit" class="btn btn-primary">Login</button>
        <span v-if="isLoading">Logging in...</span>

      </form>
    </div>
  </template>
  
  <script>
  import mqttClient from '../mqttClient.js';
  import Alert from '../components/Alerts.vue';
  
  export default {
    components : { Alert },
    data() {
      return {
        user: {
          email: '',
          password: ''
        },
        isLoading: false,
        alertMessage: null, 
        alertType: 'success'
      };
    },
    methods: {
      async handleLogin() {
        if (!this.user.email || !this.user.password) {
          this.showAlert('Email and password are required.');
          return;
        }

        this.isLoading = true; 
        const correlationId = Date.now().toString();
        const requestTopic = 'request/patients/login';  
        const responseTopic = `response/patients/loggedIn/${correlationId}`; 
  
        const payload = {
          correlationId,
          payload: this.user
        };
  
        mqttClient.subscribe(responseTopic, (err) => {
          if (err) {
            this.isLoading = false;
            this.showAlert('Server is unavailable. Please try again later.', 'error');
            console.error('Failed to subscribe to response topic:', err);
            return;
          }
        });
  
        mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
          if (err) {
            this.isLoading = false;
            this.showAlert('Failed to send request to server. Please try again later.', 'error');
            console.error('Failed to publish request to MQTT:', err);
            return;
          }
        });

        const timeout = setTimeout(() => {
          this.isLoading = false;
          mqttClient.unsubscribe(responseTopic);
          this.showAlert('Server did not respond. Please try again later.');
        }, 5000);
  
        mqttClient.on('message', (topic, message) => {
          if (topic === responseTopic) {
            clearTimeout(timeout);
            const response = JSON.parse(message.toString());
            mqttClient.unsubscribe(responseTopic);
            this.isLoading = false;
  
            if (response.status === 'success') {
              // Store user info in localStorage to keep user in "logged in" state
              localStorage.setItem('user', JSON.stringify({ userId: response.patient._id, email: this.user.email }));
             // Store user data in localStorage, to stay in "logged in" state
              window.dispatchEvent(new Event('authChange')) 
              // Redirect to home page
              this.$router.push('/');
              this.showAlert('Login successful', 'success');

            } else {
              this.showAlert('Login failed: ' + response.message, 'error');
            }
          }
        });
      },
      showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
    }

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
    margin: 150px auto 0;
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
  
  .btn-primary {
    width: 100%;
    padding: 10px 15px;
    font-size: 16px;
    color: white;
    background-color: #51b2dd;
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
  