import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import { getAvailableAppointments } from '../getAvailableAppointment.controller.js';
import { fetchDentistsInfo } from '../getAvailableAppointment.controller.js';
import { fetchClinicsInfo } from '../getAvailableAppointment.controller.js';

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

vi.mock('../getAvailableAppointment.controller.js', async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    fetchDentistsInfo: vi.fn(),
    fetchClinicsInfo: vi.fn(),
  };
});

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

    expect(mqttClient.publish).toHaveBeenCalledWith(
        expect.stringContaining('response/available-appointments/available/'),
        JSON.stringify({
            correlationId: expect.any(String),
            status: 'error',
            message: 'Invalid JSON format in request',
            error: expect.any(String),
        }),
        expect.any(Function)
    );
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

    const mockDentists = [
      { _id: 'dentist123', name: 'Dr. Smith' },
      { _id: 'dentist456', name: 'Dr. Johnson' },
    ];

    const mockClinics = [
      { _id: 'clinic123', name: 'Main Street Dental' },
    ];

    // Mock find, fetchDentistsInfo, and fetchClinicsInfo
    Appointment.find.mockReturnValueOnce({
      sort: vi.fn().mockResolvedValue(mockAppointments),
    });
    
    vi.mocked(fetchDentistsInfo).mockResolvedValue(mockDentists);
    vi.mocked(fetchClinicsInfo).mockResolvedValue(mockClinics);

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
    Appointment.find.mockRejectedValueOnce(new Error('Database error'));

    await getAvailableAppointments(mockTopic, validMessage);

    expect(console.error).toHaveBeenCalledWith('Error processing request:', 'Database error');
  });
});
