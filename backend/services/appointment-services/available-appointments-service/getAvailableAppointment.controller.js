import Appointment from "../models/appointment.js";
import mqttClient from "../../../shared/mqtt-client.js";

export const getAvailableAppointments = async (topic, message) => {
  const topicParts = topic.split("/");
  const action = topicParts[3];

  if (!["booked", "available", "bookedByDentist"].includes(action)) {
    console.error(`Invalid action in topic: ${topic}`);
    return;
  }

  console.log(`Request received on topic: ${topic}`);
  //console.log("Raw message:", message.toString());

  let correlationId;

    try {
        let parsedMessage; 
        try {
            parsedMessage = JSON.parse(message.toString());
        } catch (error) {
            correlationId = generateCorrelationId();
            const errorResponse = {
                correlationId,
                status: 'error',
                message: 'Invalid JSON format in request',
                error: error.message,
            };
            return publishAvailabilityResponse(correlationId, errorResponse, action);
        }
        correlationId = parsedMessage.correlationId;

        if (!parsedMessage.payload || typeof parsedMessage.payload !== 'object') {
            const errorResponse = {
                correlationId: parsedMessage.correlationId || generateCorrelationId(),
                status: 'error',
                message: 'Invalid or missing payload.',
            };
            return publishAvailabilityResponse(correlationId, errorResponse, action);
        }

    const { payload } = parsedMessage;
    const { dentistId = null, date = null, location = null, clinicId = null } = payload;

    let query;

    if (action === "bookedByDentist") {
      if (!dentistId) {
        const errorResponse = {
          correlationId,
          status: "error",
          message: "Dentist ID is required.",
        };
        return publishAvailabilityResponse(
          correlationId,
          errorResponse,
          action
        );
      }
      console.log(`Fetching booked appointments for dentistId: ${dentistId}`);
      query = { status: "booked", dentistId: dentistId };
    } else if (action == "booked") {
      const patientId = payload.patientId;
      query = { patientId: patientId };
    } else {
      query = { status: { $in: ["available", "canceled"] } };
      if (dentistId) query.dentistId = dentistId;
      if (date) query.date = date;
      if (location) query.location = location;
      if (clinicId) query.clinicId = clinicId;
    }

    const appointments = await Appointment.find(query).sort({
      date: 1,
      startTime: 1,
    });

        if (!appointments.length) {
            const noAppointmentsResponse = {
                correlationId,
                status: 'success',
                message: 'No appointments found.',
            };
            return publishAvailabilityResponse(correlationId, noAppointmentsResponse, action);
        }

        const dentistIds = [...new Set(appointments.map(app => app.dentistId.toString()))];
        //console.log ("in getAvailableAppointments")
        //console.log( dentistIds );
        const clinicIds = [...new Set(appointments.map(app => app.clinicId?.toString()).filter(Boolean))];

        const dentistDetails = await fetchDentistsInfo(dentistIds);
        const clinicDetails = await fetchClinicsInfo(clinicIds);

        const dentistMap = Object.fromEntries(dentistDetails.map(dentist => [dentist._id, dentist]));
        const clinicMap = Object.fromEntries(clinicDetails.map(clinic => [clinic._id, clinic]));

        const patientIds = [
          ...new Set(
            appointments.map((app) => app.patientId?.toString()).filter(Boolean)
          ),
        ];
        const patientDetails = await fetchPatientsInfo(patientIds);
    
        const patientMap = Object.fromEntries(
          patientDetails.map((patient) => [patient._id.toString(), patient])
        );
        

        const appointmentsWithDetails = appointments.map(app => ({
            ...app.toObject(),
            dentist: dentistMap[app.dentistId.toString()] || null,
            clinic: clinicMap[app.clinicId?.toString()] || null,
            patient: patientMap[app.patientId?.toString()] || null
        }));

    const successResponse = {
      correlationId,
      status: "success",
      message: "Appointments retrieved successfully",
      appointments: appointmentsWithDetails,
    };

    return publishAvailabilityResponse(correlationId, successResponse, action);
  } catch (error) {
    console.error("Error processing request:", error.message);
    const errorResponse = {
      correlationId,
      status: "error",
      message: "Error fetching appointments",
      error: error.message,
    };
    return publishAvailabilityResponse(correlationId, errorResponse, action);
  }
};

