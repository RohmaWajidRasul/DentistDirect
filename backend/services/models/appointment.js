import mongoose from 'mongoose';
var Schema = mongoose.Schema;

const appointmentSchema = new Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Patient',
        required: true,
    },
    dentistId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dentist',
        required: true,
    },
    slotId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
        required: true,
    },
    status: {
        type: String,
        enum: ['scheduled', 'completed', 'canceled'],  //will need to add functionality of how these will change
        default: 'scheduled',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
