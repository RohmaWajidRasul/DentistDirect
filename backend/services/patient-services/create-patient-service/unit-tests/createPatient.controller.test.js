import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createPatient } from '../createPatient.controller.js';
import Patient from '../../models/patient.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import * as bcrypt from 'bcrypt';

// Mock dependencies
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
  const validTopic = 'request/create-patient';
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

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocks after each test
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
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'All fields are required',
      }),
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
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Phone number should be between 10 and 15 characters.',
      }),
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
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Password must be at least 8 characters long.',
      }),
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
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'SSN must be in YYMMDDXXXX format or YYYYMMDDXXXX format',
      }),
      expect.any(Function)
    );
  });

  it('should handle existing patient registration', async () => {
    Patient.findOne.mockResolvedValue({ SSN: '2001011234' }); // Mock existing patient

    await createPatient(validTopic, validMessage);

    expect(Patient.findOne).toHaveBeenCalledWith({ SSN: '2001011234' });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Patient already registered.',
      }),
      expect.any(Function)
    );
  });

  it('should handle successful patient creation', async () => {
    // Mock dependencies
    Patient.findOne.mockResolvedValue(null); // No existing patient
    bcrypt.default.hash.mockResolvedValue('hashed_password'); // Mock password hashing
    Patient.prototype.save = vi.fn().mockResolvedValue(); // Mock save method
  
    await createPatient(validTopic, validMessage);
  
    expect(bcrypt.default.hash).toHaveBeenCalledWith('password123', 10);
    expect(Patient.prototype.save).toHaveBeenCalled();
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'success',
        message: 'Patient created successfully',
      }), // Remove the expectation of `newPatient`
      expect.any(Function)
    );
  });  

  it('should handle errors during execution', async () => {
    Patient.findOne.mockRejectedValue(new Error('Database error')); // Simulate a database error

    await createPatient(validTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/create-patient/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Error creating patient',
        error: 'Database error',
      }),
      expect.any(Function)
    );
  });
});
