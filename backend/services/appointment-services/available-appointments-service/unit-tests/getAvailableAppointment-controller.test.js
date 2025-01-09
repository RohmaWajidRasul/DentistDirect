import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

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

// Mock the controller functions
vi.mock('../getAvailableAppointment.controller.js', async (importOriginal) => {
  const originalModule = await importOriginal();
  console.log('Mocking module...'); // Log to check if this part runs
  return {
    ...originalModule,
    fetchDentistsInfo: vi.fn().mockResolvedValue([
      { _id: 'dentist123', name: 'Dr. Smith' },
      { _id: 'dentist456', name: 'Dr. Johnson' },
    ]),
    fetchClinicsInfo: vi.fn().mockResolvedValue([
      { _id: 'clinic123', name: 'Main Street Dental' },
    ]),
  };
});

import { getAvailableAppointments, fetchClinicsInfo, fetchDentistsInfo } from '../getAvailableAppointment.controller.js';


describe('fetchDentistsInfo', () => {
  it('should return mocked dentist data', async () => {
    const dentists = await fetchDentistsInfo(['dentist123', 'dentist456']);
    expect(dentists).toEqual([
      { _id: 'dentist123', name: 'Dr. Smith' },
      { _id: 'dentist456', name: 'Dr. Johnson' },
    ]);
  });
});


describe('getAvailableAppointments', () => {
  const mockTopic = 'request/available-appointments/1/available';
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
    console.error = vi.fn();
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

    await getAvailableAppointments(mockTopic, invalidMessage);

    const [topic, message,] = mqttClient.publish.mock.calls[0];

    expect(topic).toContain('response/available-appointments/available/');

    const parsedMessage = JSON.parse(message);

    expect(parsedMessage).toMatchObject({
      status: 'error',
      message: 'Invalid JSON format in request',
    });

    expect(typeof parsedMessage.correlationId).toBe('string');
    expect(parsedMessage.error).toContain("Unexpected token");
  });

  it('should return an error when no appointments are found', async () => {
    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue([]), // Empty result
    });

    await getAvailableAppointments(mockTopic, validMessage);

    expect(Appointment.find).toHaveBeenCalledWith({
      status: { $in: ['available', 'canceled'] },
      dentistId: 'dentist123',
      date: '2024-12-31',
      location: 'New York',
      clinicId: 'clinic123',
    });
  });

  it('should handle successful response with appointments and details', async () => {
    const mockAppointments = [
      {
        _id: 'appointment1',
        dentistId: 'dentist123',
        clinicId: 'clinic123',
        toObject: () => ({ _id: 'appointment1', dentistId: 'dentist123', clinicId: 'clinic123' }),
      },
      {
        _id: 'appointment2',
        dentistId: 'dentist456',
        clinicId: 'clinic123',
        toObject: () => ({ _id: 'appointment2', dentistId: 'dentist456', clinicId: 'clinic123' }),
      },
    ];

    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue(mockAppointments),
    });

    // No need to mock fetchDentistsInfo and fetchClinicsInfo here
    // They are already mocked in the vi.mock block

    await getAvailableAppointments(mockTopic, validMessage);

    // Assert if the mocked functions were called
    expect(fetchDentistsInfo).toHaveBeenCalledWith(['dentist123', 'dentist456']);
    expect(fetchClinicsInfo).toHaveBeenCalledWith(['clinic123']);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/available-appointments/available/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'success',
        message: 'Appointments and dentist info retrieved successfully',
        appointments: [
          {
            _id: 'appointment1',
            dentistId: 'dentist123',
            clinicId: 'clinic123',
            dentist: { _id: 'dentist123', name: 'Dr. Smith' },
            clinic: { _id: 'clinic123', name: 'Main Street Dental' },
          },
          {
            _id: 'appointment2',
            dentistId: 'dentist456',
            clinicId: 'clinic123',
            dentist: { _id: 'dentist456', name: 'Dr. Johnson' },
            clinic: { _id: 'clinic123', name: 'Main Street Dental' },
          },
        ],
      }),
      expect.any(Function)
    );
  });

  it('should return an error when a database exception occurs', async () => {
    Appointment.find.mockImplementation(() => ({
      sort: vi.fn(() => {
        throw new Error('Database error');
      }),
    }));

    await getAvailableAppointments(mockTopic, validMessage);

    expect(console.error).toHaveBeenCalledWith('Error processing request:', 'Database error');
  });
});
