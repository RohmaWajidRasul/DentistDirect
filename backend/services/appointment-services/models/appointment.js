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

appointmentSchema.pre('save', async function (next) {
    const appointment = this;

    if (!appointment.isNew) {
        return next();
    }

    const overlappingAppointment = await mongoose.model('Appointment').findOne({
        dentistId: appointment.dentistId,
        date: appointment.date,
        $or: [
            {
                startTime: { $lte: appointment.startTime },
                endTime: { $gte: appointment.startTime },
            },
            {
                startTime: { $lte: appointment.endTime },
                endTime: { $gte: appointment.endTime },
            },
            {
                startTime: { $gte: appointment.startTime },
                endTime: { $lte: appointment.endTime },
            },
        ],
        status: { $ne: 'deleted' }, 
    });

    if (overlappingAppointment) {
        return next(new Error('This appointment overlaps with an existing appointment.'));
    }

    next();
});

appointmentSchema.index({ dentistId: 1, date: 1, startTime: 1, endTime: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
