import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { registerDentist } from '../registerDentist.controller.js';
import Dentist from '../../models/dentist.js';
import bcrypt from 'bcrypt';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock dependencies
vi.mock('../../models/dentist.js');
vi.mock('bcrypt');
vi.mock('../../../../shared/mqtt-client.js', () => ({
  default: {
    publish: vi.fn(),
    subscribe: vi.fn(),
  },
}));

describe('registerDentist', () => {
  const dentistTopic = 'request/register-dentist';

  beforeEach(() => {
    vi.clearAllMocks(); // Reset mocks before each test
  });

  afterEach(() => {
    vi.restoreAllMocks(); // Restore original implementations after each test
  });

  it('should ignore requests with an invalid topic', async () => {
    const invalidTopic = 'invalid/topic';
    const message = JSON.stringify({});

    await registerDentist(invalidTopic, message);

    expect(mqttClient.publish).not.toHaveBeenCalled();
    expect(Dentist.findOne).not.toHaveBeenCalled();
  });

  it('should handle invalid JSON format in the message', async () => {
    const message = 'Invalid JSON';

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/register-dentist/undefined',
      JSON.stringify({
        correlationId: undefined,
        status: 'error',
        message: 'Invalid JSON format in request',
        error: {}, // Updated to match the actual structure
      }),
      expect.any(Function)
    );
  });

  it('should handle missing correlationId', async () => {
    const message = JSON.stringify({ payload: {} });

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).not.toHaveBeenCalled();
  });

  it('should return an error if any required field is missing', async () => {
    const message = JSON.stringify({
      correlationId: '12345',
      payload: { firstName: 'John', lastName: 'Doe' }, // Missing fields
    });

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/register-dentist/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'All fields are required',
      }),
      expect.any(Function)
    );
  });

  it('should return an error for an invalid phone number', async () => {
    const message = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '123', // Invalid phone number
        specialization: 'Orthodontics',
        clinicId: 'clinic123',
      },
    });

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/register-dentist/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Phone number should be between 10 and 15 characters.',
      }),
      expect.any(Function)
    );
  });

  it('should return an error for a short password', async () => {
    const message = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: '12345', // Short password
        phoneNumber: '1234567890',
        specialization: 'Orthodontics',
        clinicId: 'clinic123',
      },
    });

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/register-dentist/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Password must be at least 8 characters long.',
      }),
      expect.any(Function)
    );
  });

  it('should return an error if the email is already in use', async () => {
    Dentist.findOne.mockResolvedValue({ email: 'john.doe@example.com' }); // Simulate existing dentist
    const message = JSON.stringify({
      correlationId: '12345',
      payload: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        phoneNumber: '1234567890',
        specialization: 'Orthodontics',
        clinicId: 'clinic123',
      },
    });

    await registerDentist(dentistTopic, message);

    expect(mqttClient.publish).toHaveBeenCalledWith(
      'response/register-dentist/12345',
      JSON.stringify({
        correlationId: '12345',
        status: 'error',
        message: 'Email already in use.',
      }),
      expect.any(Function)
    );
  });

  it('should register a dentist successfully', async () => {
    Dentist.findOne.mockResolvedValue(null); // No existing dentist
    bcrypt.hash.mockResolvedValue('hashedPassword'); // Mock password hashing
    Dentist.prototype.save = vi.fn().mockResolvedValue();

    const message = JSON.stringify({
        correlationId: '12345',
        payload: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
            phoneNumber: '1234567890',
            specialization: 'Orthodontics',
            clinicId: 'clinic123',
        },
    });

    await registerDentist(dentistTopic, message);

    expect(Dentist.findOne).toHaveBeenCalledWith({ email: 'john.doe@example.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(Dentist.prototype.save).toHaveBeenCalled();
    expect(mqttClient.publish).toHaveBeenCalledWith(
        'response/register-dentist/12345',
        JSON.stringify({
            correlationId: '12345',
            status: 'success',
            message: 'Dentist registered successfully',
        }),
        expect.any(Function)
    );
  });
});
