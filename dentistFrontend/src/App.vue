<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <NavbarDentist :loggedIn="loggedIn" @handleAuthAction="handleAuthAction" />
    <!-- Main content -->
    <div class="flex-grow-1">
      <router-view />
    </div>
  </div>
</template>

<script>
import NavbarDentist from "./components/navbar-dentist.vue";
import { inject } from "vue";

export default {
  name: "App",
  components: { NavbarDentist },
  data() {
    return {
      loggedIn: false,
    };
  },
  setup() {
    const globalState = inject("globalState");
    return { globalState };
  },
  methods: {
    isLoggedIn() {
      const loggedIn = !!localStorage.getItem("dentist");
      console.log("Is dentist logged in? ", loggedIn);
      return loggedIn;
    },
    handleAuthAction() {
      if (this.isLoggedIn()) {
        console.log("Signing out dentist");
        localStorage.removeItem("dentist");
        this.loggedIn = false;
        this.globalState.isLoggedIn = false;
        window.dispatchEvent(new Event("authChange"));
        this.$router.push("/");
      } else {
        console.log("Redirecting to login");
        this.$router.push("/login");
      }
    },
    updateLoggedInState() {
      this.loggedIn = this.isLoggedIn();
      console.log("Updated login state: ", this.loggedIn);
    },
  },
  mounted() {
    this.loggedIn = this.isLoggedIn();
    window.addEventListener("authChange", this.updateLoggedInState);
  },
  beforeUnmount() {
    window.removeEventListener("authChange", this.updateLoggedInState);
  },
};
</script>

<style scoped></style>
