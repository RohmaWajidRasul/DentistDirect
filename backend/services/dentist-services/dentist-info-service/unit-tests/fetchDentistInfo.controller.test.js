import { vi, describe, it, expect, afterEach } from 'vitest';
import { fetchDentistInfo } from '../fetchDentistInfo.controller.js';
import Dentist from '../../models/dentist.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/dentist.js', () => ({
    default: {
      find: vi.fn(), // Mock the find method
    },
  }));
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

describe('fetchDentistInfo', () => {
  const validTopic = 'request/dentists/info';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: { dentistIds: ['dentist1', 'dentist2'] },
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clear mocks after each test
  });

  it('should handle invalid JSON format in the message', async () => {
    const invalidMessage = 'Invalid JSON';

    // Call the function with invalid JSON
    await fetchDentistInfo(validTopic, invalidMessage);

    // Verify that the error response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should handle missing or invalid dentistIds payload', async () => {
    const messageWithInvalidPayload = JSON.stringify({
      correlationId: '12345',
      payload: { dentistIds: null },
    });

    // Call the function with invalid payload
    await fetchDentistInfo(validTopic, messageWithInvalidPayload);

    // Verify that the error response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/12345'),
      expect.stringContaining('A list of Dentist IDs is required'),
      expect.any(Function)
    );
  });

  it('should handle no dentists found for provided IDs', async () => {
    // Mock `find` to return a query object with a `select` method
    const mockQuery = {
      select: vi.fn().mockResolvedValue([]), // Mock `select` to return no dentists
    };
    Dentist.find.mockReturnValue(mockQuery);

    // Call the function
    await fetchDentistInfo(validTopic, validMessage);

    // Verify `find` was called with the correct query
    expect(Dentist.find).toHaveBeenCalledWith({ _id: { $in: ['dentist1', 'dentist2'] } });

    // Verify the error response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/12345'),
      expect.stringContaining('No dentists found for the provided IDs'),
      expect.any(Function)
    );
  });

  it('should return dentist info successfully', async () => {
    // Mock dentists to return
    const mockDentists = [
      { _id: 'dentist1', firstName: 'John', lastName: 'Doe', location: 'New York', specialization: 'Orthodontics' },
      { _id: 'dentist2', firstName: 'Jane', lastName: 'Smith', location: 'Los Angeles', specialization: 'Pediatrics' },
    ];
  
    // Mock `find` to return a query object with a `select` method
    const mockQuery = {
      select: vi.fn().mockResolvedValue(mockDentists), // Mock `select` to return mock dentists
    };
    Dentist.find.mockReturnValue(mockQuery);
  
    // Call the function
    await fetchDentistInfo(validTopic, validMessage);
  
    // Verify `find` was called with the correct query
    expect(Dentist.find).toHaveBeenCalledWith({ _id: { $in: ['dentist1', 'dentist2'] } });
  
    // Verify the success response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/12345'),
      expect.stringContaining('Dentist info retrieved successfully'),
      expect.any(Function)
    );
  
    // Verify the response contains the correct dentist info
    const expectedResponse = {
      correlationId: '12345',
      status: 'success',
      message: 'Dentist info retrieved successfully',
      dentists: mockDentists,
    };
  
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/12345'),
      JSON.stringify(expectedResponse),
      expect.any(Function)
    );
  });  

  it('should handle exceptions gracefully', async () => {
    Dentist.find.mockRejectedValue(new Error('Database error')); // Mock a database error

    await fetchDentistInfo(validTopic, validMessage);

    // Verify that the error response is published
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/dentists/info/12345'),
      expect.stringContaining('Error fetching dentist info'),
      expect.any(Function)
    );
  });
});
