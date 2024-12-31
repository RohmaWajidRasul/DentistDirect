<template>
  <div class="wrapper">
    <div v-if="selected && smallScreen" class="back-button" @click="goBack()">
      back
    </div>
    
    <div v-if="!selected || !smallScreen" class="message-list">  
      <div v-for="notification in notifications" :key="notification._id" class="inbox" @click="changeStatus(notification)">
        {{ notification.subject }}
        <img v-if="notification.status=='unread'"
        src="\notification.png"
        class="blue-dot"
        >
      </div>
    </div>
    <div class="body">
      <notification-contents v-if="selected" :mailBody="selected.body"></notification-contents>
    </div>
  </div>
</template>

<script>
import mqttClient from '../mqttClient.js';
import NotificationContents from './NotificationContents.vue';


export default {
  name: "inbox",
  components: { NotificationContents },
  data() {
    return {
      isLoading: false,
      alertMessage: null,
      alertType: 'success',
      notifications: [],
      selected: null
    };
  },
  mounted() {
    this.fillInbox();
  },
  computed: {
    smallScreen() {
      return window.innerWidth < 801;
    }
  },
  methods: {
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
    },
    changeStatus(clicked) {
      this.selected = clicked

      const correlationId = Date.now().toString();
      const requestTopic = 'request/notification-managment';
      const responseTopic = `response/messages/read/${correlationId}`;
      //const user = JSON.parse(localStorage.getItem("user"));




      const payload = {
        correlationId,
        payload: {
          messageId: clicked._id
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
          } else {
            this.showAlert('Login failed: ' + response.message, 'error');
          }
        }
      });

    },
    goBack() {
      this.selected = null
    },


  }
};
</script>

<style scoped>
.inbox {

  border: solid black;
  height: 70px;
  cursor: pointer;
  text-align: center;
  padding-top: 20px;
  
}

.wrapper {
  display: flex;
}

.inbox:hover {
  background-color: lightgray;
}

.inbox:click {
  background-color: blue;
}

.back-button {
  margin-left: 10px;
  text-align: left;
  cursor: pointer;
  top: 50px;
}

.blue-dot {
  width: 30px;
  align-content: center;
  position: relative;
  left: 10px;
}

.message-list {
  border-right: solid black;
  width: 30%;
  text-align: center;
}

.body {
  float: top;
  text-align: center;

}

@media (max-width: 800px) {

  .message-list {
    width: 100%
  }

  .inbox {
    height: 100px;
  }

}
</style>