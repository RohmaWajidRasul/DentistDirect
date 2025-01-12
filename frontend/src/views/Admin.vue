<template>
    <div>
        <h3 v-if="numberOfUsers">
            Number of active users: {{ numberOfUsers }}
        </h3>
        <h3 v-else>
            Number of active users: 0
        </h3>
        <h3 v-if="numberOfAppointments">
            Number of available appointments: {{ numberOfAppointments }}
        </h3>
        <h3 v-else>
            Number of available appointments: 0
        </h3>
        <div v-if="registry">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Service Name</th>
                        <th scope="col">Number of Instances</th>
                        <th scope="col">Requests</th>

                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(instances, serviceName) in registry" :key="serviceName">
                        <th scope="row">{{ serviceName }}</th>
                        <td>{{ Object.keys(instances).length }}</td>
                        <td>{{ getRequestCountPerService(serviceName) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <h3>
            Logs:
        </h3>
        <div v-if="logs">
            <table class="table">
                <thead>
                    <tr>
                        <th scope="col">Service Name</th>
                        <th scope="col">Service Instance</th>
                        <th scope="col">Result</th>
                        <th scope="col">Request Time</th>
                        <th scope="col">Requestee</th>
                        
                    </tr>
                </thead>
                <tbody>
                    <tr v-for=" log in logs" :key="log._id">
                        <th scope="row">{{ log.serviceName }}</th>
                        <td>{{ log.serviceId }}</td>
                        <td>{{ log.result }}</td>
                        <td>{{ log.requestTime }}</td>
                        <td>{{ log.patientId }}</td>
                    </tr>
                </tbody>
            </table>
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
            logs: undefined,
            registryInterval: null,
            dataInterval: null,
        }
    },

    methods: {

        getRegistry() {
            try {
                const correlationId = Date.now().toString();
                const requestTopic = "request/registry";
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
                const responseTopic = `response/registry/${correlationId}`;
                mqttClient.subscribe(responseTopic, (err) => {
                    if (err) {
                        console.error("Failed to subscribe to response topic:", err);
                        throw new Error("Failed to subscribe to response topic");
                    }
                    console.log(`Subscribed to response topic: ${responseTopic}`);
                });
                const handleMessage = (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        mqttClient.off("message", handleMessage);
                        const response = JSON.parse(message.toString());
                        mqttClient.unsubscribe(responseTopic);

                        this.registry = response.serviceRegistry
                        this.requestCount = response.requestCount;
                    }
                };
                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    mqttClient.off("message", handleMessage);
                    console.log('Server did not respond to get registry request. Please try again later.')
                }, 5000);

                mqttClient.on("message", handleMessage)
            } catch (error) {
                console.error("Error in Get Registry:", error);
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



                const handleMessage = (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        mqttClient.unsubscribe(responseTopic);
                        mqttClient.off("message", handleMessage);
                        const response = JSON.parse(message.toString());

                        if (response.status === "success") {
                            if(response.message == "No appointments found.") {
                                console.log("No Appointments found");
                            } else {
                            this.numberOfAppointments = response.appointments.length;
                            }
                        } else {
                            console.error("Error response:", response.message);
                        }
                    }
                };

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    mqttClient.off("message", handleMessage);
                    console.log('Server did not respond to get number of appointments. Please try again later.')
                }, 5000);

                mqttClient.on("message", handleMessage);
            } catch (error) {
                console.error("Error in Get Numbers of appointments:", error);
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


                const handleMessage = (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        mqttClient.unsubscribe(responseTopic);
                        mqttClient.off("message", handleMessage);
                        const response = JSON.parse(message.toString());

                        if (response.status === "success") {
                            this.numberOfUsers = response.numberUniqueUsers;
                        } else {
                            console.error("Error response:", response.error);
                        }
                    }
                };

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    mqttClient.off("message", handleMessage);
                    console.log('Server did not respond to get user numbers. Please try again later.')
                }, 5000);

                mqttClient.on("message", handleMessage);
            } catch (error) {
                console.error("Error in Get Number of Users:", error.message);
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

                const handleMessage = (topic, message) => {
                    if (topic === responseTopic) {
                        clearTimeout(timeout);
                        mqttClient.unsubscribe(responseTopic);
                        mqttClient.off("message", handleMessage);
                        const response = JSON.parse(message.toString());

                        if (response.status === "success") {
                            this.logs = response.logs;
                        } else {
                            console.error("Error response:", response.error);
                        }
                    }
                };

                const timeout = setTimeout(() => {
                    mqttClient.unsubscribe(responseTopic);
                    mqttClient.off("message", handleMessage);
                    console.log('Server did not respond to logs request. Please try again later.')
                }, 5000);

                mqttClient.on("message", handleMessage)
            } catch (error) {
                console.error("Error in Get Logs:", error);
            }
        },
        getRequestCount(serviceId) {
            return this.requestCount[serviceId] || 0;
        },
        getRequestCountPerService(serviceName) {

            const serviceInstances = Object.keys(this.registry[serviceName]);
            let serviceRequestCount = 0;
            for (const serviceId of serviceInstances) {
                const requests = this.requestCount[serviceId] || 0;
                serviceRequestCount += requests;
            }
            return serviceRequestCount;
        },
        startInterval() {
            this.stopInterval();

            this.dataInterval = setInterval(this.refreshData, 10000);
            this.registryInterval = setInterval(this.getRegistry, 30000);

        },
        stopInterval() {
            if (this.dataInterval) clearInterval(this.dataInterval);
            if (this.registryInterval) clearInterval(this.registryInterval);
        },
        async refreshData() {
            await this.getNumberOfAppointments();
            await this.getNumberOfUsers();
            this.getLogs();
        }


    },
    async mounted() {
    await Promise.all([
        this.getRegistry(),
        this.getNumberOfAppointments(),
        this.getNumberOfUsers(),
        this.getLogs()
    ]);
    this.startInterval();
},
    unmounted() {
        this.stopInterval();
    }
}

</script>