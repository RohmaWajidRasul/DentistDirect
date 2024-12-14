<template>
    <div class="map-container">
        <div id="map"></div>
    </div>
  <div>
    <div>
        
    </div>
    <div>
    </div>
  </div>
</template>

<script>
import mqttClient from '../mqttClient.js';
import { onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';

import L from 'leaflet'; // Import Leaflet first
import 'leaflet/dist/leaflet.css'; // Base Leaflet CSS
import * as LocateControl from "leaflet.locatecontrol";

if (LocateControl?.locate && !L.control.locate) {
    L.Control.Locate = LocateControl.LocateControl || LocateControl;
    L.control.locate = function (options) {
        return new L.Control.Locate(options);
    };
}
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css'; // Plugin CSS


export default {
  name: 'MapComponent',
  setup() {
    let map;
    const markers = [];
    let correlationId = null;

    const initializeMap = () => {
        map = L.map('map').setView([57.7089, 11.9746], 13);

        // OpenStreetMap tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);
    }

    const addMarker = (coordinates, dentistName) => {
        console.log('Adding marker at:', coordinates, 'with name:', dentistName);
        const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map)
        marker.bindPopup(`${dentistName}`).openPopup()
        markers.push(marker)
    }

    const addLocateControl = () => {
    if (L.control.locate) {
        L.control.locate({
            position: 'topright',
            strings: {
                title: "Show me where I am!"
            }
        }).addTo(map);
        console.log('Location control added');
    } else {
        console.error('Location control not available');
    }
    }
    
    const handleDentistData = (topic, message) => {
        console.log('handleDentistData called with topic:', topic);
        if (topic.startsWith('response/dentists/info')) {
            console.log('Processing response:', message.toString());
            try {
                const response = JSON.parse(message.toString())
                if (response.status === 'success' && Array.isArray(response.dentists)) {
                console.log('Dentists to process:', response.dentists);
                response.dentists.forEach((dentist) => {
                    console.log('Adding dentist:', dentist)
                    console.log('Dentist coordinates:', dentist.latitude, dentist.longitude);
                    console.log('Dentist name:', `${dentist.firstName} ${dentist.lastName}`);
                    console.log('Raw message received:', message.toString());
                    addMarker( {
                        lat: parseFloat(dentist.latitude), lng: parseFloat(dentist.longitude)
                    },
                    `${dentist.firstName} ${dentist.lastName}` )
                })
                } else {
                    console.error('Failed to fetch dentist data:', response.message)
                }

            } catch (error) {
                console.error('Error parsing message or processing dentists:', error)
            }
        } else {
            console.error('Unexpected topic received:', topic)
        }
        
    }

    const requestDentistData = () => {
        correlationId = Date.now().toString()
        const requestTopic = 'request/dentists/info'
        const responseTopic = `response/dentists/info/${correlationId}`

        mqttClient.subscribe(responseTopic, (err) => {
            if (err) {
                console.error('Failed to subscribe to response topic:', err)
            } else {
                console.log(`Subscribed to response topic: ${responseTopic}`)
            }
        })
        const payload = {
            correlationId,
            payload: {
                dentistIds: [],
            }
        }
        mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
            if (err) {
                console.error('Failed to publish dentist data request:', err)
            } else {
                console.log(`Request published to topic: ${requestTopic}`);
            }
        })
    }
    mqttClient.on('message', (topic, message) => {
        if (topic.startsWith('response/dentists/info/')) {
            console.log('Received response:', topic, message.toString());
            handleDentistData(topic, message);
        }
    })

    onMounted(() => {
        initializeMap();
        addLocateControl();
        requestDentistData();
     });

    onBeforeUnmount(() => {
        if (correlationId) {
            mqttClient.unsubscribe(`response/dentists/info/${correlationId}`)
        }
        mqttClient.off('message', handleDentistData)
    })
  },
};
</script>

<style scoped>
#map {
    height: 400px;
    width: 50%;
}

.map-container {
    display: flex;
    justify-content: center;
    height: 400px;
    margin: 20px;
    box-sizing: border-box;
}

</style>