const fetchDentistsInfo = (dentistIds) => {
  return new Promise((resolve, reject) => {
    const correlationId = generateCorrelationId();
    console.log(correlationId);

    const payload = { dentistIds };
    //console.log("in fetchDentistInfo")
    //console.log(payload);

    const requestTopic = "request/dentist-info";

    const responseTopic = `response/dentist-info/${correlationId}`;

    const timeout = setTimeout(() => {
      mqttClient.unsubscribe(responseTopic);
      reject(new Error('Timeout waiting for dentist info response'));
    }, 20000);

    const handleResponse = (topic, message) => {
      console.log(`Received message on topic: ${topic}`);
      if (topic === responseTopic) {
        clearTimeout(timeout);
        mqttClient.unsubscribe(responseTopic);

        try {
          const parsedMessage = JSON.parse(message.toString());
          if (parsedMessage.status === 'success') {
            resolve(parsedMessage.dentists);
          } else {
            reject(new Error(parsedMessage.message));
          }
        } catch (err) {
          console.error('Error parsing response:', err);
          reject(err);
        }
      }
    };

    mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
        console.error('Failed to subscribe to response topic:', err);
        clearTimeout(timeout);
        reject(err);
      }
    });

    mqttClient.once('message', (topic, message) => {
      if (topic === responseTopic) {
        handleResponse(topic, message);
      }
    });

    mqttClient.publish(
      requestTopic,
      JSON.stringify({ correlationId, payload }),
      (err) => {
        if (err) {
          clearTimeout(timeout);
          mqttClient.off('message', handleResponse);
          reject(err);
        }
      }
    );
  });
};

const fetchPatientsInfo = (patientIds) => {
  return new Promise((resolve, reject) => {
    const correlationId = generateCorrelationId();

    const payload = { patientIds };
    const requestTopic = 'request/patient-info';
    const responseTopic = `response/patient-info/${correlationId}`;

    const timeout = setTimeout(() => {
      mqttClient.unsubscribe(responseTopic);
      reject(new Error('Timeout waiting for patient info response'));
    }, 20000);

    const handleResponse = (topic, message) => {
      if (topic === responseTopic) {
        clearTimeout(timeout);
        mqttClient.unsubscribe(responseTopic);

        try {
          const parsedMessage = JSON.parse(message.toString());
          if (parsedMessage.status === 'success') {
            resolve(parsedMessage.patients);
          } else {
            reject(new Error(parsedMessage.message));
          }
        } catch (err) {
          reject(err);
        }
      }
    };

    mqttClient.subscribe(responseTopic, (err) => {
      if (err) {
        clearTimeout(timeout);
        reject(err);
      }
    });

    mqttClient.once('message', (topic, message) => {
      if (topic === responseTopic) {
        handleResponse(topic, message);
      }
    });

    mqttClient.publish(
      requestTopic,
      JSON.stringify({ correlationId, payload }),
      (err) => {
        if (err) {
          clearTimeout(timeout);
          mqttClient.off('message', handleResponse);
          reject(err);
        }
      }
    );
  });
};

const fetchClinicsInfo = (clinicIds) => {
    return new Promise((resolve, reject) => {
        const correlationId = generateCorrelationId();
        console.log(correlationId);

        const payload = { clinicIds };

        const requestTopic = 'request/clinic-info';
        const responseTopic = `response/clinic-info/${correlationId}`;

        const timeout = setTimeout(() => {
            mqttClient.unsubscribe(responseTopic); 
            reject(new Error('Timeout waiting for clinic info response'));
        }, 20000);

        const handleResponse = (topic, message) => {
            console.log(`Received message on topic: ${topic}`);
            if (topic === responseTopic) {
                clearTimeout(timeout);
                mqttClient.unsubscribe(responseTopic);

                try {
                    const parsedMessage = JSON.parse(message.toString());
                    if (parsedMessage.status === 'success') {
                        resolve(parsedMessage.clinics);
                    } else {
                        reject(new Error(parsedMessage.message));
                    }
                } catch (err) {
                    console.error('Error parsing response:', err);
                    reject(err);
                }
            }
        };

        mqttClient.subscribe(responseTopic, (err) => {
            if (err) {
                console.error('Failed to subscribe to response topic:', err);
                clearTimeout(timeout);
                reject(err);
            }
        });

        mqttClient.once('message', (topic, message) => {
            if (topic === responseTopic) {
                handleResponse(topic, message);
            }
        });

        mqttClient.publish(requestTopic, JSON.stringify({ correlationId, payload }), (err) => {
            if (err) {
                clearTimeout(timeout);
                mqttClient.off('message', handleResponse);
                reject(err);
            }
        });
    });
};

const generateCorrelationId = () => `corr-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

const publishAvailabilityResponse = (correlationId, response, action) => {
  const responseTopic = `response/available-appointments/${action}/${correlationId}`;
  mqttClient.publish(responseTopic, JSON.stringify(response), (err) => {
    if (err) {
      console.error(`Failed to publish to ${responseTopic}:`, err);
    } else {
      console.log(`Response sent to ${responseTopic}`);
    }
  });
};
