import mqttClient from '../../shared/mqtt-client.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const servicesStatus = {};
const HEARTBEAT_TIMEOUT = 10000;
const subscriptionTopic = 'heartbeat/+';

const servicePaths = {
    'appointment-management': path.resolve(__dirname, '../appointment-services/appointment-management-service/index.js'),
    'available-appointments': path.resolve(__dirname, '../appointment-services/available-appointments-service/index.js'),
    'create-appointment': path.resolve(__dirname, '../appointment-services/create-appointment-service/index.js'),
    'dentist-service': path.resolve(__dirname, '../dentist-services/index.js'),
    'create-patient': path.resolve(__dirname,'../patient-services/create-patient-service/index.js'),
    'patient-login': path.resolve(__dirname, '../patient-services/login-service/index.js')

};

const spawnedProcesses = {};

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
        try {
            const heartbeat = JSON.parse(message.toString());
            console.log(`Received heartbeat from ${serviceName}:`, heartbeat);

            servicesStatus[serviceName] = {
                status: 'healthy',
                lastSeen: new Date().getTime(),
            };

            if (spawnedProcesses[serviceName]) {
                delete spawnedProcesses[serviceName];
            }
        } catch (err) {
            console.error('Failed to parse heartbeat message:', err);
        }
    }
});

setInterval(() => {
    const currentTime = new Date().getTime();
    for (const [service, serviceInfo] of Object.entries(servicesStatus)) {
        if (currentTime - serviceInfo.lastSeen > HEARTBEAT_TIMEOUT) {
            if (serviceInfo.status !== 'down') {
                servicesStatus[service].status = 'down';
                publishAlert(service);
                console.error(`Service ${service} is down!`);

                if (!spawnedProcesses[service]) {
                    console.log(`Spawning a new instance of ${service}`);
                    spawnedProcesses[service] = spawnService(service);
                }
            }
        } else {
            servicesStatus[service].status = 'healthy';
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

const spawnService = (serviceName) => {
    const scriptPath = servicePaths[serviceName];
    if (!scriptPath) {
        console.error(`No script path found for service ${serviceName}`);
        return null;
    }

    const serviceDir = path.dirname(scriptPath);

    console.log(`Starting ${serviceName} from ${scriptPath}`);
    const process = spawn('node', [scriptPath], {
        stdio: ['ignore', 'pipe', 'pipe'], 
        cwd: serviceDir,
    });
    
    process.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
        console.error(`Error from ${serviceName}:`, data.toString());
    });

    process.on('error', (err) => {
        console.error(`Failed to spawn ${serviceName}:`, err);
    });

    process.on('exit', (code) => {
        console.log(`Service ${serviceName} exited with code ${code}`);
        delete spawnedProcesses[serviceName];
    });

    return process;
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

    for (const [serviceName, process] of Object.entries(spawnedProcesses)) {
        if (process) {
            console.log(`Terminating spawned process for ${serviceName}`);
            process.kill();
        }
    }

    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
