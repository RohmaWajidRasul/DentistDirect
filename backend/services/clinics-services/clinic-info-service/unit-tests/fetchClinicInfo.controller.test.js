import { vi, describe, it, expect, afterEach } from 'vitest';
import { fetchClinicInfo } from '../fetchClinicInfo.controller.js';
import Clinic from '../../models/clinic.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/clinic.js', () => ({
    default: {
        find: vi.fn(),
    },
}));
vi.mock('../../../../shared/mqtt-client', () => ({
    default: {
        publish: vi.fn(), // Properly mock publish as a spy
        subscribe: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        unsubscribe: vi.fn(),
        end: vi.fn(),
    },
    }));

// Mock publishResponse function
    vi.mock('../fetchClinicInfo.controller.js', async() => {
        const actual = await vi.importActual('../fetchClinicInfo.controller.js'); 
        return{
            ...actual, 
            publishResponse: vi.fn((correlationId, response) => {
                const responseTopic = `response/clinic-info/${correlationId}`; 
                mqttClient.publish(responseTopic, JSON.stringify(response), () => {});
            }),
        };
    });

describe('fetchClinicInfo', () => {
  const validTopic = 'request/clinic-info';
  const validMessage = JSON.stringify({
    correlationId: '67890',
    payload: { clinicIds: ['clinic1', 'clinic2'] },
  });

 beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks(); 
  });

  it('should handle invalid JSON format in the message', async () => {
    const invalidMessage = 'Invalid JSON';

    await fetchClinicInfo(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should handle missing correlation ID in the message', async () => {
    const messageWithoutCorrelationId = JSON.stringify({
      payload: { clinicIds: ['clinic1', 'clinic2'] },
    });

    await fetchClinicInfo(validTopic, messageWithoutCorrelationId);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/'),
      expect.stringContaining('Correlation ID is missing in the request'),
      expect.any(Function)
    );
  });

  it('should handle no clinics found for provided IDs', async () => {
    const mockQuery = {
      select: vi.fn().mockResolvedValue([]), // Simulate no clinics found
    };
    Clinic.find.mockReturnValue(mockQuery);

    await fetchClinicInfo(validTopic, validMessage);

    expect(Clinic.find).toHaveBeenCalledWith({ _id: { $in: ['clinic1', 'clinic2'] } });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/67890'),
      expect.stringContaining('No clinics found for the provided IDs'),
      expect.any(Function)
    );
  });

  it('should return all clinics when no clinic IDs are provided', async () => {
    const messageWithNoClinicIds = JSON.stringify({
      correlationId: '67890',
      payload: { clinicIds: [] },
    });

    const mockClinics = [
      { _id: 'clinic1', name: 'Dental Clinic A', location: 'City A', longitude: 10.1, latitude: 20.2 },
      { _id: 'clinic2', name: 'Dental Clinic B', location: 'City B', longitude: 30.3, latitude: 40.4 },
    ];
    const mockQuery = {
      select: vi.fn().mockResolvedValue(mockClinics),
    };
    Clinic.find.mockReturnValue(mockQuery);

    await fetchClinicInfo(validTopic, messageWithNoClinicIds);

    expect(Clinic.find).toHaveBeenCalledWith();
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/67890'),
      expect.stringContaining('Clinic info retrieved successfully'),
      expect.any(Function)
    );
  });

  it('should return clinic info successfully when valid IDs are provided', async () => {
    const mockClinics = [
      { _id: 'clinic1', name: 'Dental Clinic A', location: 'City A', longitude: 10.1, latitude: 20.2 },
      { _id: 'clinic2', name: 'Dental Clinic B', location: 'City B', longitude: 30.3, latitude: 40.4 },
    ];
    const mockQuery = {
      select: vi.fn().mockResolvedValue(mockClinics),
    };
    Clinic.find.mockReturnValue(mockQuery);

    await fetchClinicInfo(validTopic, validMessage);

    expect(Clinic.find).toHaveBeenCalledWith({ _id: { $in: ['clinic1', 'clinic2'] } });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/67890'),
      expect.stringContaining('Clinic info retrieved successfully'),
      expect.any(Function)
    );

    const expectedResponse = {
      correlationId: '67890',
      status: 'success',
      message: 'Clinic info retrieved successfully',
      clinics: mockClinics,
    };
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/67890'),
      JSON.stringify(expectedResponse),
      expect.any(Function)
    );
  });

  it('should handle exceptions gracefully', async () => {
    Clinic.find.mockRejectedValue(new Error('Database error'));

    await fetchClinicInfo(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/clinic-info/67890'),
      expect.stringContaining('Error fetching clinic info'),
      expect.any(Function)
    );
  });
});
