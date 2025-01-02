import { vi, describe, it, expect, afterAll, beforeEach } from 'vitest';
import { getAvailableAppointments } from '../getAvailableAppointment.controller.js';
// import { fetchDentistsInfo } from '../../../dentist-services/fetchDentistInfo.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/appointment.js');
vi.mock('../../../dentist-services/fetchDentistInfo.controller.js', () => ({
  fetchDentistsInfo: vi.fn(),
}));

vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    unsubscribe: vi.fn(),
    end: vi.fn(),
  }
}));

describe('getAvailableAppointments', () => {
  const validTopic = 'request/appointments/availability/fetch';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: { dentistId: 'dentist123', date: '2024-12-31', location: 'New York' },
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it('should ignore requests with an invalid topic', async () => {
    const invalidTopic = 'invalid/topic';
    await getAvailableAppointments(invalidTopic, validMessage);

    // Ensure no MQTT publish or database interactions
    expect(mqttClient.publish).not.toHaveBeenCalled();
    expect(Appointment.find).not.toHaveBeenCalled();
  });

  it('should publish an error response for invalid JSON message', async () => {
    const invalidMessage = 'Invalid JSON';
    await getAvailableAppointments(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should publish an error response for missing or invalid payload', async () => {
    const invalidPayloadMessage = JSON.stringify({
      correlationId: '12345',
      payload: null,
    });

    await getAvailableAppointments(validTopic, invalidPayloadMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched'),
      expect.stringContaining('Invalid or missing payload.'),
      expect.any(Function)
    );
  });

  it('should publish an error response when no appointments are found', async () => {
    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockReturnValue([]), // Simulate an empty array for "no appointments found"
    });
  
  
    await getAvailableAppointments(validTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched/12345'), // Match the correct topic structure
      expect.stringContaining('No appointments found.'), // Ensure correct error message
      expect.any(Function)
    );
  });

  /*
  it('should return available appointments with mocked dentist information', async () => {
    // Mock appointments
    const mockAppointments = [
      { _id: 'appointment1', dentistId: 'dentist123' },
      { _id: 'appointment2', dentistId: 'dentist456' },
    ];
  
    // Mock Appointment.find to return an object with a chainable sort method
    Appointment.find.mockReturnValue({
      sort: vi.fn().mockResolvedValue(mockAppointments), // Chainable .sort method
    });
  
    // Expected response
    const expectedResponse = {
      correlationId: '12345',
      status: 'success',
      message: 'Appointments retrieved successfully',
      appointments: mockAppointments,
    };
  
    // Call the function
    await getAvailableAppointments(validTopic, validMessage);
  
    // Verify Appointment.find is called with the correct query
    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
    });
  
    // Verify mqttClient.publish is called with the expected response
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched/12345'),
      JSON.stringify(expectedResponse),
      expect.any(Function)
    );
  }, 10000);
  */
  
  it('should publish an error response when an exception occurs', async () => {
    Appointment.find.mockRejectedValue(new Error('Database error')); // Simulate a database error

    await getAvailableAppointments(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched'),
      expect.stringContaining('Error fetching appointments'),
      expect.any(Function)
    );
  });
});

// Add cleanup logic after all tests
afterAll(() => {
  mqttClient.unsubscribe(); // Unsubscribe from all topics
  mqttClient.end(); // Close the MQTT connection
  vi.clearAllTimers();
  vi.clearAllMocks();
});