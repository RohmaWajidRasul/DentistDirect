/* global jest, describe, beforeEach, it, expect */

import { createAppointment } from '../createAppointment.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
jest.mock('../../models/appointment.js');
jest.mock('../../../shared/mqtt-client.js', () => ({
  publish: jest.fn(),
}));

describe('createAppointment', () => {
  const validTopic = 'request/appointments/create';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: {
      dentistId: 'dentist123',
      date: '2024-12-31',
      startTime: '10:00',
      endTime: '11:00',
    },
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });

  it('should ignore requests with an invalid topic', async () => {
    const invalidTopic = 'invalid/topic';
    await createAppointment(invalidTopic, validMessage);

    // Ensure no database interaction or MQTT publishing
    expect(Appointment.findOne).not.toHaveBeenCalled();
    expect(mqttClient.publish).not.toHaveBeenCalled();
  });

  it('should publish an error response for invalid JSON message', async () => {
    const invalidMessage = 'Invalid JSON';
    await createAppointment(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should publish an error response if correlationId is missing', async () => {
    const messageWithoutCorrelationId = JSON.stringify({
      payload: {
        dentistId: 'dentist123',
        date: '2024-12-31',
        startTime: '10:00',
        endTime: '11:00',
      },
    });

    await createAppointment(validTopic, messageWithoutCorrelationId);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Correlation ID is missing in the request'),
      expect.any(Function)
    );
  });

  it('should publish an error response if required fields are missing', async () => {
    const incompleteMessage = JSON.stringify({
      correlationId: '12345',
      payload: {
        dentistId: 'dentist123',
        date: '2024-12-31',
        startTime: '10:00',
      },
    });

    await createAppointment(validTopic, incompleteMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('All fields are required'),
      expect.any(Function)
    );
  });

  it('should publish an error response for invalid time format', async () => {
    const invalidTimeMessage = JSON.stringify({
      correlationId: '12345',
      payload: {
        dentistId: 'dentist123',
        date: '2024-12-31',
        startTime: '25:00',
        endTime: '26:00',
      },
    });

    await createAppointment(validTopic, invalidTimeMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Invalid time format. Must be HH:MM.'),
      expect.any(Function)
    );
  });

  it('should publish an error response if end time is before start time', async () => {
    const invalidDurationMessage = JSON.stringify({
      correlationId: '12345',
      payload: {
        dentistId: 'dentist123',
        date: '2024-12-31',
        startTime: '11:00',
        endTime: '10:00',
      },
    });

    await createAppointment(validTopic, invalidDurationMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('End time must be after start time'),
      expect.any(Function)
    );
  });

  it('should publish an error response if an appointment already exists', async () => {
    Appointment.findOne.mockResolvedValue({ _id: 'appointment123' }); // Simulate existing appointment

    await createAppointment(validTopic, validMessage);

    expect(Appointment.findOne).toHaveBeenCalledWith({
      dentistId: 'dentist123',
      date: '2024-12-31',
      startTime: '10:00',
    });

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Appointment already exists at this time.'),
      expect.any(Function)
    );
  });

  it('should create an appointment and publish a success response', async () => {
    Appointment.findOne.mockResolvedValue(null); // No existing appointment
    Appointment.prototype.save = jest.fn().mockResolvedValue(); // Mock save

    await createAppointment(validTopic, validMessage);

    expect(Appointment.findOne).toHaveBeenCalledWith({
      dentistId: 'dentist123',
      date: '2024-12-31',
      startTime: '10:00',
    });

    expect(Appointment.prototype.save).toHaveBeenCalled();

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Appointment created successfully'),
      expect.any(Function)
    );
  });

  it('should handle errors and publish an error response', async () => {
    Appointment.findOne.mockRejectedValue(new Error('Database error')); // Simulate database error

    await createAppointment(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointments/created'),
      expect.stringContaining('Error creating appointment'),
      expect.any(Function)
    );
  });
});
