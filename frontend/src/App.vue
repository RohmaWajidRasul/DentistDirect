<template>
  <div id="app" class="d-flex flex-column min-vh-100">
    <!-- Navbar -->
    <Navbar :loggedIn="loggedIn" @handleAuthAction="handleAuthAction"
    :admin="isAdmin"
    />

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
import mqttClient from './mqttClient.js';


export default {
  name: 'App',
  components: {
    MyFooter,
    Navbar
  },
  data() {
    return {
      loggedIn: false, // Initialize from localStorage
      isAdmin: false
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
      this.globalState.isLoggedIn = loggedIn;
      return loggedIn
    },

    handleAuthAction() {
      if (this.isLoggedIn()) {
        console.log('Signing out');

        const user = JSON.parse(localStorage.getItem("user"));
        this.unsubscribeFromNotifications(user.userId);

        localStorage.removeItem('user'); // removes the localStorage key & value
        localStorage.removeItem('calendarId'); // removes the localStorage key & value
        localStorage.removeItem('motifications'); // removes the localStorage key & value

        window.dispatchEvent(new Event('logged-out'));

        this.isAdmin = false;
        this.loggedIn = false; // Update loggedIn status
        this.globalState.isLoggedIn = false;
        this.$router.push('/');
      } else {
        console.log('Redirecting to login');
        this.$router.push('/login');
      }
    },
    isAdminLoggedIn() {
      if(this.loggedIn) {
        const user = JSON.parse(localStorage.getItem("user"))
        console.log(user)
        this.isAdmin = user.isAdmin;
      } else {
        this.isAdmin = false;
      }
    },
    
    async fillInbox() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/get-notification';
      const responseTopic = `response/messages/fetched/${correlationId}`;
      const user = JSON.parse(localStorage.getItem("user"));
      const payload = {
        correlationId,
        payload: {
          patientId: user.userId
        }
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          //this.showAlert('Server is unavailable. Please try again later.', 'error');
          console.error('Failed to subscribe to response topic:', err);
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          //this.showAlert('Failed to send request to server. Please try again later.', 'error');
          console.error('Failed to publish request to MQTT:', err);
          return;
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        //this.showAlert('Server did not respond. Please try again later.');
      }, 5000);

      mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic);

          if (response.status === 'success') {

            //this.showAlert(response.messages);
            localStorage.setItem('notifications', JSON.stringify(response.notifications));
            this.updateUnreadCount(response.notifications);
            //console.log(localStorage.getItem('notifications'));
          } else {
            //this.showAlert('Login failed: ' + response.message, 'error');
          }
        }
      });
    },

    updateUnreadCount(notifications) {
      const unreadCount = notifications.filter(n => n.status === 'unread').length;
      localStorage.setItem('unreadCount', unreadCount);
      //console.log(unreadCount);
    },

    updateLoggedInState() {
      this.loggedIn = this.isLoggedIn() // Update loggedIn state when auth changes
      if (this.loggedIn) {
        this.fillInbox();
        this.isAdminLoggedIn();


        const user = JSON.parse(localStorage.getItem("user"));
        this.subscribeToNotifications(user.userId);
      }
      console.log('Updated login state: ', this.loggedIn)
    },

    subscribeToNotifications(currentPatientId) {
      if (!currentPatientId) return;

      const responseTopic = `response/create-notifcation/${currentPatientId}/+`;
      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          console.error('Failed to subscribe:', err);
          return;
        } else {
          console.log("Subscribed to", responseTopic);
        }
      });

      mqttClient.on('message', (topic, message) => {
        if (topic.startsWith(`response/create-notifcation/${currentPatientId}/`)) {
          const response = JSON.parse(message.toString());
          if (response.status === 'success') {
            console.log("New notification recieved", topic);

            this.addNotificationToLocalStorage(response.newNotification);
          }
        }
      });
    },
    unsubscribeFromNotifications(currentPatientId) {
      if (currentPatientId) {
        const responseTopic = `response/create-notifcation/${currentPatientId}/+`;
        mqttClient.unsubscribe(responseTopic, (err) => {
          if (err) {
            console.error('Failed to unsubscribe:', err);
          }
        });
        
      }
    },
    addNotificationToLocalStorage(notification) {
      const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
      notifications.unshift(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      const unreadCount = parseInt(localStorage.getItem('unreadCount') || '0', 10) + 1;
      localStorage.setItem('unreadCount', unreadCount);
      console.log("Triggered new notification")
      window.dispatchEvent(new Event('new-notification')) 
    }
  },
  
  mounted() {
    this.loggedIn = this.isLoggedIn() // Set initial login state
    if (this.loggedIn) {
      this.fillInbox();
      const user = JSON.parse(localStorage.getItem("user"));
      this.isAdminLoggedIn();

      this.subscribeToNotifications(user.userId);

    }
    window.addEventListener('authChange', this.updateLoggedInState)
  },
  beforeUnmount() {
    window.removeEventListener('authChange', this.updateLoggedInState)
  }
}
</script>
