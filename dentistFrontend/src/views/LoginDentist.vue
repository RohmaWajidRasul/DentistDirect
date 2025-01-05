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
          autocomplete="password"
        />
      </div>

      <button type="submit" class="btn btn-primary">Login</button>
      <span v-if="isLoading">Logging in...</span>
    </form>
  </div>
</template>
  
  <script>
import { api } from "../api";
import Alert from "../components/DentistAlerts.vue";
import { loginDentist } from "../api";

export default {
  components: { Alert },
  data() {
    return {
      user: {
        email: "",
        password: "",
      },
      isLoading: false,
      alertMessage: null,
      alertType: "success",
    };
  },
  methods: {
    async handleLogin() {
      if (!this.user.email || !this.user.password) {
        this.showAlert("Email and password are required.", "error");
        return;
      }

      try {
        this.isLoading = true;
        const response = await loginDentist(this.user);
        this.isLoading = false;

        console.log("Login Response:", response); // Debugging

        if (response?.status === "success") {
          localStorage.setItem("dentist", JSON.stringify(response.dentist));
          this.showAlert("Login successful!", "success");
          window.dispatchEvent(new Event("authChange"));
          this.$router.push("/");
        } else {
          this.showAlert(
            "Login failed: " + (response?.message || "Unknown error"),
            "error"
          );
        }
      } catch (error) {
        this.isLoading = false;
        console.error("Login error:", error);
        this.showAlert("Failed to log in. Please try again later.", "error");
      }
    },
    showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
    },
  },
};
</script>
