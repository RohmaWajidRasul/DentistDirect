import time
import uuid
import json
import paho.mqtt.client as mqtt
from locust import User, TaskSet, task, between

class MQTTClientWrapper:
    def __init__(self, host="localhost", port=1883):
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.host = host
        self.port = port
        self.response_messages = {}

    def connect(self):
        """Connect to the MQTT broker."""
        try:
            self.client.connect(self.host, self.port, keepalive=60)
            print(f"Connecting to MQTT broker at {self.host}:{self.port}")
            self.client.loop_start()
        except Exception as e:
            print(f"Failed to connect to MQTT broker: {e}")

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("Connected to MQTT broker successfully.")
        else:
            print(f"Failed to connect, return code {rc}")

    def on_message(self, client, userdata, message):
        payload = message.payload.decode()
        print(f"Received message on topic {message.topic}: {payload}")
        self.response_messages[message.topic] = payload

    def publish(self, topic, payload):
        """Publish a message to a specified topic."""
        result = self.client.publish(topic, payload)
        if result.rc == mqtt.MQTT_ERR_SUCCESS:
            print(f"Message published to topic {topic}")
        else:
            print(f"Failed to publish message to topic {topic}: {result}")

    def subscribe(self, topic):
        """Subscribe to a specified topic."""
        self.client.subscribe(topic)
        print(f"Subscribed to topic: {topic}")

    def wait_for_response(self, topic, timeout=5):
        """Wait for a response on the given topic."""
        start_time = time.time()
        while time.time() - start_time < timeout:
            if topic in self.response_messages:
                return self.response_messages.pop(topic)
            time.sleep(0.1)
        return None


class DentistServiceTasks(TaskSet):
    def __init__(self, parent):
        super().__init__(parent)
        self.environment = parent.environment  # Pass environment from User class

    def on_start(self):
        self.mqtt_client = MQTTClientWrapper("localhost", 1883)
        self.mqtt_client.connect()

    @task(1)
    def register_dentist(self):
        """Simulate dentist registration"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/register-dentist"
        response_topic = f"response/register-dentist/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "firstName": "John",
                "lastName": "Doe",
                "specialization": "Orthodontics",
                "email": f"john.doe.{uuid.uuid4()}@example.com",
                "password": "Pass123!",
                "location": "Main Street Clinic",
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

        # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="register_dentist",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="register_dentist",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )

    @task(2)
    def fetch_dentist_info(self):
        """Simulate fetching dentist information"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/dentist-info"
        response_topic = f"response/dentist-info/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "dentistIds": ["674f6b44df75ca6c80505206"],
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

        # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="fetch_dentist_info",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="fetch_dentist_info",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )


class PatientServiceTasks(TaskSet):
    def __init__(self, parent):
        super().__init__(parent)
        self.environment = parent.environment  # Pass environment from User class

    def on_start(self):
        self.mqtt_client = MQTTClientWrapper("localhost", 1883)
        self.mqtt_client.connect()

    @task(1)
    def create_patient(self):
        """Simulate patient creation"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/create-patient"
        response_topic = f"response/create-patient/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "firstName": "Jane",
                "lastName": "Smith",
                "SSN": "123-45-6789",
                "email": f"jane.smith.{uuid.uuid4()}@example.com",
                "password": "SecurePass123!",
                "phoneNumber": "555-1234",
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

        # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="create_patient",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="create_patient",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )

    @task(2)
    def login_patient(self):
        """Simulate patient login"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/patient-login"
        response_topic = f"response/patient-login/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "email": f"jane.smith.{uuid.uuid4()}@example.com",
                "password": "SecurePass123!",
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

         # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="login_patient",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="login_patient",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )

class AppointmentServiceTasks(TaskSet):
    def __init__(self, parent):
        super().__init__(parent)
        self.environment = parent.environment  # Pass environment from User class

    def on_start(self):
        self.mqtt_client = MQTTClientWrapper("localhost", 1883)
        self.mqtt_client.connect()

    @task(1)
    def fetch_appointment_availability(self):
        """Simulate fetching appointment availability"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/available-appointments"
        response_topic = f"response/available-appointments/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "location": "Main Street Clinic"
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

        # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="fetch_appointment_availability",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="fetch_appointment_availability",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )

    @task(2)
    def create_appointment(self):
        """Simulate creating an appointment"""
        start_time = time.time()
        correlation_id = str(uuid.uuid4())
        request_topic = "request/create-appointment"
        response_topic = f"response/create-appointment/{correlation_id}"
        payload = {
            "correlationId": correlation_id,
            "payload": {
                "dentistId": "674f6b44df75ca6c80505206",
                "date": "2024-12-14",
                "startTime": "09:00",
                "endTime": "10:00"
            },
        }

        self.mqtt_client.subscribe(response_topic)
        self.mqtt_client.publish(request_topic, json.dumps(payload))

        # Wait for response and track the time
        response = self.mqtt_client.wait_for_response(response_topic)
        response_time = (time.time() - start_time) * 1000  # Convert to ms

        if response:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="create_appointment",
                response_time=response_time,
                response_length=len(response),
                exception=None,
            )
        else:
            self.environment.events.request.fire(
                request_type="MQTT",
                name="create_appointment",
                response_time=response_time,
                response_length=0,
                exception=Exception("No response received"),
            )


class MixedServiceUser(User):
    tasks = [DentistServiceTasks, PatientServiceTasks, AppointmentServiceTasks]
    wait_time = between(1, 5)  # Wait between 1 and 5 seconds between tasks
