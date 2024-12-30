/* global jest, describe, beforeEach, it, expect */

import { manageAppointment } from '../appointmentManagement.controller.js';
import Appointment from '../../models/appointment.js';
import mqttClient from '../../../../shared/mqtt-client.js';

// Mock Appointment model and mqttClient
jest.mock('../../models/appointment.js');
jest.mock('../../../../shared/mqtt-client.js', () => ({
    publish: jest.fn(),
}));

describe('manageAppointment', () => {
    const validTopic = 'request/appointments/manage/book';
    const validMessage = JSON.stringify({
        correlationId: '1234',
        payload: { appointmentId: 'abcd', patientId: '5678' },
    });

    beforeEach(() => {
        jest.clearAllMocks(); // Reset mocks before each test
    });

    it('should publish an error response if the action is invalid', async () => {
        const invalidTopic = 'request/appointments/manage/invalid';
        await manageAppointment(invalidTopic, validMessage);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/error'),
            expect.stringContaining('Invalid action in topic')
        );
    });

    it('should publish an error response for invalid JSON message', async () => {
        const invalidMessage = 'Invalid JSON';
        await manageAppointment(validTopic, invalidMessage);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Invalid JSON format in request')
        );
    });

    it('should publish an error response if correlationId is missing', async () => {
        const messageWithoutCorrelationId = JSON.stringify({ payload: { appointmentId: 'abcd' } });
        await manageAppointment(validTopic, messageWithoutCorrelationId);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Correlation ID is missing in the request')
        );
    });

    it('should publish an error response if appointment is not found', async () => {
        Appointment.findById.mockResolvedValue(null); // Simulate no appointment found
        await manageAppointment(validTopic, validMessage);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Appointment not found')
        );
    });

    it('should handle a "book" action successfully', async () => {
        const appointmentMock = { status: 'available', save: jest.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);

        await manageAppointment(validTopic, validMessage);

        expect(appointmentMock.status).toBe('booked');
        expect(appointmentMock.save).toHaveBeenCalled();
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/booked'),
            expect.stringContaining('Appointment booked successfully')
        );
    });

    it('should handle a "cancel" action successfully', async () => {
        const topic = 'request/appointments/manage/cancel';
        const appointmentMock = { status: 'booked', save: jest.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);

        await manageAppointment(topic, validMessage);

        expect(appointmentMock.status).toBe('canceled');
        expect(appointmentMock.save).toHaveBeenCalled();
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/canceled'),
            expect.stringContaining('Appointment canceled successfully')
        );
    });

    it('should handle a "delete" action successfully', async () => {
        const topic = 'request/appointments/manage/delete';
        const appointmentMock = { status: 'canceled', save: jest.fn() };
        Appointment.findById.mockResolvedValue(appointmentMock);

        await manageAppointment(topic, validMessage);

        expect(appointmentMock.status).toBe('deleted');
        expect(appointmentMock.save).toHaveBeenCalled();
        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.stringContaining('response/appointments/manage/deleted'),
            expect.stringContaining('Appointment deleted successfully')
        );
    });

    it('should handle errors gracefully', async () => {
        Appointment.findById.mockRejectedValue(new Error('Database error')); // Simulate database error

        await manageAppointment(validTopic, validMessage);

        expect(mqttClient.publish).toHaveBeenCalledWith(
            expect.any(String),
            expect.stringContaining('Error processing book request')
        );
    });
});
