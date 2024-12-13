<template>
  <div class="form-container">
    <h2 class="form-title">Sign Up here</h2>
    <form @submit.prevent="handleSignup" class="signup-form">
     
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

      <button type="submit" class="btn btn-primary">Sign Up</button>
      <span v-if="isLoading">Signing Up...</span>
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
        phoneNumber: ''
      },
      errorMessages: [],
      isLoading: false, // To show loading spinner during request

    };
  },
  methods: {
    validateInfo(){
      this.errorMeesages = []; 
      
      const requiredFields = ['firstName', 'lastName', 'SSN', 'email', 'phoneNumber', 'password'];
      requiredFields.forEach(field => {
        if (!this.user[field]) {
          this.errorMessages.push(`${field} is required.`);
        }
      });
      // Validate phone number length
      if (this.user.phoneNumber && (this.user.phoneNumber.length < 10 || this.user.phoneNumber.length > 15)) {
        this.errorMessages.push('Phone number must be between 10 and 15 characters.');
      }

      // Validate password length
      if (this.user.password && this.user.password.length < 8) {
        this.errorMessages.push('Password must be at least 8 characters long.');
      }

      // Validate SSN length (10 or 12 characters)
      if (this.user.SSN && (this.user.SSN.length !== 10 && this.user.SSN.length !== 12)) {
        this.errorMessages.push('SSN must be in YYMMDDXXXX format or YYYYMMDDXXXX format.');
      }

      // Validate email format
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (this.user.email && !emailPattern.test(this.user.email)) {
        this.errorMessages.push('Invalid email format.');
      }

      // If there are errors, return false, otherwise true
      return this.errorMessages.length === 0;
    },

    async handleSignup() {
      if (!this.validateInfo()) {
        alert(this.errorMessages.join('\n')); // Display all error messages
        return;
      }
      this.isLoading = true; 

      const correlationId = Date.now().toString();
      const requestTopic = 'request/patients/create';  
      const responseTopic = `response/patients/created/${correlationId}`; 

      const payload = {
        correlationId,
        payload: this.user
      };

      console.log('Payload:', payload);

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          console.error('Failed to subscribe to response topic:', err);
          this.isLoading = false;
          alert('Failed to connect to server. Please try again later.');
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          console.error('Failed to publish request to MQTT:', err);
          this.isLoading = false;
          alert('Failed to send request to server. Please try again later.');
          return; 
        }
      });

      const timeout = setTimeout(() => {
        this.isLoading = false;
        mqttClient.unsubscribe(responseTopic);
        alert('Server did not respond. Please try again later.');
      }, 5000);

      mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic); 
          this.isLoading = false;


          if (response.status === 'success') {
            alert('Patient registered successfully');
            localStorage.setItem('user', JSON.stringify(this.user))  // Store user data in localStorage, to stay in "logged in" state
            window.dispatchEvent(new Event('authChange')) 
            this.$router.push('/')  // Redirect to home page after sign-up

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
  margin: 100px auto ;
  
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


/* Sign Up Button */
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