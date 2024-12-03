import mqttClient from '../../shared/mqtt-client.js';

const servicesStatus = {};

const HEARTBEAT_TIMEOUT = 10000; 

const subscriptionTopic = 'heartbeat/+'

mqttClient.on('connect', () => {
    mqttClient.subscribe( subscriptionTopic, (err) => {
        if (err) {
            console.error('Failed to subscribe to heartbeat topics:', err);
        } else {
            console.log('Subscribed to all heartbeat topics');
        }
    });
});

mqttClient.on('message', (topic, message) => {
    if (topic.startsWith('heartbeat/')) {
        const serviceName = topic.split('/')[1];
        try {
            const heartbeat = JSON.parse(message.toString());
            console.log(`Received heartbeat from ${serviceName}:`, heartbeat);

            servicesStatus[serviceName] = {
                status: 'healthy',
                lastSeen: new Date().getTime(),
            };
        } catch (err) {
            console.error('Failed to parse heartbeat message:', err);
        }
    }
});

setInterval(() => {
    const currentTime = new Date().getTime();
    for (const [service, serviceInfo] of Object.entries(servicesStatus)) {
        if (currentTime - serviceInfo.lastSeen > HEARTBEAT_TIMEOUT) {
            servicesStatus[service].status = 'down';
            publishAlert(service)
            console.error(`Service ${service} is down!`);
        } else {
            console.log(`Service ${service} is healthy.`);
        }
    }
}, HEARTBEAT_TIMEOUT / 2);

const publishAlert = (serviceName) => {
    const alert = {
        service: serviceName,
        status: 'down',
        timestamp: new Date().toISOString(),
    };

    mqttClient.publish('alerts/service', JSON.stringify(alert), (err) => {
        if (err) {
            console.error('Failed to publish alert:', err);
        } else {
            console.log(`Alert published for ${serviceName}`);
        }
    });
};

const shutdown = async () => {
    console.log('Shutting down service...');

    mqttClient.unsubscribe(subscriptionTopic, (err) => {
        if (err) {
            console.error('Failed to unsubscribe:', err);
        } else {
            console.log(`Unsubscribed from ${subscriptionTopic}`);
        }
    });

    mqttClient.end(false, () => {
        console.log('MQTT client disconnected');
    });

    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
