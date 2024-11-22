import express from "express";
import mqttClient from "../../shared/mqtt-client.js";

const router = express.Router();

router.patch("/:slotId", (req, res) => {
  const { slotId } = req.params;
  const correlationId = Date.now().toString();

  const requestTopic = "request/slots/cancel";
  const responseTopic = `response/slots/cancelled/${correlationId}`;

  const payload = { correlationId, payload: { slotId } };

  mqttClient.publish(requestTopic, JSON.stringify(payload), (err) => {
    if (err) {
      console.error("Failed to publish cancel request", err);
      return res
        .status(500)
        .json({ message: "Failed to publish cancel request" });
    }

    // Timeout after 5sec
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

      mqttClient.on("message", (topic, message) => {
        if (topic === responseTopic) {
          clearTimeout(timeout);
          mqttClient.unsubscribe(responseTopic);

          const response = JSON.parse(message.toString());

          const statusCode = response.status === "success" ? 200 : 400;
          return res.status(statusCode).json(response);
        }
      });
    });
  });
});

export default router;
