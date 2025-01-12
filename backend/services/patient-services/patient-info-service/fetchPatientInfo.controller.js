import Patient from "../models/patient.js";
import mqttClient from "../../../shared/mqtt-client.js";

export const fetchPatientInfo = async (topic, message) => {
  console.log(`Handling message on topic: ${topic}`);

  let correlationId;

  try {
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      const errorResponse = {
        correlationId,
        status: "error",
        message: "Invalid JSON format in request",
        error,
      };
      return publishResponse(correlationId, errorResponse);
    }
    correlationId = parsedMessage.correlationId;

    if (!correlationId) {
      throw new Error("Correlation ID is missing in the request");
    }

    const { patientIds } = parsedMessage.payload;

    console.log(patientIds);

    let patients;
    if (patientIds && patientIds.length > 0) {
      // Fetch patients by IDs if IDs are provided
      patients = await Patient.find({ _id: { $in: patientIds } }).select(
        "firstName lastName email phoneNumber"
      );
    } else {
      // Get all patients if no IDs are provided
      patients = await Patient.find().select(
        "firstName lastName email phoneNumber"
      );
    }

    if (!patients || patients.length === 0) {
      const errorResponse = {
        correlationId,
        status: "error",
        message: "No patients found for the provided IDs",
      };
      return publishResponse(correlationId, errorResponse);
    }

    const successResponse = {
      correlationId,
      status: "success",
      message: "Patient info retrieved successfully",
      patients,
    };
    return publishResponse(correlationId, successResponse);
  } catch (error) {
    console.error(`Error fetching patient info: ${error.message}`);
    const errorResponse = {
      correlationId,
      status: "error",
      message: "Error fetching patient info",
      error: error.message,
    };
    return publishResponse(correlationId, errorResponse);
  }
};

const publishResponse = (correlationId, response) => {
  const responseTopic = `response/patient-info/${correlationId}`;
  console.log(response);
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
};
