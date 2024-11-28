<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <b-navbar toggleable="lg" class="navbar-custom justify-content-end">
      <b-navbar-brand to="/" href="#">DentistDirect</b-navbar-brand>
      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item to="/" exact :active-class="active-tab" :exact-active-class="'exact-active-tab'">Home</b-nav-item>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>

    <!-- Main content -->
    <div class="flex-grow-1">
      <router-view/>
    </div>

    <!-- Footer -->
    <MyFooter />
  </div>
</template>

<script>
import MyFooter from './components/MyFooter.vue'
import { inject } from 'vue'

export default {
  name: 'App',
  components: {
    MyFooter
  },
  data() {
    return {
      loggedIn: false // Initialize from localStorage
    }
  },
  setup() {
    const globalState = inject('globalState')
    return { globalState }
  },
  methods: {
    isLoggedIn() {
      const loggedIn = !!localStorage.getItem('userId') // Converts the value into a boolean
      console.log('Is user logged in? ', loggedIn)
      return loggedIn
    },
    handleAuthAction() {
      if (this.isLoggedIn()) {
        console.log('Signing out')
        localStorage.removeItem('userId') // removes the localStorage key & value
        localStorage.removeItem('calendarId') // removes the localStorage key & value
        this.loggedIn = false // Update loggedIn status
        this.globalState.isLoggedIn = false
        this.$router.push('/')
      } else {
        console.log('Redirecting to login')
        this.$router.push('/login')
      }
    },
    updateLoggedInState() {
      this.loggedIn = this.isLoggedIn() // Update loggedIn state when auth changes
      console.log('Updated login state: ', this.loggedIn)
    }
  },
  mounted() {
    this.loggedIn = this.isLoggedIn() // Set initial login state
    window.addEventListener('authChange', this.updateLoggedInState)
  },
  beforeUnmount() {
    window.removeEventListener('authChange', this.updateLoggedInState)
  }
}
</script>

<style>
:root {
   --navbar-bg-color: #F2CC8F; /* Warm pastel yellow */
  --navbar-text-color: #4A403A; /* Soft dark brown for good contrast */
  --navbar-active-text-color: #E07A5F; /* Muted pastel coral for active text */
  --button-color: #E29578; /* Warm pastel coral for buttons */
  --button-hover-color: #D67C57; /* Slightly deeper coral for hover effect */
  --background-color: #F4E1D2; /* Light warm peach for background */
  --footer-bg-color: #F2CC8F; /* Same as navbar for consistency */
  --footer-text-color: #4A403A; /* Soft dark brown for footer text */
  --text-color: #4A403A; /* Consistent soft dark brown for readability */
  /* Gradient background for sections */
  --section-gradient-bg: linear-gradient(135deg, #F4E1D2, #F2CC8F); /* Gradient from warm peach to pastel yellow */
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
}

.app-container {
  background-color: var(--background-color);
}

/* Ensure content pushes footer to bottom */
.flex-grow-1 {
  flex-grow: 1;
}

.active-tab {
  color: var(--navbar-active-text-color) !important;
  font-weight: bold; /* Optional: Make active tab bold */
}

.ml-auto {
  margin-left: auto !important;
}

/* Navbar Color */
.navbar-custom {
  background-color: var(--navbar-bg-color) !important;
  color: var(--navbar-text-color);
}

.navbar-custom a {
}

.navbar-custom a:hover,
.router-link-exact-active {
  color: var(--navbar-active-text-color) !important;
}

/* Background and Button Colors */
body {
  background-color: var(--background-color);
  color: #2C3E50;
}

.btn_message,
.btn-primary {
  background-color: var(--button-color);
  border-color: var(--button-color);
}

.btn_message:hover,
.btn-primary:hover {
  background-color: var(--button-hover-color);
  border-color: var(--button-hover-color);
}

/* Footer styles */
.footer {
  background-color: var(--footer-bg-color);
  color: var(--footer-text-color);
  padding: 0.2em 0; /* Reduce the padding to decrease height */
  text-align: center;
  width: 100%;
}

.footer a {
  color: var(--footer-text-color);
  margin: 0 10px;
  font-size: 1.0em;
}

/* Adjust icon spacing */
.footer-icon {
  margin: 0 10px;
}

.footer a:hover {
  color: var(--navbar-active-text-color);
}
</style>
