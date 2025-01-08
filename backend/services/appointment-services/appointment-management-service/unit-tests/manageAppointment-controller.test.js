import { vi, describe, it, expect, afterAll, beforeEach } from 'vitest';

import { manageAppointment } from '../manageAppointment.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/appointment.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
    subscribe: vi.fn(),
    on: vi.fn(),
    once: vi.fn(),
    unsubscribe: vi.fn(),
    end: vi.fn(),
  },
}));

describe('manageAppointment', () => {
  const validTopic = 'request/appointment-management';
  const validMessage = JSON.stringify({
    correlationId: '1234',
    payload: { appointmentId: 'abcd', status: 'booked', patientId: '5678' },
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it('should publish an error response for invalid JSON message', async () => {
    const invalidMessage = 'Invalid JSON';

    await manageAppointment(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/undefined'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should publish an error response if appointment ID is missing', async () => {
    const invalidMessage = JSON.stringify({
      correlationId: '1234',
      payload: { status: 'booked' },
    });

    await manageAppointment(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      expect.stringContaining('Appointment ID is required'),
      expect.any(Function)
    );
  });

  it('should publish an error response if appointment is not found', async () => {
    Appointment.findById.mockResolvedValue(null); // Simulate no appointment found

    await manageAppointment(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      JSON.stringify({
        correlationId: '1234',
        status: 'error',
        message: 'Appointment not found',
      }),
      expect.any(Function)
    );
  });

  it('should handle a "booked" status update successfully', async () => {
    const appointmentMock = {
      status: 'available',
      save: vi.fn(),
      patientId: undefined, // Ensure patientId is initially undefined
    };
    Appointment.findById.mockResolvedValue(appointmentMock);

    await manageAppointment(validTopic, validMessage);

    // Verify the appointment status was updated
    expect(appointmentMock.status).toBe('booked');
    expect(appointmentMock.patientId).toBe('5678'); // Verify patientId was updated
    expect(appointmentMock.save).toHaveBeenCalled();

    // Verify MQTT publish call
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      JSON.stringify({
        correlationId: '1234',
        status: 'success',
        message: 'Appointment updated successfully',
        appointment: {
          status: 'booked',
          patientId: '5678',
        },
      }),
      expect.any(Function)
    );
  });

  it('should handle a "canceled" status update successfully', async () => {
    const updatedMessage = JSON.stringify({
      correlationId: '1234',
      payload: { appointmentId: 'abcd', status: 'canceled' },
    });

    const appointmentMock = {
      status: 'booked',
      patientId: '5678',
      save: vi.fn(),
    };
    Appointment.findById.mockResolvedValue(appointmentMock);

    await manageAppointment(validTopic, updatedMessage);

    // Verify the appointment status was updated
    expect(appointmentMock.status).toBe('canceled');
    expect(appointmentMock.patientId).toBe(null);
    expect(appointmentMock.save).toHaveBeenCalled();

    // Verify MQTT publish call
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      JSON.stringify({
        correlationId: '1234',
        status: 'success',
        message: 'Appointment updated successfully',
        appointment: {
          status: 'canceled',
          patientId: null,
        },
      }),
      expect.any(Function)
    );
  });

  it('should handle a "deleted" status update successfully', async () => {
    const updatedMessage = JSON.stringify({
      correlationId: '1234',
      payload: { appointmentId: 'abcd', status: 'deleted' },
    });

    const appointmentMock = { status: 'canceled', save: vi.fn() };
    Appointment.findById.mockResolvedValue(appointmentMock);

    await manageAppointment(validTopic, updatedMessage);

    // Verify the appointment status was updated
    expect(appointmentMock.status).toBe('deleted');
    expect(appointmentMock.save).toHaveBeenCalled();

    // Verify MQTT publish call
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      JSON.stringify({
        correlationId: '1234',
        status: 'success',
        message: 'Appointment updated successfully',
        appointment: {
          status: 'deleted',
        },
      }),
      expect.any(Function)
    );
  });

  it('should handle errors gracefully', async () => {
    Appointment.findById.mockRejectedValue(new Error('Database error')); // Simulate database error

    await manageAppointment(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/appointment-management/updated/1234'),
      expect.stringContaining('Error processing request'),
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
