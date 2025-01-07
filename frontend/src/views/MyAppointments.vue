<template>
    <div class="day-container">
        <p class="top-text">View your booked appointments</p>
        <div v-if="!appointments || appointments.length === 0" class="no-slots">
            You have not booked any appointments
        </div>
        <ul v-else class="slots-list">
            <li v-for="slot in appointments" :key="slot.id" class="slot-item available-slot">
                <div class="slot-box">
                    <span class="slot-time">Time: {{ slot.startTime }} - {{ slot.endTime }}</span>
                    <span class="slot-location">Clinic: {{ slot.clinic.name }}</span>
                    <span class="slot-dentist">Dentist: {{ slot.dentist?.firstName }} {{ slot.dentist?.lastName }}</span>
                    <span>Date: {{ slot.date }} </span>
                    <button class="cancel-button" @click="cancelAppointment(slot._id)">Cancel</button>
                </div>
            </li>   
        </ul>
    </div>
</template>

<script>
import mqttClient from '../mqttClient.js';

export default {
    name: "my-appointments",


    data() {
        return {
            appointments: [],
        };
    },

    mounted() {
        this.getAppointments();
    },

    methods: {
        getAppointments() {

            try {
                const correlationId = Date.now().toString();
                const user = JSON.parse(localStorage.getItem("user"));

                const payload = {
                    patientId: user.userId,
                };

                console.log("Publishing payload:", payload);

                mqttClient.publish(
                    "request/available-appointments/booked",
                    JSON.stringify({ correlationId, payload }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                const responseTopic = `response/available-appointments/booked/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    //this.showAlert('Server did not respond. Please try again later.', 'error');
                }, 5000);

                mqttClient.on("message", (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);
                        console.log("Filtered slots response:", response.appointments);

                        if (response.status === "success") {
                            this.appointments = response.appointments;
                            //this.showAlert('Slots fetched successfully!', 'success');
                        } else {
                            console.error("Error response:", response.message);
                            //this.showAlert(response.message, 'error');
                        }

                        mqttClient.unsubscribe(responseTopic, (err) => {
                            if (err) {
                                console.error("Failed to unsubscribe from response topic:", err);
                            } else {
                                console.log(`Unsubscribed from response topic: ${responseTopic}`);
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("Error in fetchSlotsAndDentists:", error);
                //this.showAlert("An error occurred while fetching slots. Please try again later.", 'error');
            }

        },
        cancelAppointment(slotid) {

            try {
                const correlationId = Date.now().toString();

                const payload = {
                    appointmentId: slotid,
                    status: "canceled",
                };

                console.log("Publishing payload:", payload);
                const requestTopic = "request/appointment-management";

                mqttClient.publish(
                    requestTopic,
                    JSON.stringify({ correlationId, payload }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                const responseTopic = `response/appointment-management/updated/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    //this.showAlert('Server did not respond. Please try again later.', 'error');
                }, 5000);

                mqttClient.on("message", (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);
                        console.log("Filtered slots response:", response.appointments);

                        if (response.status === "success") {
                            this.appointments = response.appointments;
                            //this.showAlert('Slots fetched successfully!', 'success');
                        } else {
                            console.error("Error response:", response.message);
                            //this.showAlert(response.message, 'error');
                        }

                        mqttClient.unsubscribe(responseTopic, (err) => {
                            if (err) {
                                console.error("Failed to unsubscribe from response topic:", err);
                            } else {
                                console.log(`Unsubscribed from response topic: ${responseTopic}`);
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("Error in fetchSlotsAndDentists:", error);
                //this.showAlert("An error occurred while fetching slots. Please try again later.", 'error');
            }

        },
    },
};
</script>

<style scoped>
.cancel-button {
    margin-left: auto;
    background-color: #007bff;
    color: white;
    padding: 15px 32px;
    text-align: center;
    top: 50%;
    justify-content: center;
    font-size: 16px;
    border-radius: 8px;
    border: 0px;


}

.day-container {
    padding: 5px;
    min-height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    /* Added for responsiveness*/
    box-sizing: border-box;
    /* Added for responsiveness*/
    white-space: normal;
    /* Allow wrapping of text */
    word-wrap: break-word;
    /* Break long words if necessary */
}

.top-text {
    font-size: 1.5rem;
    margin-bottom: 10px;
}

.no-slots {
    color: #6c757d;
    font-style: italic;
}

.slots-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
    /* Add spacing between slot items */
    width: 100%;
}

.slot-item {
    margin-bottom: 10px;
}

.available-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid #c3e6cb;
    background-color: #d4edda;
    /* Green shade */
    transition: transform 0.2s ease;
    overflow: hidden;
    width: 100%;
}

.slot-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: center;
    font-size: 0.9rem;
    width: 100%;
    overflow-wrap: break-word;
}

.slot-time,
.slot-location,
.slot-dentist {
    margin-bottom: 5px;
    white-space: normal;
    /* Allow wrapping of text */
    word-wrap: break-word;
    /* Break long words if necessary */
}

/* Responsive scaling */
@media (max-width: 480px) {

    /* Mobile L */
    .available-slot {
        flex-direction: column;
        padding: 10px;
        overflow-y: auto;
        /* Enable vertical scrolling */
        overflow-x: auto;
    }

    .slot-box,
    .no-slots {
        font-size: 1rem;
        text-align: center;
    }
}

@media (max-width: 320px) {
    /* Mobile S */

    .available-slot {
        flex-direction: column;
        padding: 15px;
        overflow-y: auto;
        /* Enable vertical scrolling */
        overflow-x: auto;
    }

    .slot-box,
    .no-slots {
        font-size: 1rem;
        text-align: center;
    }

    .slot-time,
    .slot-location,
    .slot-dentist {
        font-size: 1rem;
        margin-bottom: 3px;
    }
}
</style>