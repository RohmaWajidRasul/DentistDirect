import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import { getAvailableAppointments } from '../getAvailableAppointment.controller.js';

// Mock dependencies
vi.mock('../../models/appointment.js', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
  },
}));

// Mock console
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'log').mockImplementation(() => {});

describe('getAvailableAppointments', () => {
  const mockTopic = 'request/available-appointments/available';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: {
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
      clinicId: 'clinic123',
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return an error for invalid action in topic', async () => {
    const invalidTopic = 'request/available-appointments/invalid-action';

    await getAvailableAppointments(invalidTopic, validMessage);

    expect(console.error).toHaveBeenCalledWith(
      'Invalid action in topic: request/available-appointments/invalid-action'
    );
    expect(mqttClient.publish).not.toHaveBeenCalled();
  });

  it('should return an error for invalid JSON message', async () => {
    const invalidMessage = 'Invalid JSON';
  
    // Call the controller
    await getAvailableAppointments(mockTopic, invalidMessage);
  
    // Verify that mqttClient.publish was called with the correct arguments
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/undefined', // Topic with undefined correlationId
      JSON.stringify({
        correlationId: undefined,
        status: 'error',
        message: 'Invalid JSON format in request',
        error: expect.any(Object), // Error should be an object
      }),
      expect.any(Function) // Callback argument
    );
  });
  
  it('should return an error for missing or invalid payload', async () => {
    const invalidPayloadMessage = JSON.stringify({
      correlationId: '12345',
      payload: null,
    });

    await getAvailableAppointments(mockTopic, invalidPayloadMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Invalid or missing payload.',
      }),
      expect.any(Function)
    );
  });

  it('should return an error when no appointments are found', async () => {
    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([]),
    });

    await getAvailableAppointments(mockTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
      clinicId: 'clinic123',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'No appointments found.',
      }),
      expect.any(Function)
    );
  });

  it('should handle successful response with appointments and details', async () => {
    const mockAppointments = [
      { _id: 'appointment1', dentistId: 'dentist123', clinicId: 'clinic123', toObject: () => ({}) },
      { _id: 'appointment2', dentistId: 'dentist456', clinicId: 'clinic123', toObject: () => ({}) },
    ];

    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue(mockAppointments),
    });

    await getAvailableAppointments(mockTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
      clinicId: 'clinic123',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'success',
        message: 'Appointments and dentist info retrieved successfully',
        appointments: expect.any(Array),
      }),
      expect.any(Function)
    );
  });

  it('should return an error when a database exception occurs', async () => {
    Appointment.find.mockRejectedValueOnce(new Error('Database error'));

    await getAvailableAppointments(mockTopic, validMessage);

    expect(console.error).toHaveBeenCalledWith('Error processing request:', 'Database error');
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Error fetching appointments',
        error: 'Database error',
      }),
      expect.any(Function)
    );
  });
});
