<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <Navbar :loggedIn="loggedIn" @handleAuthAction="handleAuthAction" />

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
import Navbar from './components/Navbar.vue';

export default {
  name: 'App',
  components: {
    MyFooter,
    Navbar
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
      const loggedIn = !!localStorage.getItem('user') // Converts the value into a boolean
      console.log('Is user logged in? ', loggedIn)
      return loggedIn
    },
    handleAuthAction() {
      if (this.isLoggedIn()) {
        console.log('Signing out')
        localStorage.removeItem('user') // removes the localStorage key & value
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
