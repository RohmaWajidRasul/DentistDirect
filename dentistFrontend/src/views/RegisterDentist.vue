<template>
  <div class="form-container">
    <!-- Alert Messages -->
    <Alert
      v-if="alertMessage"
      :type="alertType"
      :message="alertMessage"
      @close="alertMessage = null"
    />

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
          autocomplete="given-name"
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
          autocomplete="family-name"
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
          autocomplete="email"
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
          autocomplete="new-password"
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
        <label for="specialization">Specialization</label>
        <input
          type="text"
          class="form-control"
          id="specialization"
          v-model="user.specialization"
          placeholder="Enter your specialization"
          required
        />
      </div>
      <div class="btn-hugger">
      <button type="submit" class="btn btn-primary" :disabled="isLoading">Sign Up</button>
      <span v-if="isLoading">Signing Up...</span>
      </div>
    </form>
  </div>
</template>
  
  <script>
import { registerDentist } from "../api";
import Alert from "../components/DentistAlerts.vue";

export default {
  components: { Alert },
  data() {
    return {
      user: {
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
        specialization: "",
        clinicId: "677d7308d21b0c633e3092b1"
      },
      errorMessages: [],
      alertMessage: null,
      alertType: "success",
      isLoading: false,
    };
  },
  methods: {
    validateInfo() {
      this.errorMessages = [];

      const requiredFields = [
        "firstName",
        "lastName",
        "email",
        "phoneNumber",
        "password",
        "specialization"
      ];
      // Check if all required fields are filled
      requiredFields.forEach((field) => {
        if (!this.user[field]) {
          this.errorMessages.push(`${field} is required.`);
        }
      });

      // Validate email format
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (this.user.email && !emailPattern.test(this.user.email)) {
        this.errorMessages.push("Invalid email format.");
      }

      // Validate phone number length
      if (
        this.user.phoneNumber &&
        (this.user.phoneNumber.length < 10 || this.user.phoneNumber.length > 15)
      ) {
        this.errorMessages.push(
          "Phone number must be between 10 and 15 characters."
        );
      }

      // Validate password length
      if (this.user.password && this.user.password.length < 8) {
        this.errorMessages.push("Password must be at least 8 characters long.");
      }

      // Validate specialization
      if (this.user.specialization && this.user.specialization.length < 3) {
        this.errorMessages.push(
          "Specialization must be at least 3 characters long."
        );
      }

      return this.errorMessages.length === 0;
    },

    async handleSignup() {
      if (!this.validateInfo()) {
        this.showAlert(this.errorMessages.join("\n")); // Display all error messages
        return;
      }
      this.isLoading = true;

      try {
        const response = await registerDentist(this.user);
        if (response.status === "success") {
          this.showAlert("Dentist registered successfully!", "success");
          this.$router.push("/login"); // Redirect to login page
        } else {
          this.showAlert(
            `Failed to register dentist: ${response.message}`,
            "error"
          );
        }
      } catch (error) {
        this.showAlert("Error during registration. Please try again.", "error");
      } finally {
        this.isLoading = false;
      }
    },

    showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
    },
  },
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

