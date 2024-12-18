<template>
    <div class="form-container">

      <div v-for="notification in notifications"
      :key="notification._id">
      {{ notification.subject }}
        {{ notification.body }}
      </div>

    </div>
  </template>
  
  <script>
  import mqttClient from '../mqttClient.js';
  import Alert from './Alerts.vue';
  
  export default {
    name: "inbox",
    components : { Alert },
    data() {
      return {
        isLoading: false,
        alertMessage: null, 
        alertType: 'success',
        notifications: []
      };
    },
    mounted() {
      this.fillInbox();
    },
    methods: {
      async fillInbox() {


        const correlationId = Date.now().toString();
        const requestTopic = 'request/messages/fetch';  
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
            this.showAlert('Server is unavailable. Please try again later.', 'error');
            console.error('Failed to subscribe to response topic:', err);
            return;
          }
        });
  
        mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
          if (err) {
            this.isLoading = false;
            this.showAlert('Failed to send request to server. Please try again later.', 'error');
            console.error('Failed to publish request to MQTT:', err);
            return;
          }
        });

        const timeout = setTimeout(() => {
          this.isLoading = false;
          mqttClient.unsubscribe(responseTopic);
          this.showAlert('Server did not respond. Please try again later.');
        }, 5000);
  
        mqttClient.on('message', (topic, message) => {
          if (topic === responseTopic) {
            clearTimeout(timeout);
            const response = JSON.parse(message.toString());
            mqttClient.unsubscribe(responseTopic);
            this.isLoading = false;
  
            if (response.status === 'success') {
              
              this.showAlert(response.messages);
              this.notifications = response.messages;
            } else {
              this.showAlert('Login failed: ' + response.message, 'error');
            }
          }
        });
      },
      showAlert(message, type) {
      this.alertMessage = message;
      this.alertType = type;
    }
    
    }
};
  </script>
  
  <style scoped>
  </style>
  