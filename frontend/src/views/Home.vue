<template>
  <div>
    <div>
      <img src = /image.png class="banner-image" alt="View from Stenpiren">
    </div>
    <h1 class ="welcome-text">
      Your dentist finder in Gothenburg!
    </h1>
    <div v-if="loggedIn" class="row cards-container">
      <card text="My Appointments" link="my-appointments" imgsrc="/find_appointment_2.png"></card>
      <card text="Book Appointment" link="slots" imgsrc="/find_appointment_2.png"></card>
      <card text="Profile" link="profile" imgsrc="/profile3.png"></card>
      <card text="Inbox" link="inbox" imgsrc="/mail3.png">
        <template v-slot:badge>
          <span v-if="unreadCount > 0" class="badge badge-danger">{{ unreadCount }}</span>
        </template>
      </card>
    </div>

    <div v-else>
      <!-- If the user is not logged in, show generic home page -->
      <b-container fluid>
        <p class="fs-4">Check available slots at your dentist, book and cancel appointments easily.</p>
      </b-container>
    </div>
    <!-- MapComponent -->
    <MapComponent></MapComponent>
  </div>
</template>

<script>
import { inject } from 'vue';
import Card from '../components/Card.vue';
import MapComponent from '../components/MapComponent.vue';

  
export default {
  name: 'home-page',
  methods: {
    goToMyAppointments() {
      this.$router.push('/my-appointments') 
    },
    checkLoginStatus() {
      this.$router.go() // Reload the component to reflect the new state
    },
    isLoggedIn() {
    const loggedIn = !!localStorage.getItem('user') // Converts the value into a boolean
    return loggedIn
    },
    updateUnreadCount() {
      const count = parseInt(localStorage.getItem('unreadCount') || '0', 10);
      this.unreadCount = count;
    }
  },
  //async created() {
  //  if (this.globalState.isLoggedIn) {
  //  }
  //},
  mounted() {
    this.loggedIn = this.isLoggedIn();
    this.updateUnreadCount();
    window.addEventListener('authChange', this.checkLoginStatus)
    window.addEventListener('logged-out', this.checkLoginStatus)
    window.addEventListener('new-unreadCount', this.updateUnreadCount)
    window.addEventListener('new-notification', this.updateUnreadCount)
  },
  beforeUnmount() {
    window.removeEventListener('authChange', this.checkLoginStatus)
    window.removeEventListener('logged-out', this.checkLoginStatus)
    window.removeEventListener('new-unreadCount', this.updateUnreadCount)
    window.removeEventListener('new-notification', this.updateUnreadCount)

  },
  setup() {
    const globalState = inject('globalState')
    return { globalState }
  },
  data() {
    return {
      loggedIn: false,
      showModal: false,
      showLoginPrompt: false,
      unreadCount: 0
    }
  },
  components: {
    Card,
    MapComponent
  }
}
</script>
  
<style scoped>

.badge {
  background-color: #30355f !important;
  color: #ffffff !important; 
  border-radius: 12px;
  padding: 0.25em 0.5em;
  font-size: 14px;
}

.checked .custom-control-input:checked {
  background-color: green !important;
  border-color: green !important;
}

.checked b-form-checkbox {
  background-color: green;
}

b-container {
  text-align: center;
  margin-top: 100px;
}

/* Background and Button Colors */
body {
  background-color: var(--background-color);
  color: #2C3E50;
}

.btn_message, .btn-primary {
  background-color: var(--button-color);
  border-color: var(--button-color);
}

.btn_message:hover, .btn-primary:hover {
  background-color: var(--button-hover-color);
  border-color: var(--button-hover-color);
}

/* Toggle Button Group */
.view-toggle {
  width: 100%;
}

.toggle-btn {
  background-color: var(--background-color);
  border-color: var(--footer-bg-color);
  width: 100%;
  transition: background-color 0.2s ease;
  color: #161515;
}

.toggle-btn.active {
  background-color: var(--footer-bg-color);
  border-color: var(--footer-bg-color);
  color: #161515;
}

.toggle-btn:hover {
  background-color: var(--button-color);
  border-color: var(--button-color);
  color: #161515;
}

.b-card:hover {
  background-color: var(--button-color); /* Example: change the background color on hover */
  transition: background-color 0.3s ease; /* Smooth transition */
  cursor: pointer;
}

.banner-image {
  width : 100%;
}
.Welcome-text {
  font-size: 40;
}

.cards-container {
  display: flex;
  justify-content: center;
  gap: 10px; /* Optional: adds spacing between the cards */
  flex-wrap: wrap;
}

@media (width <= 305px) {

  .card {
    margin-top: 10px;
  }
}
</style>
