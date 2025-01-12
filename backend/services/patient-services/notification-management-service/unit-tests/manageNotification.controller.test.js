import { describe, it, vi, expect, beforeEach, afterEach } from 'vitest';
import { changeMessage } from '../manageNotification.controller.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import Notification from '../../models/notification.js';


vi.mock('../../models/notification.js', () => ({
 default: {
   findById: vi.fn(),
 },
}));


vi.mock('../../../../shared/mqtt-client.js', () => ({
 default: {
   publish: vi.fn(),
 },
}));


describe('changeMessage', () => {
 const mockTopic = 'request/change-message';
 const mockCorrelationId = '1234';
 const mockNotificationId = 'notifid1';
 const mockNotification = {
   _id: mockNotificationId,
   status: 'unread',
   save: vi.fn().mockResolvedValue(),
 };


 beforeEach(() => {
   vi.restoreAllMocks(); // Reset mocks before each test
 });


 afterEach(() => {
   vi.clearAllMocks(); // Clear mock data after each test
 });


 it('should handle invalid JSON messages', async () => {
   const invalidMessage = 'not-json';


   await changeMessage(mockTopic, invalidMessage);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/notification-management/'),
     expect.stringContaining('Invalid JSON format in request'),
     expect.any(Function)
   );
 });


 it('should handle missing correlation ID in the message', async () => {
   const messageWithoutCorrelationId = JSON.stringify({
     payload: {
       notificationId: mockNotificationId,
       status: 'read'
     },
   });


   await changeMessage(mockTopic, messageWithoutCorrelationId);


   expect(mqttClient.publish).toHaveBeenCalledWith(
     expect.stringContaining('response/notification-management/'),
     expect.stringContaining('Correlation ID is missing in the request'),
     expect.any(Function)
   );
 });


 it('should handle missing notification ID', async () => {
   const mockMessage = JSON.stringify({
     correlationId: mockCorrelationId,
     payload: { status: 'read' },
   });


   Notification.findById.mockResolvedValue(null);


   await changeMessage(mockTopic, mockMessage);


   expect(Notification.findById).toHaveBeenCalledWith(undefined);
   expect(mqttClient.publish).toHaveBeenCalledWith(
     `response/notification-management/${mockCorrelationId}`,
     expect.stringContaining('No notification found for the provided ID'),
     expect.any(Function)
   );
 });


 it('should handle valid messages and update the notification status', async () => {
   const mockMessage = JSON.stringify({
     correlationId: mockCorrelationId,
     payload: {
       notificationId: mockNotificationId,
       status: 'read'
     },
   });


   Notification.findById.mockResolvedValue(mockNotification);


   await changeMessage(mockTopic, mockMessage);


   expect(Notification.findById).toHaveBeenCalledWith(mockNotificationId);
   expect(mockNotification.status).toBe('read');
   expect(mockNotification.save).toHaveBeenCalled();
   expect(mqttClient.publish).toHaveBeenCalledWith(
     `response/notification-management/${mockCorrelationId}`,
     expect.stringContaining('Notification managed successfully'),
     expect.any(Function)
   );
 });


 it('should handle database errors', async () => {
   const mockMessage = JSON.stringify({
     correlationId: mockCorrelationId,
     payload: {
       notificationId: mockNotificationId,
       status: 'read'
     },
   });


   Notification.findById.mockRejectedValue(new Error('Database error'));


   await changeMessage(mockTopic, mockMessage);


   expect(Notification.findById).toHaveBeenCalledWith(mockNotificationId);
   expect(mqttClient.publish).toHaveBeenCalledWith(
     `response/notification-management/${mockCorrelationId}`,
     expect.stringContaining('Error managing notification'),
     expect.any(Function)
   );
 });
});
