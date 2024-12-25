<template>
    <div class="map-container">
        <div id="map"></div>
    </div>
</template>

<script>
import mqttClient from '../mqttClient.js';
import { onMounted } from 'vue';
import { onBeforeUnmount } from 'vue';

import L from 'leaflet'; // Import Leaflet first
import 'leaflet/dist/leaflet.css'; // Base Leaflet CSS
import * as LocateControl from "leaflet.locatecontrol";
// Solves conflicting import
if (LocateControl?.locate && !L.control.locate) {
    L.Control.Locate = LocateControl.LocateControl || LocateControl
    L.control.locate = function (options) {
        return new L.Control.Locate(options)
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
        try {
            map = L.map('map').setView([57.7089, 11.9746], 13)
            // OpenStreetMap tile layer
            L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(map)
        } catch (error) {
            console.error('Error initializing map:', error)
        }
    }

    const addMarker = (coordinates, clinicName, clinicLocation) => {
        try {
            console.log('Adding marker at:', coordinates, 'with name:', clinicName, 'located at:', clinicLocation)
            const marker = L.marker([coordinates.lat, coordinates.lng]).addTo(map)
            marker.bindPopup(`${clinicName} <br> Location: ${clinicLocation}`).openPopup()
            markers.push(marker)
        } catch (error) {
            console.error('Error adding marker:', error)
        }
    }

    const addLocateControl = () => {
        try {
            if (L.control.locate) {
                L.control.locate({
                    position: 'topleft',
                    strings: {
                    title: "Show where I am!"
                    }
                }).addTo(map);
                console.log('Location control added');
            } else {
                console.error('Location control not available');
            }
        } catch (error) {
            console.error('Error adding location', error)
        }
    
    }
    
    const handleClinicData = (topic, message) => {
        try {
            console.log('handleClinicData called with topic:', topic);
            const response = JSON.parse(message.toString())
            if(response.status === 'success'){
                response.clinics.forEach((clinic) => {
                console.log('Adding clinic:', clinic)
                console.log('Clinic coordinates:', clinic.latitude, clinic.longitude);
                    addMarker( 
                        { lat: parseFloat(clinic.latitude), lng: parseFloat(clinic.longitude)},
                        clinic.name,
                        clinic.location
                    )
            })
            } else {
                console.error('Failed to retrieve clinics:', response.message);
            }
            
            
        } catch (error) {
            console.error('Error handling clinc data:', error)
        } 
    }

    const requestClinicData = () => {
        correlationId = Date.now().toString()
        const requestTopic = 'request/retrieve-clinics'
        const responseTopic = `response/retrieve-clinics/${correlationId}`
        try {
            mqttClient.subscribe(responseTopic, (err) => {
                if (err) {
                    console.error('Failed to subscribe to response topic:', err)
                } else {
                    console.log(`Subscribed to response topic: ${responseTopic}`)
                }
            })
            const payload = {
                correlationId,
                payload: {}
            }
            mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
                if (err) {
                    console.error('Failed to publish clinic data request:', err)
                } else {
                    console.log(`Request published to topic: ${requestTopic}`);
                }
            })
        } catch (error) {
            console.error('Error requesting clinic data:', error)
        }
    }

    mqttClient.on('message', (topic, message) => {
        try {
            if (topic.startsWith('response/retrieve-clinics/')) {
            console.log('Received response:', topic, message.toString());
            handleClinicData(topic, message);
            }
        } catch (error) {
            console.error('Error processing MQTT message:', error)
        }
        
    })

    onMounted(() => {
        initializeMap();
        addLocateControl();
        requestClinicData();
     })

    onBeforeUnmount(() => {
        try {
            if (correlationId) {
                mqttClient.unsubscribe(`response/retrieve-clinics/${correlationId}`)
            }
            mqttClient.off('message', handleClinicData)
        } catch (error) {
            console.error('Error during unsubscribe', error)
        }
    })
  },
};
</script>

<style scoped>
#map {
    height: 400px;
    width: 80vh;
}

.map-container {
    display: flex;
    justify-content: center;
    height: 400px;
    margin: 20px;
    box-sizing: border-box;
}
</style>
