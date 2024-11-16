import mongoose from 'mongoose';
var Schema = mongoose.Schema;

const slotSchema = new Schema({
    dentistId: { 
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
    date: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        default: 'available' 
    }
});

var Slot = mongoose.model('Slot', slotSchema);
export default Slot;
