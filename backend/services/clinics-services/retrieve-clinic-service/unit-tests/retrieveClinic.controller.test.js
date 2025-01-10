import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest';
import { retrieveClinics } from '../retrieveClinic.controller.js';
import Clinic from '../../models/clinic.js';
import mqttClient from '../../../../shared/mqtt-client.js';

vi.mock('../../models/clinic.js', () => ({
    default: {
        find: vi.fn(),
    },
})); 

vi.mock('../../../../shared/mqtt-client.js', () => ({
    default: {
        publish: vi.fn(),
    },

}));

describe('retrieveClinics', () => {
    const validTopic = 'request/retrieve-clinics'; 

    beforeEach(() => {
        vi.clearAllMocks(); // Reset mocks before each test 
      });
    
      afterEach(() => {
        vi.restoreAllMocks(); // Clear any stored mock after each test 
      });
    
      it('should return an error for invalid JSON message', async () => {
        const invalidMessage = 'not-json';
    
        await retrieveClinics(validTopic, invalidMessage);
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/retrieve-clinics/'),
            expect.stringContaining('"Invalid JSON format in request"'),
            expect.any(Function)
        );
    });

    it('should return an error if correlationId is missing', async () => {
        const messageWithoutCorrelationId = JSON.stringify({
          payload: { name: 'Clinic A', location: 'Stenpiren' },
        });
    
        await retrieveClinics(validTopic, messageWithoutCorrelationId);
    
        expect(mqttClient.publish).not.toHaveBeenCalled(); // Check and verify that MQTT publish was not called due to missing correlationId

      });
    
    it('should retrieve all clinics', async () => {
        Clinic.find.mockResolvedValue([
          { name: 'Clinic A', location: 'Stenpiren' },
          { name: 'Clinic B', location: 'Lindholmen' },
        ]);
    
        const messageWithoutPayload = JSON.stringify({
          correlationId: '12345',
          payload: {},
        });
    
        await retrieveClinics(validTopic, messageWithoutPayload);
    
        expect(Clinic.find).toHaveBeenCalledWith({});
        expect(mqttClient.publish).toHaveBeenCalledWith(
          expect.stringContaining('response/retrieve-clinics/12345'),
          expect.stringContaining('"Clinics retrieved successfully."'),
          expect.any(Function)
        );
      });
    
    it('should retrieve clinics filtered by name', async () => {
        Clinic.find.mockResolvedValue([{ name: 'Clinic A', location: 'Stenpiren' }]); // Mock database response: a clinic with name: Clinic A

    
        const message = JSON.stringify({
          correlationId: '12345',
          payload: { name: 'Clinic A' },
        });
    
        await retrieveClinics(validTopic, message);
    
        expect(Clinic.find).toHaveBeenCalledWith({ name: 'Clinic A' });
        expect(mqttClient.publish).toHaveBeenCalledWith(
          expect.stringContaining('response/retrieve-clinics/12345'),
          expect.stringContaining('"Clinics retrieved successfully."'),
          expect.any(Function)
        );
    });

    it('should retrieve clinics filtered by location', async () => {
        Clinic.find.mockResolvedValue([{ name: 'Clinic B', location: 'Lindholmen' }]); // Mock database response: a clinic with location: Lindholmen

    
        const message = JSON.stringify({
          correlationId: '12345',
          payload: { location: 'Lindholmen' },
        });
    
        await retrieveClinics(validTopic, message);
    
        expect(Clinic.find).toHaveBeenCalledWith({ location: 'Lindholmen' });
        expect(mqttClient.publish).toHaveBeenCalledWith(
          expect.stringContaining('response/retrieve-clinics/12345'),
          expect.stringContaining('"Clinics retrieved successfully."'),
          expect.any(Function)
        );
    });
    it('should retrieve clinics filtered by name and location', async () => {
        Clinic.find.mockResolvedValue([{ name: 'Clinic A', location: 'Stenpiren' }]);
    
        const message = JSON.stringify({
          correlationId: '12345',
          payload: { name: 'Clinic A', location: 'Stenpiren' },
        });
    
        await retrieveClinics(validTopic, message);
    
        expect(Clinic.find).toHaveBeenCalledWith({ name: 'Clinic A', location: 'Stenpiren' });
        expect(mqttClient.publish).toHaveBeenCalledWith(
          expect.stringContaining('response/retrieve-clinics/12345'),
          expect.stringContaining('"Clinics retrieved successfully."'),
          expect.any(Function)
        );
      });
    
      it('should handle database errors', async () => {
        Clinic.find.mockRejectedValue(new Error('Database error'));
    
        const message = JSON.stringify({
          correlationId: '12345',
          payload: { name: 'Clinic A' },
        });
    
        await retrieveClinics(validTopic, message);
    
        expect(mqttClient.publish).toHaveBeenCalledWith(
          expect.stringContaining('response/retrieve-clinics/12345'),
          expect.stringContaining('"Error retrieving clinics."'),
          expect.any(Function)
        );
    });
});

