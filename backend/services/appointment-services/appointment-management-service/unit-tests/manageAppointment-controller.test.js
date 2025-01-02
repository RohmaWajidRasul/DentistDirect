import { vi, describe, it, expect, afterAll, beforeEach } from 'vitest';

import { manageAppointment } from '../manageAppointment.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock Appointment model and mqttClient
vi.mock('../../models/appointment.js');
vi.mock('../../../../shared/mqtt-client.js', () => ({
    default: {
        publish: vi.fn(),
        subscribe: vi.fn(),
        on: vi.fn(),
        once: vi.fn(),
        unsubscribe: vi.fn(),
        end: vi.fn(),
    }
}));

describe('manageAppointment', () => {
    const validTopic = 'request/appointments/manage/book';
    const validMessage = JSON.stringify({
        correlationId: '1234',
        payload: { appointmentId: 'abcd', patientId: '5678' },
    });

    beforeEach(() => {
        vi.clearAllMocks(); // Reset mocks before each test
    });

    it('should log an error if the action is invalid', async () => {
        const invalidTopic = 'request/appointments/manage/invalid';

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await manageAppointment(invalidTopic, validMessage);

        expect(mqttClient.publish).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid action in topic'));

        consoleErrorSpy.mockRestore(); // Restore the original console.error
    });

    it('should publish an error response for invalid JSON message', async () => {
        const invalidMessage = 'Invalid JSON';
    
        await manageAppointment(validTopic, invalidMessage);
    
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/booked/undefined'),
            expect.stringContaining('Invalid JSON format in request'),
            expect.any(Function)
        );
    });
    
    it('should publish an error response if appointment is not found', async () => {
        Appointment.findById.mockResolvedValue(null); // Simulate no appointment found
    
        await manageAppointment(validTopic, validMessage);
    
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/booked/1234'), // Match the structured topic
            JSON.stringify({
                correlationId: '1234',
                status: 'error',
                message: 'Appointment not found',
            }), // Match the full response JSON structure
            expect.any(Function) // Ensure the callback argument is present
        );
    });
    

    it('should handle a "book" action successfully', async () => {
        const appointmentMock = { status: 'available', save: vi.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);
    
        await manageAppointment(validTopic, validMessage);
    
        // Verify the appointment status was updated
        expect(appointmentMock.status).toBe('booked');
        expect(appointmentMock.patientId).toBe('5678');
        expect(appointmentMock.save).toHaveBeenCalled();
    
        // Verify MQTT publish call
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/booked/1234'), // Match the specific topic format
            JSON.stringify({
                correlationId: '1234',
                status: 'success',
                message: 'Appointment booked successfully',
                appointment: {
                    status: 'booked',
                    patientId: '5678',
                },
            }), // Match the full JSON structure
            expect.any(Function) // Ensure the callback is accounted for
        );
    });
    

    it('should handle a "cancel" action successfully', async () => {
        const topic = 'request/appointments/manage/cancel';
        const appointmentMock = { status: 'booked', save: vi.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);
    
        await manageAppointment(topic, validMessage);
    
        // Verify the appointment status was updated
        expect(appointmentMock.status).toBe('canceled');
        expect(appointmentMock.save).toHaveBeenCalled();
    
        // Verify MQTT publish call
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/canceled/1234'), // Match specific topic structure
            JSON.stringify({
                correlationId: '1234',
                status: 'success',
                message: 'Appointment canceled successfully',
                appointment: {
                    status: 'canceled',
                },
            }), // Match the full JSON structure
            expect.any(Function) // Ensure the callback is accounted for
        );
    });
    

    it('should handle a "delete" action successfully', async () => {
        const topic = 'request/appointments/manage/delete';
        const appointmentMock = { status: 'canceled', save: vi.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);
    
        await manageAppointment(topic, validMessage);
    
        // Verify the appointment status was updated
        expect(appointmentMock.status).toBe('deleted');
        expect(appointmentMock.save).toHaveBeenCalled();
    
        // Verify MQTT publish call
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/deleted/1234'), // Match specific topic structure
            JSON.stringify({
                correlationId: '1234',
                status: 'success',
                message: 'Appointment deleteed successfully',
                appointment: {
                    status: 'deleted',
                },
            }), // Match the full JSON structure
            expect.any(Function) // Ensure the callback is accounted for
        );
    });    

    it('should handle errors gracefully', async () => {
        Appointment.findById.mockRejectedValue(new Error('Database error')); // Simulate database error

        await manageAppointment(validTopic, validMessage);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/booked/1234'), // Match the topic structure
            expect.stringContaining(JSON.stringify({
                correlationId: '1234',
                status: 'error',
                message: 'Error processing book request',
                error: 'Database error',
            })),
            expect.any(Function) // Callback argument
        );
    });
});

// Add cleanup logic after all tests
afterAll(() => {
    mqttClient.unsubscribe(); // Unsubscribe from all topics
    mqttClient.end(); // Close the MQTT connection
    vi.clearAllTimers();
    vi.clearAllMocks();
});
