import mongoose from 'mongoose';
var Schema = mongoose.Schema;


const messageSchema = new Schema({
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

});

const Message = mongoose.model('Message', messageSchema);
export default Message;
