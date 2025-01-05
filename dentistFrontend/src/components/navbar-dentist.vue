<template>
  <b-navbar toggleable="lg" class="navbar-custom justify-content-end">
    <b-navbar-brand class="nav-brand" to="/" href="#"
      >DentistDirect</b-navbar-brand
    >
    <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>
    <b-collapse id="nav-collapse" is-nav>
      <b-navbar-nav class="ml-auto">
        <!-- If the user is not logged in, show Login and Sign Up links -->
        <b-nav-item class="nav-menu-item" v-if="!loggedIn" to="/login"
          >Login</b-nav-item
        >
        <b-nav-item class="nav-menu-item" v-if="!loggedIn" to="/register"
          >Sign Up</b-nav-item
        >

        <!-- If the user is logged in, show Logout and Available Slots -->
        <b-nav-item
          class="nav-menu-item"
          v-if="loggedIn"
          @click="handleAuthAction"
          >Logout</b-nav-item
        >
        <b-nav-item class="nav-menu-item" v-if="loggedIn" to="/add-time-slots"
          >Add time slots</b-nav-item
        >
        <b-nav-item
          class="nav-menu-item"
          v-if="loggedIn"
          to="/view-booked-slots"
          >Available Slots</b-nav-item
        >
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>
  
  <script>
import {
  BNavbar,
  BNavbarBrand,
  BNavbarToggle,
  BCollapse,
  BNavbarNav,
  BNavItem,
} from "bootstrap-vue-next";
export default {
  name: "NavbarDentist",
  components: {
    BNavbar,
    BNavbarBrand,
    BNavbarToggle,
    BCollapse,
    BNavbarNav,
    BNavItem,
  },
  props: {
    // "logged-in" status passed down from App.vue
    loggedIn: {
      type: Boolean,
      required: true,
    },
  },
  methods: {
    handleAuthAction() {
      this.$emit("handleAuthAction"); // Triggers the handleAuthAction function in App.vue
    },
  },
};
</script>
  
  <style scoped>
.nav-brand {
  color: rgb(44, 53, 60);
  text-decoration: none;
}

.nav-brand:hover {
  color: rgb(77, 97, 104);
}

.nav-brand:active {
  color: rgb(84, 95, 107);
}

.nav-brand:focus {
  outline: 2px solid #67b8db;
  outline-offset: 1px;
}
</style>