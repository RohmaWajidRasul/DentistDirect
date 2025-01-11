import mongoose from 'mongoose';
var Schema = mongoose.Schema;


const patientSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    SSN : {
        type: String, 
        required: true, 
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    preferences: {
        type: {
            dateRange: {
                startDate: { type: Date, default: null },
                endDate: { type: Date, default: null }
            },
            dentist: {
                type: Schema.Types.ObjectId,
                ref: 'Dentist',
                default: null
            },
            specialization: {
                type: String,
                default: ''
            },
            clinic: {
                type: Schema.Types.ObjectId,
                ref: 'Clinic',
                default: null
            }
        },
        default: {}
    },
    notifications:[{
        type: Schema.Types.ObjectId,
        ref: "Notification"
    }]
});

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
