import mqtt from 'mqtt';

// Use the WebSocket URL for the MQTT broker
const mqttURL = import.meta.env.VITE_MQTT_BROKER_URL_FRONTEND || 'ws://localhost:9001';

if (!mqttURL) {
  console.error('MQTT Broker URL is not defined');
}
const mqttClient = mqtt.connect(mqttURL);

mqttClient.on('connect', () => {
  console.log(`Frontend MQTT client connected to broker on ${mqttURL}`);
});

mqttClient.on('error', (err) => {
  console.log(mqttURL)
  console.log(import.meta.env)

  console.error('Frontend MQTT connection error:', err);
});

export default mqttClient;
