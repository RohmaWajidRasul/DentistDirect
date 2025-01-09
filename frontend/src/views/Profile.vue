<template>
  <div>
    <Alert
      v-if="alertMessage"
      :type="alertType"
      :message="alertMessage"
      @close="alertMessage = null"
    />
    
  </div>
</template>
<script>
import mqttClient from '../mqttClient.js';
import Alert from '../components/Alerts.vue';

export default {
  name: "ProfilePage",
  components : { Alert },
  data() {
    return {
      user: {
        id: null,
        firstName: null,
        lastName: null,
        email: null,
        phoneNumber: null,
        createdAt: null
  
      },
      preferences: null,
      newPassword: ""
    }
  },
  mounted() {
    this.getUser();
    console.log(this.user, this.preferences);

  },
  methods: {
    getUser() {
      const loggedIn = !!localStorage.getItem("user")
      if (loggedIn) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        this.user.id = currentUser.userId,
        this.user.firstName = currentUser.user.firstName;
        this.user.lastName = currentUser.user.lastName;
        this.user.email = currentUser.user.email;
        this.user.phoneNumber = currentUser.user.phoneNumber;
        this.user.createdAt = currentUser.user.createdAt;
        this.preferences = currentUser.user.preferences;


      } else {
        this.$router.push('/login');
      }
    },
    
    editUser() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/manage-patient';
      const responseTopic = `response/manage-patient/${correlationId}`;
      //const user = JSON.parse(localStorage.getItem("user"));

      const payload = {
        correlationId,
        payload: {
          patientId: this.user.id,
          //fields to be updated
        }
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          this.showAlert('Server is unavailable. Please try again later.', 'error');
          console.error('Failed to subscribe to response topic:', err);
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          this.showAlert('Failed to send request to server. Please try again later.', 'error');
          console.error('Failed to publish request to MQTT:', err);
          return;
        } else {
          console.log("publishing", requestTopic, payload)
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        this.showAlert('Server did not respond. Please try again later.');
      }, 5000);

      mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic);

          if (response.status === 'success') {
            //this.showAlert(response.messages);
            localStorage.setItem('user', JSON.stringify({ userId: response.patient._id, email: this.user.email, user: response.patient }));
            this.getUser();
            
          } else {
            this.showAlert('Login failed: ' + response.message, 'error');
          }
        }
      });
    }
  }
}
</script>
