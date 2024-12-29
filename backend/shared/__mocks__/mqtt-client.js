/* global jest */

const mqttClientMock = {
  // Simulate the `publish` method
  publish: jest.fn((topic, message, callback) => {
    console.log(`Mock Publish to topic: ${topic} with message: ${message}`);
    if (callback) callback(null); // Simulate a successful publish
  }),

  // Simulate the `subscribe` method
  subscribe: jest.fn((topic, options, callback) => {
    console.log(`Mock Subscribe to topic: ${topic}`);
    if (callback) callback(null, topic); // Simulate a successful subscription
  }),

  // Simulate the `on` method for event listeners
  on: jest.fn((event, callback) => {
    console.log(`Mock On Event: ${event}`);
    if (event === 'connect') {
      // Simulate the connect event being triggered
      callback();
    } else if (event === 'error') {
      // Simulate an error event if needed in tests
      callback(new Error('Mock MQTT connection error'));
    }
  }),

  // Simulate the `end` method for closing the connection
  end: jest.fn(() => {
    console.log('Mock MQTT client disconnected');
  }),
};

// Export the mock object
module.exports = mqttClientMock;
