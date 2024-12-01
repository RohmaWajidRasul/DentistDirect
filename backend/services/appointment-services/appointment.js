import mongoose from 'mongoose';
var Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    
    dentistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dentist',
        required: true,
    },
    date: { 
        type: String, 
        required: true 
    },
    startTime: { 
        type: String, 
        required: true 
    }, 
    endTime: { 
        type: String, 
        required: true 
    }, 
    duration: { 
        type: Number, 
        required: true 
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'canceled', 'deleted'],
        default: 'available',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        default: null,
    }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
