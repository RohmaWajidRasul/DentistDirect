<template>
    <div>
        <div v-if="numberOfUsers">
            Number of active users: {{ numberOfUsers }}
        </div>
        <div v-else>
            Number of active users: 0
        </div>
        <div v-if="numberOfAppointments">
            Number of available appointments: {{ numberOfAppointments }}
        </div>
        <div v-else>
            Number of available appointments: 0
        </div>
        <div v-for="(instances, serviceName) in registry" :key="serviceName">
            <h3>{{ serviceName }} instances: </h3>
            <ul>
                <li v-for="(instance, serviceId) in instances" :key="serviceId">
                    Service ID: {{ serviceId }} requests : {{ getRequestCount(serviceId) }}

                </li>
            </ul>
        </div>
        <h3>
            Logs: 
        </h3>
        <div v-for=" log in logs" :key="log._id">
            {{ log.result }} - {{ log.serviceName }} - {{ log.requestTime }} - {{ log.patientId }}
        </div>
    </div>
</template>


<script>
import mqttClient from '../mqttClient.js';


export default {
    name: 'admin-page',

    data() {
        return {
            registry: [],
            requestCount: undefined,
            numberOfAppointments: undefined,
            numberOfUsers: undefined,
            logs: undefined
        }
    },

    methods: {

        getRegistry() {

            try {

                const correlationId = Date.now().toString();



                console.log("Publishing payload:",);
                const requestTopic = "request/publish/registry";

                mqttClient.publish(
                    requestTopic,
                    JSON.stringify({ correlationId }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                //const responseTopic = `response/publish/registry/${correlationId}`;
                const responseTopic = "publish/registry";

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
                }, 50000);

                mqttClient.on("message", (topic, message) => {

                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);
                        console.log("Filtered slots response:", response.appointments);
                        console.log(response)
                        console.log(response.serviceRegistry);
                        console.log(response.requestCount)
                        this.registry = response.serviceRegistry
                        this.requestCount = response.requestCount;
                        if (response.status === "success") {
                            console.log(message)
                        } else {
                            //console.error("Error response:", response.message);
                            //this.showAlert(response.message, 'error');
                        }


                    }
                });
            } catch (error) {
                console.error("Error in fetchSlotsAndDentists:", error);
                //this.showAlert("An error occurred while fetching slots. Please try again later.", 'error');
            }

        },
        getNumberOfAppointments() {
            try {
                const correlationId = Date.now().toString();

                const payload = {};

                mqttClient.publish(
                    "request/available-appointments/available",
                    JSON.stringify({ correlationId, payload }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                const responseTopic = `response/available-appointments/available/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                }, 5000);

                mqttClient.on("message", (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);

                        if (response.status === "success") {
                            this.numberOfAppointments = response.appointments.length;
                        } else {
                            console.error("Error response:", response.message);
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
                console.error("Error in fetchSlotsAndDentists:", error.message);
            }
        },
        getNumberOfUsers() {
            try {
                const correlationId = Date.now().toString();

                const payload = {};

                mqttClient.publish(
                    "request/get-usernumbers",
                    JSON.stringify({ correlationId, payload }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                const responseTopic = `response/get-usernumbers/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                }, 5000);

                mqttClient.on("message", (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);

                        if (response.status === "success") {
                            this.numberOfUsers = response.numberUniqueUsers;
                        } else {
                            console.error("Error response:", response.error);
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
                console.error("Error in fetchSlotsAndDentists:", error.message);
            }
        },        
        getLogs() {
            try {
                const correlationId = Date.now().toString();

                const payload = {};

                mqttClient.publish(
                    "request/get-logs",
                    JSON.stringify({ correlationId, payload }),
                    (err) => {
                        if (err) {
                            console.error("Failed to publish request:", err);
                            throw new Error("Failed to publish request");
                        }
                        console.log(`Request published with correlationId: ${correlationId}`);
                    }
                );

                const responseTopic = `response/get-logs/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                }, 5000);

                mqttClient.on("message", (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        const response = JSON.parse(message.toString());
                        console.log("Response received:", response);

                        if (response.status === "success") {
                            this.logs = response.logs.reverse();
                        } else {
                            console.error("Error response:", response.error);
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
                console.error("Error in fetchSlotsAndDentists:", error.message);
            }
        },
        getRequestCount(serviceId) {
            return this.requestCount[serviceId] || 0;
        },
        startInterval() {
            setInterval(this.refreshData, 5000);

        },
        refreshData() {
            this.getNumberOfAppointments();
            this.getNumberOfUsers();
            this.getLogs();
        }


    },
    mounted() {
        this.getRegistry();
        this.getNumberOfAppointments();
        this.getNumberOfUsers();
        this.getLogs();
        this.startInterval();
    }
}

</script>