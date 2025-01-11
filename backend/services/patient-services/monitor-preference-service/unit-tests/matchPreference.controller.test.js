import { describe, it, expect, vi, beforeEach } from 'vitest';
import { matchPreference, fetchDentistSpecialization } from '../matchPreference.controller.js';
import mqttClient from '../../../../shared/mqtt-client.js';
import Patient from '../../models/patient.js';


// Mock the mqttClient and Patient
vi.mock('../../models/patient.js', () => ({
   default: {
     find: vi.fn(),
   },
 }));
  vi.mock('../../../../shared/mqtt-client.js', () => ({
   default: {
     publish: vi.fn(),
   },
 }));


 vi.mock('../matchPreference.controller.js', async (importOriginal) => {
   const originalModule = await importOriginal();
   return{
       ...originalModule,
       fetchDentistSpecialization: vi.fn().mockResolvedValue('orthodontics'),
       matchPreference: vi.fn(),
       sendMatchNotification: vi.fn(),
       sendConflictNotification: vi.fn(),
   },
});

describe('matchPreferences', () => {
   const mockTopic = request/dentist-info;
   const mockAppointment = {
       date: '2025-01-20',
       dentistId: 'dentist1',
       clinicId: 'clinic1',
       status: 'available',
       patientId: 'patient1',
     };


   beforeEach(() => {
       vi.restoreAllMocks(); // Reset mocks before each test
   });
    
   afterEach(() => {
       vi.clearAllMocks(); // Clear any stored mock after each test
   });

})
