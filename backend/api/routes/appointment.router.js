import express from 'express';
import mqttClient from '../../shared/mqtt-client.js';

const router = express.Router();

router.get('/', (req, res) => {
    const { dentistId, location, clinicId } = req.body;
    const date = req.query.date;
    const correlationId = Date.now().toString();

    const requestTopic = 'request/available-appointments/available';
    const responseTopic = `response/available-appointments/available/${correlationId}`;

    const payload = { dentistId, date, location, clinicId };
    console.log(payload);

    let responseSent = false;

    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            console.error("Failed to publish fetch request", err);
            if (!responseSent) {
                responseSent = true;
                return res
                    .status(500)
                    .json({ message: "Failed to publish fetch request" });
            }
        }
    });

    const timeout = setTimeout(() => {
        if (!responseSent) {
            responseSent = true;
            mqttClient.unsubscribe(responseTopic);
            return res
                .status(504)
                .json({ message: "Request timeout. No response from server." });
        }
    }, 20000);

    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            if (!responseSent) {
                responseSent = true;
                return res
                    .status(500)
                    .json({ message: "Failed to subscribe to response topic" });
            }
        }
    });

    mqttClient.on('message', (topic, message) => {
        if (topic === responseTopic) {
            clearTimeout(timeout);
            mqttClient.unsubscribe(responseTopic);
            if (!responseSent) {
                responseSent = true;
                const response = JSON.parse(message.toString());
                const status = response.status === 'success' ? 200 : 404;
                res.status(status).json(response);
            }
        }
    });
});



router.patch("/:appointmentId", (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;

    if (status && !["canceled", "booked"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });

    }

    const correlationId = Date.now().toString();

    let requestTopic = "request/appointment-management";
    let responseTopic = `response/appointment-management/updated/${correlationId}`;
  
    const payload = { appointmentId, ...req.body };


    //console.log(requestTopic);
    mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
        if (err) {
            console.error("Failed to publish request", err);
            return res
                .status(500)
                .json({ message: "Failed to publish request" });
        }
    });
  
    const timeout = setTimeout(() => {
        mqttClient.unsubscribe(responseTopic);
        return res
          .status(504)
          .json({ message: "Request timeout. No response from server." });
    }, 5000);
    
    mqttClient.subscribe(responseTopic, (err) => {
        if (err) {
            clearTimeout(timeout);
            console.error("Failed to subscribe to response topic", err);
            return res
                .status(500)
                .json({ message: "Failed to subscribe to response topic" });
        }  
    });
  
    mqttClient.on("message", (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          mqttClient.unsubscribe(responseTopic);

          const response = JSON.parse(message.toString());

          const statusCode = response.status === "success" ? 200 : 404;
          return res.status(statusCode).json(response);
        }  
    });
});

export default router;
