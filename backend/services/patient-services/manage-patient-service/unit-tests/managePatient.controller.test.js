import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { managePatient } from '../managePatient.controller.js';
import Patient from '../../models/patient.js';
import mqttClient from '../../../../shared/mqtt-client.js';


vi.mock('../../models/patient.js', () => ({
 default: {
   findById: vi.fn(),
 },
}));


vi.mock('../../../../shared/mqtt-client.js', () => ({
 default: {
   publish: vi.fn(),
 },
}));


describe('managePatient', () => {
   const mockTopic = 'request/manage-patient';


 beforeEach(() => {
   vi.restoreAllMocks(); // Reset mocks before each test
 });


 afterEach(() => {
   vi.clearAllMocks(); // Clear mock data after each test
 });


 const mockPatient = {
   save: vi.fn().mockResolvedValue(),
   preferences: {},
 };


 it('should handle invalid JSON format in the request', async () => {
   const invalidMessage = 'not-json';


   await managePatient(mockTopic, invalidMessage);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/'),
     expect.stringContaining('"Invalid JSON format in request"'),
     expect.any(Function)
   );
 });


 it('should handle missing correlationId', async () => {
   const messageWithoutCorrelationId = JSON.stringify({
     payload: { patientId: '12345' },
   });


   await managePatient(mockTopic, messageWithoutCorrelationId);


   expect(mqttClient.publish).not.toHaveBeenCalledWith();
 });


 it('should handle missing patientId in the payload', async () => {
   const messageWithoutPatientId = JSON.stringify({
     correlationId: '12345',
     payload: {},
   });


   await managePatient(mockTopic, messageWithoutPatientId);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Patient ID is required"'),
     expect.any(Function)
   );
 });


 it('should handle patient not found', async () => {
   Patient.findById.mockResolvedValue(null);


   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'invalid-id' },
   });


   await managePatient(mockTopic, message);


   expect(Patient.findById).toHaveBeenCalledWith('invalid-id');
   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Patient not found"'),
     expect.any(Function)
   );
 });


 it('should handle restricted update to SSN', async () => {
   Patient.findById.mockResolvedValue(mockPatient);


   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'valid-id', SSN: '123-45-6789' },
   });


   await managePatient(mockTopic, message);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Cannot change SSN"'),
     expect.any(Function)
   );
 });


 it('should handle updates to preferences', async () => {
   Patient.findById.mockResolvedValue(mockPatient);


   const message = JSON.stringify({
     correlationId: '12345',
     payload: {
       patientId: 'valid-id',
       preferences: {
         dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
         dentist: 'Dr. Smith',
       },
     },
   });


   await managePatient(mockTopic, message);


   expect(mockPatient.preferences).toEqual({
     dateRange: { startDate: '2024-01-01', endDate: '2024-12-31' },
     dentist: 'Dr. Smith',
     specialization: '',
     clinic: null,
   });
   expect(mockPatient.save).toHaveBeenCalled();
   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Patient updated successfully"'),
     expect.any(Function)
   );
 });


 it('should handle invalid fields in the update', async () => {
   Patient.findById.mockResolvedValue(mockPatient);


   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'valid-id', invalidField: 'some value' },
   });


   await managePatient(mockTopic, message);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Invalid field: invalidField"'),
     expect.any(Function)
   );
 });


 it('should handle errors during request processing', async () => {
   Patient.findById.mockRejectedValue(new Error('Database error'));


   const message = JSON.stringify({
     correlationId: '12345',
     payload: { patientId: 'valid-id' },
   });


   await managePatient(mockTopic, message);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/manage-patient/12345'),
     expect.stringContaining('"Error processing request"'),
     expect.any(Function)
   );
 });
});
