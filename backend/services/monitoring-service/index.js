import mqttClient from '../../shared/mqtt-client.js';
import { checkDBHealth } from '../../shared/checkDBHealth.js';

//-----Monitoring the health status of databases----------------------

const dbURIs = {
    primaryDentists: 'mongodb://localhost:27017/dentists',
    fallbackDentists: 'mongodb://localhost:27019/dentists',
    primaryPatients: 'mongodb://localhost:27017/patients',
    fallbackPatients: 'mongodb://localhost:27019/patients',
    primaryAppointments: 'mongodb://localhost:27017/appointments',
    fallbackAppointments: 'mongodb://localhost:27019/appointments',
    primaryClinics: 'mongodb://localhost:27017/clinics',
    fallbackClinics: 'mongodb://localhost:27019/clinics',
};

const dbStatus = {};

const checkDatabases = async () => {
    for (const [key, uri] of Object.entries(dbURIs)) {
        const result = await checkDBHealth(uri);
        dbStatus[key] = result;
    }

    //console.log('Database statuses:', dbStatus);
};

setInterval(checkDatabases, 10000); // Check every 10 seconds

//------------Subscribing to the sync and backup status--------------------
mqttClient.on('connect', () => {
    mqttClient.subscribe('sync/status', (err) => {
        if (err) console.error('Failed to subscribe to sync/status:', err);
        else console.log('Subscribed to sync/status topic.');
    });
    mqttClient.subscribe('backup/status', (err) => {
        if (err) console.error('Failed to subscribe to backup/status:', err);
        else console.log('Subscribed to backup/status topic.');
    });
});

mqttClient.on('message', (topic, message) => {
    const payload = JSON.parse(message.toString());
    if (topic === 'sync/status') {
        console.log(`Sync Status:`, payload);
    } else if (topic === 'backup/status') {
        console.log(`Backup Status:`, payload);
    }
});
//-------------------------------------------------------------------

const servicesStatus = {};
const HEARTBEAT_TIMEOUT = 10000;
const subscriptionTopic = 'heartbeat/#';

mqttClient.on('connect', () => {
    mqttClient.subscribe(subscriptionTopic, (err) => {
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
        const serviceId = topic.split('/')[2];
        const instanceKey = `${serviceName}/${serviceId}`;

        try {
            const heartbeat = JSON.parse(message.toString());
            
            servicesStatus[instanceKey] = {
                status: heartbeat.status,   
                lastSeen: Date.now(),
                uptime: heartbeat.uptime
            };
            //console.log('Heartbeat from', serviceName, serviceId);

        } catch (err) {
            console.error('Failed to parse heartbeat message:', err);
        }
    }
});


setInterval(() => {
    const currentTime = Date.now();

    for (const [instanceKey, serviceInfo] of Object.entries(servicesStatus)) {
        const timeSinceLastSeen = currentTime - serviceInfo.lastSeen;

        if (timeSinceLastSeen > HEARTBEAT_TIMEOUT) {
            if (serviceInfo.status !== 'down') {
                servicesStatus[instanceKey].status = 'down';

                const [serviceName, serviceId] = instanceKey.split('/');

                publishAlert(serviceName, serviceId);
                console.error(`Instance ${instanceKey} is down!`);
            }
        } else {
            servicesStatus[instanceKey].status = 'healthy';
            //console.log(`Instance ${instanceKey} is healthy.`);
        }
    }
}, HEARTBEAT_TIMEOUT / 2);

const publishAlert = (serviceName, serviceId) => {
    const alert = {
        service: serviceName,
        serviceId,
        status: 'down',
        timestamp: Date.now(),
    };

    mqttClient.publish('alerts/service', JSON.stringify(alert), (err) => {
        if (err) {
            console.error('Failed to publish alert:', err);
        } else {
            console.log(`Alert published for ${serviceName}/${serviceId}`);
        }
    });
};


const shutdown = async () => {
    console.log('Shutting down monitoring service...');

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
