import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import { fetchDentistInfo } from '../fetchDentistInfo.controller.js';
import Dentist from '../../models/dentist.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/dentist.js', () => ({
  default: {
    find: vi.fn(),
  },
}));

vi.mock('../../../../shared/mqtt-client.js', () => ({
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
vi.mock('../fetchDentistInfo.controller.js', async () => {
  const actual = await vi.importActual('../fetchDentistInfo.controller.js');
  return {
    ...actual,
    publishResponse: vi.fn((correlationId, response) => {
      const responseTopic = `response/dentist-info/${correlationId}`;
      mqttClient.publish(responseTopic, JSON.stringify(response), () => {});
    }),
  };
});

describe('fetchDentistInfo', () => {
  const validTopic = 'request/dentists/info';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: { dentistIds: ['dentist1', 'dentist2'] },
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clear mocks after each test
  });

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle invalid JSON format in the message', async () => {
    const invalidMessage = 'Invalid JSON';

    await fetchDentistInfo(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should handle missing correlationId in the message', async () => {
    const messageWithoutCorrelationId = JSON.stringify({
      payload: { dentistIds: ['dentist1', 'dentist2'] },
    });

    await fetchDentistInfo(validTopic, messageWithoutCorrelationId);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/'),
      expect.stringContaining('Correlation ID is missing in the request'),
      expect.any(Function)
    );
  });

  it('should return all dentists when no dentistIds are provided', async () => {
    const messageWithoutDentistIds = JSON.stringify({
      correlationId: '12345',
      payload: {},
    });

    const mockDentists = [
      { _id: 'dentist1', firstName: 'John', lastName: 'Doe', specialization: 'Orthodontics' },
      { _id: 'dentist2', firstName: 'Jane', lastName: 'Smith', specialization: 'Pediatrics' },
    ];

    Dentist.find.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockDentists),
    });

    await fetchDentistInfo(validTopic, messageWithoutDentistIds);

    expect(Dentist.find).toHaveBeenCalledWith();
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/12345'),
      expect.stringContaining('Dentist info retrieved successfully'),
      expect.any(Function)
    );
  });

  it('should return dentist info successfully for provided IDs', async () => {
    const mockDentists = [
      { _id: 'dentist1', firstName: 'John', lastName: 'Doe', specialization: 'Orthodontics' },
      { _id: 'dentist2', firstName: 'Jane', lastName: 'Smith', specialization: 'Pediatrics' },
    ];

    Dentist.find.mockReturnValue({
      select: vi.fn().mockResolvedValue(mockDentists),
    });

    await fetchDentistInfo(validTopic, validMessage);

    expect(Dentist.find).toHaveBeenCalledWith({ _id: { $in: ['dentist1', 'dentist2'] } });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/12345'),
      expect.stringContaining('Dentist info retrieved successfully'),
      expect.any(Function)
    );
  });

  it('should handle no dentists found for provided IDs', async () => {
    Dentist.find.mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    });

    await fetchDentistInfo(validTopic, validMessage);

    expect(Dentist.find).toHaveBeenCalledWith({ _id: { $in: ['dentist1', 'dentist2'] } });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/12345'),
      expect.stringContaining('No dentists found for the provided IDs'),
      expect.any(Function)
    );
  });

  it('should handle exceptions gracefully', async () => {
    // Mock a database error
    Dentist.find.mockRejectedValue(new Error('Database error'));

    await fetchDentistInfo(validTopic, validMessage);

    // Verify that the publish function is called with the correct error message
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentist-info/12345'),
      expect.stringContaining('Error fetching dentist info'),
      expect.any(Function)
    );
  });
});
