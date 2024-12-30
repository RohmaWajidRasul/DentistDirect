/* global jest, describe, beforeEach, it, expect */

import { getAvailableAppointments } from '../getAvailableAppointments.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
jest.mock('../../models/appointment.js');
jest.mock('../../../../shared/mqtt-client.js', () => ({
  publish: jest.fn(),
  subscribe: jest.fn(),
  on: jest.fn(),
  once: jest.fn(),
  unsubscribe: jest.fn(),
}));

describe('getAvailableAppointments', () => {
  const validTopic = 'request/appointments/availability/fetch';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: { dentistId: 'dentist123', date: '2024-12-31', location: 'New York' },
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
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
    Appointment.find.mockResolvedValue([]); // Simulate no appointments found

    await getAvailableAppointments(validTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched'),
      expect.stringContaining('No appointments found.'),
      expect.any(Function)
    );
  });

  it('should fetch dentist information and return appointments with dentist details', async () => {
    // Mock appointments and dentist information
    const mockAppointments = [
      { _id: 'appointment1', dentistId: 'dentist123', toObject: jest.fn().mockReturnValue({ _id: 'appointment1', dentistId: 'dentist123' }) },
      { _id: 'appointment2', dentistId: 'dentist456', toObject: jest.fn().mockReturnValue({ _id: 'appointment2', dentistId: 'dentist456' }) },
    ];
    const mockDentists = [
      { _id: 'dentist123', name: 'Dr. John' },
      { _id: 'dentist456', name: 'Dr. Jane' },
    ];

    Appointment.find.mockResolvedValue(mockAppointments);

    // Mock the dentist info fetcher
    jest.spyOn(global, 'fetchDentistsInfo').mockResolvedValue(mockDentists);

    await getAvailableAppointments(validTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/availability/fetched'),
      expect.stringContaining('Appointments and dentist info retrieved successfully'),
      expect.any(Function)
    );

    // Restore the mocked fetcher
    global.fetchDentistsInfo.mockRestore();
  });

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
