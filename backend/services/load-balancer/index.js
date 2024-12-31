import mqttClient from '../../shared/mqtt-client.js';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceRegistry = {};
const requestCount = {};
const lowRequestDurations = {};
const maxRequests = 50; 
const minRequests = 5; 
const lowLoadTimeLimit = 30000;

const servicePaths = {
    'appointment-management': path.resolve(__dirname, '../appointment-services/appointment-management-service/index.js'),
    'available-appointments': path.resolve(__dirname, '../appointment-services/available-appointments-service/index.js'),
    'create-appointment': path.resolve(__dirname, '../appointment-services/create-appointment-service/index.js'),
    'register-dentist': path.resolve(__dirname, '../dentist-services/register-dentist-service/index.js'),
    'dentist-info': path.resolve(__dirname, '../dentist-services/dentist-info-service/index.js'),
    'create-patient': path.resolve(__dirname,'../patient-services/create-patient-service/index.js'),
    'patient-login': path.resolve(__dirname, '../patient-services/login-service/index.js'), 
    'create-clinic':path.resolve(__dirname, '../clinics-services/create-clinic-service/index.js'), 
    'retrieve-clinic': path.resolve(__dirname, '../clinics-services/retrieve-clinic-service/index.js'),
    'fetch-clinic-info': path.resolve(__dirname, '../clinics-services/clinic-info-service/index.js'), 


};

const spawnService = (serviceName) => {
    const scriptPath = servicePaths[serviceName];
    if (!scriptPath) {
        console.error(`No script path found for service ${serviceName}`);
        return null;
    }

    const serviceDir = path.dirname(scriptPath);
    
    console.log(`Starting ${serviceName} from ${scriptPath}`);
    const serviceProcess = spawn('node', [scriptPath], {
        stdio: ['ignore', 'pipe', 'pipe'], 
        cwd: serviceDir,
    });

    serviceProcess.stdout.on('data', (data) => {
        console.log(`[${serviceName}] stdout: ${data}`);
    });

    serviceProcess.stderr.on('data', (data) => {
        console.error(`[${serviceName}] stderr: ${data}`);
    });

    serviceProcess.on('exit', (code) => {
        console.log(`${serviceName} instance exited with code ${code}`);
    });

    return serviceProcess;
};

const spawnAllServices = () => {
    for (const [serviceName] of Object.entries(servicePaths)) {
        console.log(`Initializing ${serviceName} on startup.`);
        spawnService(serviceName);
    }
};

spawnAllServices();

const scaleDownService = (serviceName, serviceId) => {
    console.log(`Scaling down service: ${serviceName}, removing instance: ${serviceId}`);
    delete serviceRegistry[serviceName][serviceId];
    mqttClient.publish(`scaleDown/${serviceName}/${serviceId}`, JSON.stringify({ serviceId, action: 'terminate' }));

    // Ensure at least one instance remains active
    if (Object.keys(serviceRegistry[serviceName]).length === 0) {
        console.log(`All instances of ${serviceName} are down! Starting a new instance.`);
        spawnService(serviceName);
    }
};

const handleAlert = (message) => {
    const alert = JSON.parse(message.toString());
    const { serviceId, service } = alert;

    if (serviceRegistry[service]) {
        delete serviceRegistry[service][serviceId];
        console.log(`Removed down instance: ${serviceId} for service: ${service}`);

        // Spawn replacement
        console.log(`Spawning a replacement instance for ${service}`);
        spawnService(service);
    }
};


const handleRequest = (topic, message) => {
    const serviceName = topic.split('/')[1];
    if (!serviceRegistry[serviceName]) {
        console.error(`No active instances found for service: ${serviceName}`);
        return;
    }

    const instances = Object.values(serviceRegistry[serviceName]);
    const selectedInstance = instances[Math.floor(Math.random() * instances.length)];
    requestCount[selectedInstance.serviceId] = (requestCount[selectedInstance.serviceId] || 0) + 1;

    let forwardTopic;

    if(serviceName === 'appointment-management' || serviceName === 'available-appointments') {
        const action = topic.split('/')[2];
        forwardTopic = `request/${serviceName}/${selectedInstance.serviceId}/${action}`;
    } else {
        forwardTopic = `request/${serviceName}/${selectedInstance.serviceId}`;
    }

    mqttClient.publish(forwardTopic, message, (err) => {
        if (err) {
            console.error(`Failed to forward request to ${selectedInstance.serviceId} ${requestCount[selectedInstance.serviceId]}:`, err);
        } else {
            console.log(forwardTopic);
        }
    });

    if (requestCount[selectedInstance.serviceId] > maxRequests) {
        console.log(`Spawning a new instance for ${serviceName} due to high load.`);
        spawnService(serviceName);
    }
};

const monitorServiceLoad = () => {
    for (const serviceName in serviceRegistry) {
        const serviceInstances = Object.keys(serviceRegistry[serviceName]);

        for (const serviceId of serviceInstances) {
            const requests = requestCount[serviceId] || 0;

            // Handle scale-up
            if (requests > maxRequests) {
                console.log(`Scaling up: spawning new instance for ${serviceName}`);
                spawnService(serviceName);
            }

            // Handle scale-down
            if (requests < minRequests) {
                if (serviceInstances.length <= 1) {
                    //console.log(`Cannot scale down: only 1 instance of ${serviceName} is running.`);
                } else if (!lowRequestDurations[serviceId]) {
                    lowRequestDurations[serviceId] = Date.now();
                } else if (Date.now() - lowRequestDurations[serviceId] > lowLoadTimeLimit) {
                    console.log(`Low load detected for ${serviceName} instance ${serviceId}. Scaling down.`);
                    scaleDownService(serviceName, serviceId);
                }
            } else {
                delete lowRequestDurations[serviceId];
            }
        }
    }

    // Reset request counts every monitoring interval
    for (const serviceId in requestCount) {
        requestCount[serviceId] = 0;
    }
};

// Run load monitoring every  seconds
setInterval(monitorServiceLoad, 5000);

mqttClient.on('connect', () => {
    mqttClient.subscribe('registry/register', (err) => {
        if (err) console.error('Failed to subscribe to registry/register:', err);
    });

    mqttClient.subscribe('alerts/service', (err) => {
        if (err) console.error('Failed to subscribe to alerts/service:', err);
    });

    mqttClient.subscribe('request/#', (err) => {
        if (err) console.error('Failed to subscribe to request topics:', err);
    });
});

let number = 0;

mqttClient.on('message', (topic, message) => {
    if (topic.startsWith('registry/register')) {
        const registration = JSON.parse(message.toString());
        const { serviceName, serviceId } = registration;

        if (!serviceRegistry[serviceName]) {
            serviceRegistry[serviceName] = {};
        }

        if (serviceRegistry[serviceName][serviceId]) {
            console.log(`Service ID: ${serviceId} is already registered under ${serviceName}.`);
        } else {
            serviceRegistry[serviceName][serviceId] = registration;
            console.log(`Registered service: ${serviceName}, ID: ${serviceId}`);
        }

    } else if (topic.startsWith('alerts/service')) {
        handleAlert(topic, message);
    } else if ((topic.startsWith('request/') && topic.split('/').length === 2) || ((topic.startsWith('request/appointment-management') || topic.startsWith('request/available-appointments')) && topic.split('/').length === 3)) {
        number = number + 1;
        console.log(`request on load balancer ${number} ${topic}`);
        handleRequest(topic, message);
    }
});
