<template>
    <div>
      <div>
        <img src = /image.png class="banner-image" alt="View from Stenpiren">
      </div>
      <h1 class ="welcome-text">
        Welcome back to Dentist Direct!
      </h1>
      <div v-if="true" class ="row">
        <!-- If the user is logged in, show personalized home page -->
          <card text="Check my appointments" link="my-appointments" class="left-card"></card>
          <card text="Check available times" link="slots"></card>
      </div>
      <div v-else>
        <!-- If the user is not logged in, show generic home page -->
        <b-container fluid>
          <h1 class="display-5 fw-bold">Welcome to DentistDirect</h1>
          <p class="fs-4">Check available slots at your dentist, book and cancel appointments easily.</p>
        </b-container>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios'
  import { inject } from 'vue'  
  import Card from '../components/Card.vue'

  
  export default {
    name: 'home',
    methods: {
      goToMyAppointments() {
        this.$router.push('/my-appointments') 
      },
      checkLoginStatus() {
        this.$router.go() // Reload the component to reflect the new state
      }
    },
    async created() {
      if (this.globalState.isLoggedIn) {
      }
    },
    mounted() {
      window.addEventListener('authChange', this.checkLoginStatus)
    },
    beforeUnmount() {
      window.removeEventListener('authChange', this.checkLoginStatus)
    },
    setup() {
      const globalState = inject('globalState')
      return { globalState }
    },
    data() {
      return {
        // isLoggedIn: this.$isLoggedIn,
        showModal: false,
        showLoginPrompt: false,
      }
    },
    components: {
    }
  }
  </script>
  
  <style scoped>
  
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
    width : 90%;
  }
  .Welcome-text {
    font-size: 40;
  }

  @media (width <= 700px) {
    .left-card {
      margin-left: 30px;
    }
  }

  @media (width <= 305px) {
    .left-card {
      margin-left: 0px;
    }

    .card {
      margin-top: 10px;
    }
  }
  </style>
  