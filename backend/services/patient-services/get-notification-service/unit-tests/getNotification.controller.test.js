import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { getMessages } from '../getNotification.controller.js';
import Patient from '../../models/patient.js';
import Notification from '../../models/notification.js';
import mqttClient from '../../../../shared/mqtt-client.js';


vi.mock('../../models/patient.js', () => ({
 default: {
   find: vi.fn(),
   findById: vi.fn(),
 },
}));


vi.mock('../../../../shared/mqtt-client.js', () => ({
 default: {
   publish: vi.fn(),
 },
}));


describe('getMessages', () => {
 const mockTopic = 'request/messages/fetch';


 beforeEach(() => {
   vi.restoreAllMocks();


 });


 afterEach(() => {
   vi.clearAllMocks();


 });


 it('should handle invalid JSON format in the message', async () => {
   const invalidMessage = 'not-json';


   await getMessages(mockTopic, invalidMessage);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/messages/fetched/'),
     expect.stringContaining('"Invalid JSON format in request"'),
     expect.any(Function)
   );
 });


 it('should return an error if correlationId is missing', async () => {
   const messageWithoutCorrelationId = JSON.stringify({
     payload: { patientId: '12345' },
   });


   await getMessages(mockTopic, messageWithoutCorrelationId);


   expect(mqttClient.publish).not.toHaveBeenCalledWith();
 });


 it('should return an error if patientId is invalid or not found', async () => {
   Patient.findById.mockResolvedValue(null); // Simulate no patient found
   const message = JSON.stringify({
     correlationId: '12345',
     payload: {
       patientId: 'invalid-id'
      },
   });


   await getMessages(mockTopic, message);
  
   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/messages/fetched/12345'),
     expect.stringContaining('"Error fetching notifications"'),
     expect.any(Function)
   );
 });


 it('should retrieve notifications and return success', async () => {
   const mockNotifications = [
     { message: 'Notification 1' },
     { message: 'Notification 2' },
   ];


   const mockPatient = {
     notifications: mockNotifications,
     populate: vi.fn().mockResolvedValue(),
   };
   
   Patient.findById.mockResolvedValue(mockPatient);
   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'valid-id' },
   });


   await getMessages(mockTopic, message);


   expect(mockPatient.populate).toHaveBeenCalledWith('notifications');
   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/messages/fetched/12345'),
     expect.stringContaining('"Notifications retrieved successfully"'),
     expect.any(Function)
   );
 });


 it('should handle errors during patient fetching', async () => {
   Patient.findById.mockRejectedValue(new Error('Database error'));


   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'valid-id' },
   });


   await getMessages(mockTopic, message);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/messages/fetched/12345'),
     expect.stringContaining('"Error fetching notifications"'),
     expect.any(Function)
   );
 });
});
