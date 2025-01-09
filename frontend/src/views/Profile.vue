<template>
  <div>
    <Alert
      v-if="alertMessage"
      :type="alertType"
      :message="alertMessage"
      @close="alertMessage = null"
    />

    <div class="profile-container">
      <div class="box left-box">
        <h3>Your details</h3>
        <div class="user-info">
          <div>
            <label>First Name:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.firstName"
              type="text"
            />
            <span v-else>{{ user.firstName }}</span>
          </div>

          <div>
            <label>Last Name:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.lastName"
              type="text"
            />
            <span v-else>{{ user.lastName }}</span>
          </div>

          <div>
            <label>Email:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.email"
              type="email"
            />
            <span v-else>{{ user.email }}</span>
          </div>

          <div>
            <label>Phone Number:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.phoneNumber"
              type="text"
            />
            <span v-else>{{ user.phoneNumber }}</span>
          </div>

        </div>

        <div class="actions">
          <button v-if="!isEditing" @click="isEditing = true">Edit</button>
          <button v-if="isEditing" @click="confirmEdit">Confirm</button>
          <button v-if="isEditing" @click="cancelEdit">Cancel</button>
        </div>
      </div>

      <!-- Right box (placeholder for future content) -->
      <div class="box right-box">
        <h3>Your Preferences</h3>
        <div class="preferences-info">
          <div>
            <label>Clinic:</label>
            <input
              v-if="isEditingPreferences"
              v-model="editedPreferences.clinic"
              type="text"
            />
            <span v-else>{{ preferences.clinic }}</span>
          </div>
          <div>
            <label>Date Range:</label>
            <input
              v-if="isEditingPreferences"
              v-model="editedPreferences.dateRange.startDate"
              type="date"
            />
            <span v-else>{{ preferences.dateRange.startDate }}</span>
            to
            <input
              v-if="isEditingPreferences"
              v-model="editedPreferences.dateRange.endDate"
              type="date"
            />
            <span v-else>{{ preferences.dateRange.endDate }}</span>
          </div>
          <div>
            <label>Dentist:</label>
            <input
              v-if="isEditingPreferences"
              v-model="editedPreferences.dentist"
              type="text"
            />
            <span v-else>{{ preferences.dentist }}</span>
          </div>
          <div>
            <label>Specialization:</label>
            <input
              v-if="isEditingPreferences"
              v-model="editedPreferences.specialization"
              type="text"
            />
            <span v-else>{{ preferences.specialization }}</span>
          </div>
        </div>

        <div class="actions">
          <button
            v-if="!isEditingPreferences"
            @click="isEditingPreferences = true"
          >
            Edit
          </button>
          <button
            v-if="isEditingPreferences"
            @click="confirmPreferencesEdit"
          >
            Confirm
          </button>
          <button
            v-if="isEditingPreferences"
            @click="cancelPreferencesEdit"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import mqttClient from '../mqttClient.js';
import Alert from '../components/Alerts.vue';

