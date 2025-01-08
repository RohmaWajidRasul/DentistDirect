<template>
  <div class="wrapper">
    <div v-if="selected && smallScreen" class="back-button" @click="goBack()">
      back
    </div>
    
    <div v-if="!selected || !smallScreen" class="message-list">  
      <div 
        v-for="notification in notifications" 
        :key="notification._id" 
        class="inbox" 
        @click="changeStatus(notification)"
      >
        {{ notification.subject }}
        <img 
          v-if="notification.status === 'unread'"
          src="\notification.png"
          class="blue-dot"
        >
      </div>
    </div>

    <div class="body">
      <notification-contents 
        v-if="selected" 
        :mailBody="selected.body"
      />
    </div>

    <div v-if="alertMessage" :class="['alert', `alert-${alertType}`]">
      {{ alertMessage }}
    </div>
  </div>
</template>

<script>
import NotificationContents from './NotificationContents.vue';
import mqttClient from '../mqttClient.js';


export default {
  name: "InboxPage",
  components: { NotificationContents },
  data() {
    return {
      notifications: [],
      selected: null,
      alertMessage: null,
      alertType: 'success'
    };
  },
  mounted() {
    try {
      this.loadNotifications();
    } catch (error) {
      this.showAlert('Failed to load notifications. Please try again later.', 'error');
      console.error('Error loading notifications:', error);
    }
    window.addEventListener('new-notification', this.loadNotifications);
  },
  beforeUnmount() {
    window.removeEventListener('new-notification', this.loadNotifications);
  },
  computed: {
    smallScreen() {
      return window.innerWidth < 801;
    }
  },
  methods: {
    loadNotifications() {
      const storedNotifications = localStorage.getItem('notifications');
      if (storedNotifications) {
        try {
          this.notifications = JSON.parse(storedNotifications);
          this.showAlert('Notifications loaded successfully.', 'success');
        } catch (error) {
          this.showAlert('Failed to parse notifications. Data might be corrupted.', 'error');
          console.error('Error parsing notifications:', error);
        }
      } else {
        this.showAlert('No notifications found.', 'info');
      }
    },

    changeStatus(clicked) {
      if (clicked.status === 'unread') {
        clicked.status = 'read';

        const correlationId = Date.now().toString();
        const requestTopic = 'request/notification-management';
        const responseTopic = `response/notification-management/${correlationId}`;
        //const user = JSON.parse(localStorage.getItem("user"));

        const payload = {
          correlationId,
          payload: {
            notificationId: clicked._id,
            status: "read"
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
          } else {
            console.log("publishing", requestTopic, payload)
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
              //this.showAlert(response.messages);

              const updatedNotifications = this.notifications.map(notification => 
                notification._id === clicked._id ? clicked : notification
              );

              try {
                localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
                this.notifications = updatedNotifications;

                let unreadCount = parseInt(localStorage.getItem('unreadCount'), 10) || 0;
                if (unreadCount > 0) {
                  unreadCount -= 1;
                  localStorage.setItem('unreadCount', unreadCount);
                  window.dispatchEvent(new Event('new-unreadCount'));

                }

                this.showAlert('Notification marked as read.', 'success');
              } catch (error) {
                this.showAlert('Failed to update notification status. Please try again.', 'error');
                console.error('Error updating notification status:', error);
              }
            } else {
              this.showAlert('Login failed: ' + response.message, 'error');
            }
          }
        });
       
      }

      this.selected = clicked;
    },

    showAlert(message, type = 'success') {
      this.alertMessage = message;
      this.alertType = type;

      setTimeout(() => {
        this.alertMessage = null;
      }, 3000);
    },

    goBack() {
      this.selected = null;
    }
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
  text-align: center;
}

.alert {
  position: fixed;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 5px;
  z-index: 1000;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
}

.alert-info {
  background-color: #d1ecf1;
  color: #0c5460;
}

@media (max-width: 800px) {
  .message-list {
    width: 100%;
  }
  .inbox {
    height: 100px;
  }
  .body {
    margin: auto;
  }
}
</style>
