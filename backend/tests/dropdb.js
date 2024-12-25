import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const mongoURIs = {
    patients: process.env.PATIENTDB_PRIMARY_URI,
    dentists: process.env.DENTISTDB_PRIMARY_URI,
    appointments: process.env.APPOINTMENTDB_PRIMARY_URI,
    clinics:  process.env.CLINICDB_PRIMARY_URI,
};

const dropDatabase = async (uri, name) => {
    if (!uri) {
        console.error(`Missing MONGODB_URI for ${name} database.`);
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        await mongoose.connection.dropDatabase();
        console.log(`Dropped database: ${name} (${uri})`);
    } catch (err) {
        console.error(`Failed to drop ${name} database at URI: ${uri}`);
        console.error(err.stack);
    } finally {
        await mongoose.disconnect();
    }
};

const dropAllDatabases = async () => {
    console.log('Dropping all test databases...');
    for (const [name, uri] of Object.entries(mongoURIs)) {
        await dropDatabase(uri, name);
    }
    process.exit(0);
};

dropAllDatabases();