export default {
  name: "ProfilePage",
  components: { Alert },
  data() {
    return {
      user: {
        _id: null,
        firstName: null,
        lastName: null,
        email: null,
        phoneNumber: null,
        createdAt: null
      },
      editedUser: {},
      preferences: {
        clinic: null,
        dateRange: { startDate: null, endDate: null },
        dentist: null,
        specialization: null,
      },
      editedPreferences: {},
      newPassword: "",
      clinics: [],
      dentists: [],
      isEditing: false,
      isEditingPreferences: false,
      alertMessage: null,
      alertType: ""
    };
  },
  mounted() {
    this.getUser();
    this.getAllClinics();
    this.getAllDentists();

  },
  methods: {
    async getUser() {
      const loggedIn = !!localStorage.getItem("user");
      if (loggedIn) {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        this.user._id = currentUser.userId;
        this.user.firstName = currentUser.user.firstName;
        this.user.lastName = currentUser.user.lastName;
        this.user.email = currentUser.user.email;
        this.user.phoneNumber = currentUser.user.phoneNumber;
        this.user.createdAt = currentUser.user.createdAt;
        this.preferences = currentUser.user.preferences;
        this.editedUser = { ...this.user };
        this.editedPreferences = { ...this.preferences };
        console.log(this.preferences);

      } else {
        this.$router.push('/login');
      }
    },

    async getAllClinics() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/clinic-info';
      const responseTopic = `response/clinic-info/${correlationId}`;

      const payload = {
        correlationId,
        payload: {}
      };

      const handleMessage = (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic);
          mqttClient.off('message', handleMessage);

          if (response.status === 'success') {
            this.clinics = response.clinics;
            console.log('Clinics retrieved successfully.');
          } else {
            this.showAlert('Failed to retrieve clinic options: ' + response.message, 'error');
          }
        }
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          //this.showAlert('Failed to subscribe to clinic response. Please try again later.', 'error');
          console.error('Failed to subscribe to response topic:', err);
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          //this.showAlert('Failed to send clinic request to server. Please try again later.', 'error');
          console.error('Failed to publish request to MQTT:', err);
          return;
        } else {
          console.log("Publishing", requestTopic, payload);
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        mqttClient.off('message', handleMessage);

        this.showAlert('Server did not respond. Please try again later.');
      }, 5000);

      mqttClient.on('message', handleMessage)
      
      
    },

    async getAllDentists() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/dentist-info';
      const responseTopic = `response/dentist-info/${correlationId}`;

      const payload = {
        correlationId,
        payload: {}
      };

      const handleMessage = (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic);
          mqttClient.off('message', handleMessage);

          if (response.status === 'success') {
            this.dentists = response.dentists;
            //console.log(this.dentists);
            console.log('Dentists retrieved successfully.');
          } else {
            this.showAlert('Failed to retrieve Dentist options: ' + response.message, 'error');
          }
        }
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          //this.showAlert('Failed to subscribe to dentist response. Please try again later.', 'error');
          console.error('Failed to subscribe to response topic:', err);
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          //this.showAlert('Failed to send dentist request to server. Please try again later.', 'error');
          console.error('Failed to publish request to MQTT:', err);
          return;
        } else {
          console.log("Publishing", requestTopic, payload);
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        mqttClient.off('message', handleMessage);
        this.showAlert('Server did not respond. Please try again later.', 'error');
      }, 5000);

      mqttClient.on('message', handleMessage)
      
    },

    confirmEdit() {
      this.isEditing = false;
      this.editUser(); 

    },

    cancelEdit() {
      this.editedUser = { ...this.user };
      this.isEditing = false;
    },

    confirmPreferencesEdit() {
      this.isEditingPreferences = false;
      this.editUser();
    },
    cancelPreferencesEdit() {
      this.editedPreferences = { ...this.preferences };
      this.isEditingPreferences = false;
    },

    deepEqual(obj1, obj2) {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    },

    editUser() {
      const correlationId = Date.now().toString();
      const requestTopic = 'request/manage-patient';
      const responseTopic = `response/manage-patient/${correlationId}`;

      const updatedFields = {};
      const originalUser = this.user;
      const originalPref = this.preferences;

      if (this.editedUser.firstName !== originalUser.firstName) {
        updatedFields.firstName = this.editedUser.firstName;
      }
      if (this.editedUser.lastName !== originalUser.lastName) {
        updatedFields.lastName = this.editedUser.lastName;
      }
      if (this.editedUser.email !== originalUser.email) {
        updatedFields.email = this.editedUser.email;
      }
      if (this.editedUser.phoneNumber !== originalUser.phoneNumber) {
        updatedFields.phoneNumber = this.editedUser.phoneNumber;
      }
      if (!this.deepEqual(this.editedPreferences, originalPref)) {
        updatedFields.preferences = this.editedPreferences;
      }
      if (Object.keys(updatedFields).length === 0) {
        this.showAlert('No changes detected.', 'info');
        return;
      }

      const payload = {
        correlationId,
        payload: {
          patientId: this.user._id,
          ...updatedFields
        },
      };

      const handleMessage = (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          const response = JSON.parse(message.toString());
          mqttClient.unsubscribe(responseTopic);
          mqttClient.off('message', handleMessage);

          if (response.status === 'success') {
            this.showAlert('Profile edited successfully!', 'success');
            this.user = { ...response.patient };
            this.preferences = { ...response.patient.preferences }; 
            this.editedUser = { ...this.user };
            this.editedPreferences = { ...this.preferences };
            localStorage.setItem('user', JSON.stringify({ userId: response.patient._id, email: this.user.email, user: response.patient }));

          } else {
            this.showAlert('Update failed: ' + response.message, 'error');
          }
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
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        mqttClient.off('message', handleMessage);

        this.showAlert('Server did not respond. Please try again later.', 'error');
      }, 5000);

      mqttClient.on('message', handleMessage);
    },

    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    },

    showAlert(message, type = 'info') {
      this.alertMessage = message;
      this.alertType = type;
    }
  }
};
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;  /* Center the content horizontally */
  align-items: center;  /* Center the content vertically */
  gap: 20px;
  height: 100vh; /* Full height of the viewport */
  padding: 0 20px;
  flex-wrap: wrap;  /* Allow items to wrap on smaller screens */
  overflow-y: auto;  /* Enable scrolling if content overflows */
}

.box {
  display: flex;
  flex-direction: column;
  justify-content: space-between;  /* Distribute space evenly within the box */
  padding: 20px;
  border-radius: 8px;
  background-color: #e8f4fa;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);  /* Subtle shadow around the box */
  width: 100%;  /* Make the boxes flexible */
  max-width: 600px; /* Max width for the boxes */
  height: 300px;  /* Set a fixed height to make boxes the same size */
  box-sizing: border-box;  /* Ensure padding doesn't cause overflow */
  flex: 1 1 45%; /* Flex grow and shrink to allow boxes to resize equally */
}

.left-box {
  overflow-y: auto;
  scrollbar-color: #90c3d4 transparent;
  scrollbar-width: none;
}

.left-box:hover {
  scrollbar-width: thin;
}

.left-box:hover::-webkit-scrollbar {
  display: block;
}

.left-box:hover::-webkit-scrollbar-thumb {
  background-color: #90c3d4;
  border-radius: 10px;
}

.right-box {
  background-color: #e8f4fa;
}

.user-info div {
  margin-bottom: 10px;
}

label {
  font-weight: bold;
  margin-right: 10px;
}

input {
  padding: 5px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.actions button {
  margin-right: 10px;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

.actions button:hover {
  background-color: #0056b3;
}

@media (max-width: 800px) {
  .profile-container {
    flex-direction: column;  /* Stack the boxes vertically */
    align-items: center;  /* Center the boxes */
    height: auto; /* Allow container to expand based on content */
    overflow-y: scroll; /* Enable scrolling when content overflows */
    padding: 20px;
  }

  .box {
    width: 100%;  /* Ensure the boxes take up full width on smaller screens */
    max-width: none;  /* Remove max-width constraint */
    margin-bottom: 20px; /* Add spacing between stacked boxes */
    height: 300px;  /* Ensure boxes have the same height on smaller screens */
  }
}

</style>

