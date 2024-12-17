import mqtt from 'mqtt';
import dotenv from 'dotenv';

dotenv.config();

var mqttURL = process.env.MQTT_BROKER_URL_BACKEND || 'tcp://test.mosquitto.org';


const mqttClient = mqtt.connect(mqttURL);

mqttClient.on('connect', () => {
    console.log(`MQTT broker connected on port ${mqttURL}`);
});

mqttClient.on('error', (err) => {
    console.error('MQTT connection error:', err);
});

export default mqttClient;
