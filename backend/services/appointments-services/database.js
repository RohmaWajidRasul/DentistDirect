import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/appointments';

async function connectDB() {
    try {
        await mongoose.connect(mongoURI);
        console.log(`Connected to MongoDB with URI: ${mongoURI}`);
    } catch (err) {
        console.error(`Failed to connect to MongoDB with URI: ${mongoURI}`);
        console.error(err.stack);
        process.exit(1);
    }
}

export default connectDB;
