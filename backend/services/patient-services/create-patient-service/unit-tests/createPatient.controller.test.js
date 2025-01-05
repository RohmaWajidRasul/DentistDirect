import { vi, describe, it, expect, afterEach } from 'vitest';
import { createPatient } from '../createPatient.controller.js';
import Patient from '../../models/patient.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import * as bcrypt from 'bcrypt';

vi.mock('../../models/patient.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
  },
}));
vi.mock('bcrypt', () => ({
    default: {
      hash: vi.fn(),
    },
}));
  
describe('createPatient', () => {
  const validTopic = 'request/patients/create';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: {
      firstName: 'John',
      lastName: 'Doe',
      SSN: '2001011234',
      email: 'john.doe@example.com',
      password: 'password123',
      phoneNumber: '1234567890',
    },
  });

  afterEach(() => {
    vi.clearAllMocks(); // Clear all mocks after each test
  });

  it('should return early for invalid topic', async () => {
    const invalidTopic = 'invalid/topic';

    await createPatient(invalidTopic, validMessage);

    expect(mqttClient.publish).not.toHaveBeenCalled();
    expect(Patient.find).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON format in the message', async () => {
    const invalidMessage = 'Invalid JSON';

    await createPatient(validTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Invalid JSON format in request'),
      expect.any(Function)
    );
  });

  it('should handle missing required fields', async () => {
    const messageWithMissingFields = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        SSN: '2001011234',
        email: 'john.doe@example.com',
      },
    });

    await createPatient(validTopic, messageWithMissingFields);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('All fields are required'),
      expect.any(Function)
    );
  });

  it('should validate phone number length', async () => {
    const messageWithInvalidPhone = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        SSN: '2001011234',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234',
      },
    });

    await createPatient(validTopic, messageWithInvalidPhone);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Phone number should be between 10 and 15 characters'),
      expect.any(Function)
    );
  });

  it('should validate password length', async () => {
    const messageWithShortPassword = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        SSN: '2001011234',
        email: 'john.doe@example.com',
        password: '123',
        phoneNumber: '1234567890',
      },
    });

    await createPatient(validTopic, messageWithShortPassword);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Password must be at least 8 characters long'),
      expect.any(Function)
    );
  });

  it('should validate SSN format', async () => {
    const messageWithInvalidSSN = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        SSN: '123',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
      },
    });

    await createPatient(validTopic, messageWithInvalidSSN);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('SSN must be in YYMMDDXXXX format or YYYYMMDDXXXX format'),
      expect.any(Function)
    );
  });

  it('should handle existing patient registration', async () => {
    Patient.findOne.mockResolvedValue({ SSN: '2001011234' }); // Mock existing patient

    await createPatient(validTopic, validMessage);

    expect(Patient.findOne).toHaveBeenCalledWith({ SSN: '2001011234' });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Patient already registered'),
      expect.any(Function)
    );
  });

  it('should handle successful patient creation', async () => {
    // Mock dependencies
    Patient.findOne.mockResolvedValue(null); // No existing patient
    bcrypt.default.hash.mockResolvedValue('hashed_password'); // Simulate password hashing
    console.log(bcrypt.default.hash); 
    Patient.prototype.save = vi.fn().mockResolvedValue(); // Mock save method

    // Call the function
    await createPatient(validTopic, validMessage);

    // Assert that bcrypt.hash is called with the correct arguments
    expect(bcrypt.default.hash).toHaveBeenCalledWith('password123', 10);

    // Assert that the new patient is saved and MQTT publish is called
    expect(Patient.prototype.save).toHaveBeenCalled();
    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Patient created successfully'),
      expect.any(Function)
    );
  });

  it('should handle errors during execution', async () => {
    Patient.findOne.mockRejectedValue(new Error('Database error')); // Simulate a database error

    await createPatient(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      expect.stringContaining('response/patients/created'),
      expect.stringContaining('Error creating patient'),
      expect.any(Function)
    );
  });
});
