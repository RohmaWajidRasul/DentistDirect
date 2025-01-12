import { describe, it, vi, expect, afterEach, beforeEach } from 'vitest';
import { createMessage } from '../createNotification.controller.js';
import Notification from '../../models/notification.js';
import Patient from '../../models/patient.js';
import mqttClient from '../../../../shared/mqtt-client.js';


// Mock dependencies
vi.mock('../../models/notification.js');
vi.mock('../../models/patient.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
   default: {
       publish: vi.fn(),
   },
}));


describe('createMessage', () => {
   beforeEach(() => {
       vi.restoreAllMocks(); // Reset mocks before each test
   });


   afterEach(() => {
       vi.clearAllMocks(); // Clear any stored mock after each test
   });


   it('should return an error for invalid JSON message', async () => {
       const invalidMessage = 'not-json';


       await createMessage(invalidMessage);


       expect(mqttClient.publish).not.toHaveBeenCalledWith();
   });




   it('should return an error if correlationId is missing', async () => {
       const messageWithoutCorrelationId = JSON.stringify({
           payload: { patientId: '123', notification: { body: 'test', subject: 'test' } },
       });


       await createMessage(messageWithoutCorrelationId);


       expect(mqttClient.publish).not.toHaveBeenCalledWith();
   });

   it('should return an error if required fields are missing', async () => {
       const messageWithoutRequiredFields = JSON.stringify({
           correlationId: '12345',
           payload: { patientId: '123' }, // Missing notification
       });


       await createMessage(messageWithoutRequiredFields);


       expect(mqttClient.publish).toHaveBeenCalledWith(
           expect.stringContaining('response/create-notifcation/123/12345'),
           expect.stringContaining('"All fields are required"'),
           expect.any(Function)
       );
   });


   it('should return an error if the patient is not found', async () => {
       Patient.findById.mockResolvedValue(null); // Simulate patient not found


       const messageWithNonExistentPatient = JSON.stringify({
           correlationId: '12345',
           payload: { patientId: 'nonexistent',
           notification: { body: 'test', subject: 'test' }
         },
       });


       await createMessage( messageWithNonExistentPatient);


       expect(mqttClient.publish).toHaveBeenCalledWith(
           expect.stringContaining('response/create-notifcation/nonexistent/12345'),
           expect.stringContaining('"Patient not found."'),
           expect.any(Function)
       );
   });


   it('should successfully create a notification for a valid request', async () => {
       const mockPatient = {
           _id: '123',
           notifications: [],
           save: vi.fn(),
       };
       const mockNotification = {
           _id: 'notif123',
           body: 'Test Body',
           subject: 'Test Subject',
           save: vi.fn().mockResolvedValue({
               _id: 'notif123',
               body: 'Test Body',
               subject: 'Test Subject',
           }),
       };


       Patient.findById.mockResolvedValue(mockPatient);
       Notification.mockImplementation(() => mockNotification);


       const validMessage = JSON.stringify({
           correlationId: '12345',
           payload: {
               patientId: '123',
               notification: { body: 'Test Body', subject: 'Test Subject' },
           },
       });


       await createMessage(validMessage);


       expect(Notification).toHaveBeenCalledWith({
           body: 'Test Body',
           subject: 'Test Subject',
       });
       expect(mockNotification.save).toHaveBeenCalled();
       expect(mockPatient.save).toHaveBeenCalled();
       expect(mqttClient.publish).toHaveBeenCalledWith(
           expect.stringContaining('response/create-notifcation/123/12345'),
           expect.stringContaining('"Notification create successfully"'),
           expect.any(Function)
       );
   });
});
