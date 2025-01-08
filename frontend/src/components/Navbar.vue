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
        <!-- Inbox with unread notifications badge -->
        <b-nav-item v-if="loggedIn" to="/inbox" :active-class="active-tab">
          Inbox
          <span v-if="unreadCount > 0" class="badge badge-danger">{{ unreadCount }}</span>
        </b-nav-item>
      </b-navbar-nav>
    </b-collapse>
  </b-navbar>
</template>

<script>
export default {
  props: {
    loggedIn: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      unreadCount: 0
    };
  },
  methods: {
    handleAuthAction() {
      this.$emit('handleAuthAction');
    },
    updateUnreadCount() {
      const count = parseInt(localStorage.getItem('unreadCount') || '0', 10);
      this.unreadCount = count;
    }
  },
  mounted() {
    this.updateUnreadCount();
    // Update unread count when a new notification arrives
    window.addEventListener('new-unreadCount', this.updateUnreadCount);
    window.addEventListener('new-notification', this.updateUnreadCount);
  },
  beforeUnmount() {
    window.removeEventListener('new-unreadCount', this.updateUnreadCount);
    window.removeEventListener('new-notification', this.updateUnreadCount);
  }
};
</script>

<style>
.badge {
  margin-left: 8px;
  font-size: 0.8rem;
  vertical-align: top;
  background-color: rgb(131, 186, 248); /* Highlight badge */
  color: black;
  padding: 4px 8px;
  border-radius: 12px;
}

</style>
