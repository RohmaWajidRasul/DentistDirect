<template>
  <b-navbar toggleable="lg" class="navbar-custom justify-content-end">
    <b-navbar-brand to="/" href="#">DentistDirect</b-navbar-brand>
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto">
      <!-- If the user is not logged in, show Login and Sign Up links -->
        <b-nav-item v-if="!loggedIn" to="/login">Login</b-nav-item>
        <b-nav-item v-if="!loggedIn" to="/signup">Sign Up</b-nav-item>
      <!-- If the user is logged in, show Logout -->
        <b-nav-item v-if="loggedIn" @click="handleAuthAction">Logout</b-nav-item>
        <b-nav-item to="/slots" :active-class="active-tab">Available Slots</b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
export default {
  props: { // "logged-in" status passed down from app.vue 
    loggedIn: {
      type: Boolean,
      required: true
    }
  },
  methods: {
    handleAuthAction() {
      this.$emit('handleAuthAction') // Triggers the handleAuthAction function in app.vue
    }
  }
}
</script>
