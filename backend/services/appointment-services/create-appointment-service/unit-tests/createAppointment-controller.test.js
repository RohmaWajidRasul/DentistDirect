import { vi, describe, it, expect, afterAll, beforeEach } from 'vitest';
import { createAppointment } from '../createAppointment.controller.js';
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

describe('createAppointment', () => {
  const validTopic = 'request/create-appointment';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: {
      dentistId: 'dentist123',
      date: '2024-12-31',
      startTime: '10:00',
      endTime: '11:00',
      clinicId: 'clinic123',
    },
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  it('should publish an error response for invalid JSON message', async () => {
    const invalidMessage = 'Invalid JSON';
    await createAppointment(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/create-appointment/undefined'),
      expect.stringContaining('Invalid JSON format in request'),
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
      expect.stringContaining('response/create-appointment/12345'),
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
        clinicId: 'clinic123',
      },
    });

    await createAppointment(validTopic, invalidTimeMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/create-appointment/12345'),
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
        clinicId: 'clinic123',
      },
    });

    await createAppointment(validTopic, invalidDurationMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/create-appointment/12345'),
      expect.stringContaining('End time must be after start time'),
      expect.any(Function)
    );
  });

  it('should create an appointment and publish a success response', async () => {
    // Mock dependencies
    Appointment.prototype.save = vi.fn().mockResolvedValue(); // Mock save method

    await createAppointment(validTopic, validMessage);

    // Verify that the appointment is saved
    expect(Appointment.prototype.save).toHaveBeenCalled();

    // Verify the success response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/create-appointment/12345'),
      expect.stringContaining('Appointment created successfully'),
      expect.any(Function)
    );
  });

  it('should handle errors and publish an error response', async () => {
    Appointment.prototype.save.mockRejectedValue(new Error('Database error')); // Simulate save error

    await createAppointment(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/create-appointment/12345'),
      expect.stringContaining('Error creating appointment'),
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
