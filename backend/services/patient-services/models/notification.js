import mongoose from 'mongoose';
var Schema = mongoose.Schema;


const notificationSchema = new Schema({
    body: {
        type: String,
        required: true,
    },
    subject: {
        type: String,
    },
    status: {
        type: String,
        enum: ['read', 'unread'],
        default: 'unread',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }

});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
