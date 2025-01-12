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
          <div class="field-bubble">
            <label>First Name:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.firstName"
              type="text"
            />
            <span v-else>{{ user.firstName }}</span>
          </div>

          <div class="field-bubble">
            <label>Last Name:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.lastName"
              type="text"
            />
            <span v-else>{{ user.lastName }}</span>
          </div>

          <div class="field-bubble">
            <label>Email:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.email"
              type="email"
            />
            <span v-else>{{ user.email }}</span>
          </div>

          <div class="field-bubble">
            <label>Phone Number:</label>
            <input
              v-if="isEditing"
              v-model="editedUser.phoneNumber"
              type="text"
            />
            <span v-else>{{ user.phoneNumber }}</span>
          </div>

          <div v-if="isEditing" class="field-bubble">
            <label for="password">Password:</label>
            <div class="password-container">
              <input
                type="password"
                id="password"
                v-model="newPassword"
                placeholder="Enter new password"
                :disabled="!isEditing"
              />
              <button @click="togglePasswordVisibility" class="eye-button">
                <span v-if="isPasswordVisible">👁️</span>
                <span v-else>🫣</span>
              </button>
            </div>
        
          </div>

        </div>

        <div class="actions">
          <button v-if="!isEditing" @click="isEditing = true">Edit</button>
          <button v-if="isEditing" @click="confirmEdit">Confirm</button>
          <button v-if="isEditing" @click="cancelEdit">Cancel</button>
        </div>
      </div>

      <div class="box right-box">
        <h3>Your Preferences</h3>
        <p>Info: With either a date range or specialization, you must also have either a clinic or dentist set, and vice versa, for best results.</p>
        <div class="preferences-info">
          <div class="field-bubble">
            <label>Date Range:</label>
            <input 
              v-if="isEditingPreferences" 
              v-model="editedPreferences.dateRange.startDate" 
              type="date" 
            />
            <span v-else>{{ formattedStartDate }}</span>
            to
            <input 
              v-if="isEditingPreferences" 
              v-model="editedPreferences.dateRange.endDate" 
              type="date" 
            />
            <span v-else>{{ formattedEndDate }}</span>
            <button v-if="isEditingPreferences" @click="clearDateRange">
              Clear
            </button>
          </div>

          <div class="field-bubble">
            <label>Specialization:</label>
            <select v-if="isEditingPreferences" v-model="editedPreferences.specialization">
              <option value="">None</option>
              <option v-for="spec in specializations" :key="spec">{{ spec }}</option>
            </select>
            <span v-else>{{ preferences.specialization }}</span>
          </div>

          <div class="field-bubble">
            <label>Clinic:</label>
            <select v-if="isEditingPreferences" v-model="editedPreferences.clinic">
              <option value="">None</option>
              <option v-for="clinic in clinics" :key="clinic._id" :value="clinic._id">{{ clinic.name }}</option>
            </select>
            <span v-else>{{ clinicName }}</span>
          </div>

          <div class="field-bubble">
            <label>Dentist:</label>
            <select v-if="isEditingPreferences" v-model="editedPreferences.dentist">
              <option value="">None</option>
              <option v-for="dentist in dentists" :key="dentist._id" :value="dentist._id">{{ dentist.firstName + " " + dentist.lastName }}</option>
            </select>
            <span v-else>{{ dentistName }}</span>
          </div>

          
        </div>

        <div class="actions">
          <button v-if="!isEditingPreferences" @click="isEditingPreferences = true">Edit</button>
          <button v-if="isEditingPreferences" @click="confirmPreferencesEdit">Confirm</button>
          <button v-if="isEditingPreferences" @click="cancelPreferencesEdit">Cancel</button>
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
      specializations: null,
      isEditing: false,
      isEditingPreferences: false,
      isPasswordVisible: false,
      alertMessage: null,
      alertType: ""
    };
  },
  computed: {
    clinicName() {
      const clinic = this.clinics.find(c => c._id === this.preferences.clinic);
      return clinic ? clinic.name : 'Not set';
    },
    dentistName() {
      const dentist = this.dentists.find(d => d._id === this.preferences.dentist);
      //console.log(dentist.lastName);
      return dentist ? dentist.firstName + " " + dentist.lastName : 'Not set';
    },
    formattedStartDate() {
      return this.formatDate(this.preferences.dateRange.startDate);
    },
    formattedEndDate() {
      return this.formatDate(this.preferences.dateRange.endDate);
    }
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
        //console.log(this.preferences.clinic, this.preferences.specialization, this.preferences.dentist, this.preferences.dateRange.endDate, this.preferences.dateRange.startDate)
        this.resetEdits();
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
            this.specializations = [...new Set(response.dentists.map(dentist => dentist.specialization))];
            //console.log(this.specializations);

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

    clearDateRange() {
      this.editedPreferences.dateRange.startDate = null;
      this.editedPreferences.dateRange.endDate = null;
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

    togglePasswordVisibility() {
      this.isPasswordVisible = !this.isPasswordVisible;
      const passwordField = document.getElementById('password');
      passwordField.type = this.isPasswordVisible ? 'text' : 'password';
    },

    deepEqual(obj1, obj2) {
      if (obj1.clinic !== obj2.clinic) return false;

      // Compare dateRange fields after formatting the dates
      const format = date => date ? new Date(date).toISOString().split('T')[0] : null;
      if (format(obj1.dateRange.startDate) !== format(obj2.dateRange.startDate)) return false;
      //console.log("HAAAAAAAAAA",format(obj1.dateRange.startDate) !== format(obj2.dateRange.startDate));
      if (format(obj1.dateRange.endDate) !== format(obj2.dateRange.endDate)) return false;

      if (obj1.dentist !== obj2.dentist) return false;
      if (obj1.specialization !== obj2.specialization) return false;

      return true;
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
        updatedFields.preferences = {
          ...this.editedPreferences,
          dateRange: {
            startDate: this.formatDateForPayload(this.editedPreferences.dateRange.startDate),
            endDate: this.formatDateForPayload(this.editedPreferences.dateRange.endDate)
          }
        };

        if(updatedFields.preferences.dateRange.startDate !== null || updatedFields.preferences.specialization !== '' ) {
          console.log("REACHED", updatedFields.preferences.clinic
          )
          if((!updatedFields.preferences.clinic || updatedFields.preferences.clinic === null ) && ( !updatedFields.preferences.dentist || updatedFields.preferences.dentist=== null)) {
            console.log("REACHED")

            this.showAlert('Must have either a clinic or dentist preference with a date range or specialization', 'error');
            this.resetEdits();
            return;
          }
        } else {
          if ((updatedFields.preferences.clinic && updatedFields.preferences.clinic !== null || ( updatedFields.preferences.dentist || updatedFields.preferences.dentist !== null))) {
            this.showAlert('Must have either a date range or specialization preference with a clinic or dentist', 'error');
            this.resetEdits();
            return;
          }
        }
      }

      if (this.newPassword !== "") {
        if (this.newPassword.length < 8) {
          this.showAlert('Password must be atleast 8 characters long', 'error');
          this.resetEdits();
          return;
        } else {
          updatedFields.password = this.newPassword;
        }
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
            this.resetEdits(); 
            localStorage.setItem('user', JSON.stringify({ userId: response.patient._id, email: this.user.email, user: response.patient }));

          } else {
            this.showAlert('Update failed: ' + response.message, 'error');
            this.newPassword = "";

          }
        }
      };

      mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
          this.showAlert('Server is unavailable. Please try again later.', 'error');
          console.error('Failed to subscribe to response topic:', err);
          this.resetEdits(); 
          return;
        }
      });

      mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
        if (err) {
          this.showAlert('Failed to send request to server. Please try again later.', 'error');
          console.error('Failed to publish request to MQTT:', err);
          this.resetEdits(); 
          return;
        }
      });

      const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        mqttClient.off('message', handleMessage);
        this.resetEdits(); 
        this.showAlert('Server did not respond. Please try again later.', 'error');
      }, 5000);

      mqttClient.on('message', handleMessage);
    },

    resetEdits() {
      this.editedUser = { ...this.user };
      this.editedPreferences = {
        ...this.preferences,
        dateRange: {
          startDate: this.formatDate(this.preferences.dateRange.startDate),
          endDate: this.formatDate(this.preferences.dateRange.endDate)
        }
      };   
      this.newPassword = "";
    },

    formatDate(date) {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatDateForPayload(date) {
      if (!date) return null;
      return new Date(date).toISOString();
    },

    showAlert(message, type = 'info') {
      this.alertMessage = message;
      this.alertType = type;
    }
  }
};
</script>

