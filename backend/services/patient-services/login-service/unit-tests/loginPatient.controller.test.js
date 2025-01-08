import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import { loginPatient } from '../loginPatient.controller.js';
import Patient from '../../models/patient.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import bcrypt from 'bcrypt';

// Mock dependencies
vi.mock('../../models/patient.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
  },
}));
vi.mock('bcrypt', () => ({
  compare: vi.fn(),
}));

describe('loginPatient', () => {
  const loginTopic = 'request/patient-login';
  const validMessage = JSON.stringify({
    correlationId: '12345',
    payload: {
      email: 'test@example.com',
      password: 'password123',
    },
  });

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore mocks after each test
  });

  it('should return early for invalid topic', async () => {
    const invalidTopic = 'invalid/topic';

    await loginPatient(invalidTopic, validMessage);

    expect(mqttClient.publish).not.toHaveBeenCalled();
    expect(Patient.findOne).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON format in the message', async () => {
    const invalidMessage = 'Invalid JSON';

    await loginPatient(loginTopic, invalidMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/undefined',
      JSON.stringify({
        correlationId: undefined,
        status: 'error',
        message: 'Invalid JSON format in request',
        error: expect.any(Object),
      }),
      expect.any(Function)
    );
  });

  it('should handle missing email or password', async () => {
    const messageWithoutEmail = JSON.stringify({
      correlationId: '12345',
      payload: { password: 'password123' },
    });

    await loginPatient(loginTopic, messageWithoutEmail);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Email and password are required',
      }),
      expect.any(Function)
    );
  });

  it('should handle invalid email or password', async () => {
    Patient.findOne.mockResolvedValue(null); // Simulate no patient found

    await loginPatient(loginTopic, validMessage);

    expect(Patient.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Invalid email or password',
      }),
      expect.any(Function)
    );
  });

  it('should handle invalid password', async () => {
    const mockPatient = { password: 'hashed_password' };
    Patient.findOne.mockResolvedValue(mockPatient); // Simulate patient found
    bcrypt.compare.mockResolvedValue(false); // Simulate password mismatch

    await loginPatient(loginTopic, validMessage);

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Invalid email or password',
      }),
      expect.any(Function)
    );
  });

  it('should handle successful login', async () => {
    const mockPatient = {
      email: 'test@example.com',
      password: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
    };
    Patient.findOne.mockResolvedValue(mockPatient); // Simulate patient found
    bcrypt.compare.mockResolvedValue(true); // Simulate valid password

    await loginPatient(loginTopic, validMessage);

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'success',
        message: 'Login successful',
        patient: mockPatient,
      }),
      expect.any(Function)
    );
  });

  it('should handle errors during execution', async () => {
    Patient.findOne.mockRejectedValue(new Error('Database error')); // Simulate database error

    await loginPatient(loginTopic, validMessage);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/patient-login/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Error during login',
        error: 'Database error',
      }),
      expect.any(Function)
    );
  });
});
