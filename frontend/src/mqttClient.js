import mqtt from 'mqtt';

const mqttURL = 'wss://test.mosquitto.org:8081';
const mqttClient = mqtt.connect(mqttURL);

mqttClient.on('connect', () => {
  console.log('Frontend MQTT client connected to broker');
});

mqttClient.on('error', (err) => {
  console.error('Frontend MQTT connection error:', err);
});

export default mqttClient;
