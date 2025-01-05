import mongoose from 'mongoose';
var Schema = mongoose.Schema; 

const clinicSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  longitude: {
    type: Number,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Clinic = mongoose.model('Clinic', clinicSchema);
export default Clinic; 