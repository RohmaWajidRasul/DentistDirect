import mongoose from 'mongoose';
var Schema = mongoose.Schema;

const dentistSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
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
    specialization: {
        type: String,
        required: true,
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Dentist = mongoose.model('Dentist', dentistSchema);
export default Dentist;
