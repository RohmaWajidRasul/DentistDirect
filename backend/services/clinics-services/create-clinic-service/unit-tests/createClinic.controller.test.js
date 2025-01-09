import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest';
import { registerClinic } from '../createClinic.controller';
import Clinic from '../../models/clinic.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/clinic.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
    default: {
        publish: vi.fn(), 
    },  
}));


describe('registerClinic', () => {
    const validTopic = 'request/register-clinic';

    beforeEach(() => {
        vi.restoreAllMocks(); // Reset mocks before each test 
    });
      
    afterEach(() => {
        vi.clearAllMocks(); // Clear any stored mock after each test 
    });

 
  it('should return an error for invalid JSON message', async () => {
    const invalidMessage = 'not-json';

    await registerClinic(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/register-clinic/'),
      expect.stringContaining('"Invalid JSON format in request"'),
      expect.any(Function)
    );
  });



  it('should return an error if correlationId is missing', async () => {
    const validTopic = 'request/register-clinic';
    const messageWithoutCorrelationId = JSON.stringify({
      payload: {
        name: 'Clinic 1',
        location: 'Gothenburg Center',
        latitude: 50.1,
        longitude: 8.6,
      },
    });

    await registerClinic(validTopic, messageWithoutCorrelationId);

    expect(mqttClient.publish).not.toHaveBeenCalledWith(); // Check and verify that MQTT publish was not called due to missing correlationId
  });

  it('should return an error if required fields are missing', async () => {
    const validTopic = 'request/register-clinic';
    const messageWithoutRequiredFields = JSON.stringify({
      correlationId: '12345',
      payload: { name: 'Clinic 1' }, // Missing location, latitude, longitude
    });

    await registerClinic(validTopic, messageWithoutRequiredFields);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/register-clinic/12345'),
      expect.stringContaining('"All fields are required."'),
      expect.any(Function)
    );
  });

  it('should return an error if the clinic already exists', async () => {
    Clinic.findOne.mockResolvedValue({ name: 'Clinic 1', location: 'Gothenburg Center' });
    const validTopic = 'request/register-clinic';
    const messageWithExistingClinic= JSON.stringify({
      correlationId: '12345',
      payload: {
        name: 'Clinic 1',
        location: 'Gothenburg Center',
        latitude: 50.1,
        longitude: 8.6,
      },
    });

    await registerClinic(validTopic, messageWithExistingClinic);

    expect(Clinic.findOne).toHaveBeenCalledWith({ name: 'Clinic 1', location: 'Gothenburg Center' });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/register-clinic/12345'),
      expect.stringContaining('"Clinic already exists."'),
      expect.any(Function)
    );
  });

  it('should successfully register a new clinic', async () => {
    Clinic.findOne.mockResolvedValue(null); // Simulate that no clinics were found with same name and location 
    vi.spyOn(Clinic.prototype, 'save').mockResolvedValue({
      name: 'Clinic 1', 
        location: 'Gothenburg Center',
    });
    
    const validTopic = 'request/register-clinic';
    const validMessage = JSON.stringify({
      correlationId: '12345',
      payload: {
        name: 'Clinic 1',
        location: 'Gothenburg Center',
        latitude: 50.1,
        longitude: 8.6,
      },
    });

    await registerClinic(validTopic, validMessage);

    expect(Clinic.findOne).toHaveBeenCalledWith({ name: 'Clinic 1', location: 'Gothenburg Center' });
    expect(Clinic.prototype.save).toHaveBeenCalled();
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/register-clinic/12345'),
      expect.stringContaining('"Clinic registered successfully."'),
      expect.any(Function)
    );
  });

  it('should handle database errors', async () => {
    Clinic.findOne.mockRejectedValue(new Error('Database error')); // Simulate a database error 

    const validTopic = 'request/register-clinic';
    const message = JSON.stringify({
      correlationId: '12345',
      payload: {
        name: 'Clinic 1',
        location: 'Gothenburg Center',
        latitude: 50.1,
        longitude: 8.6,
      },
    });

    await registerClinic(validTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/register-clinic/12345'),
      expect.stringContaining('"Error registering clinic."'),
      expect.any(Function)
    );
  });
});
