import mongoose from 'mongoose';
var Schema = mongoose.Schema;


const logSchema = new Schema({
    result: {
        type: String,
        default: "failure"
    },
    serviceId: {
        type: String,
        default: null,

    },
    serviceName: {
        type: String,
        default: null,
    },
    requestTime: {
        type: Date,
        default: Date.now,
    },
    patientId: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }

});

const Log = mongoose.model('Log', logSchema);
export default Log;