<style scoped>

.field-bubble {
  background-color: #cfe6f1;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.password-container {
  display: flex;
  align-items: center; /* Vertically center the input and the button */
  gap: 10px; /* Space between the input and the button */
}

.eye-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem; /* Adjust size as needed */
  display: flex;
  align-items: center;
}

/* Rounded Input Fields */
input[type="text"],
input[type="email"],
input[type="password"],
textarea,
select {
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 10px;
  width: 100%;
  box-sizing: border-box;
}

/* Label Above Input Fields */
label {
  display: block;
  font-weight: bold;
  margin-bottom: 5px;
  color: #333;
}


.profile-container {
  display: flex;
  justify-content: center;  /* Center the content horizontally */
  align-items: center;  /* Center the content vertically */
  gap: 20px;
  min-height: 100vh; /* Full height of the viewport */
  padding: 20px;
  flex-wrap: wrap;  /* Allow items to wrap on smaller screens */
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
  box-sizing: border-box;  /* Ensure padding doesn't cause overflow */
  flex: 1 1 45%; /* Flex grow and shrink to allow boxes to resize equally */
  min-height: auto;  /* Allow the boxes to grow with the content */

}

.left-box {
  min-height: auto;  /* Allow the boxes to grow with the content */
  height: 550px;
  padding: 20px;  /* Add padding if needed */
  box-sizing: border-box; 
  
}

.right-box {
  min-height: auto;  /* Allow the boxes to grow with the content */
  padding: 20px;  /* Add padding if needed */
  box-sizing: border-box; 
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

button {
  margin: 10px;
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:hover {
  background-color: #0056b3;

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

