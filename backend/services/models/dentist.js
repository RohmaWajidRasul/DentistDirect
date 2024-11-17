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
    availableSlotsId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slot',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Dentist = mongoose.model('Dentist', dentistSchema);
export default Dentist;
