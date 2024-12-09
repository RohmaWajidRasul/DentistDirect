import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { checkDBHealth } from '../../shared/checkDBHealth.js';
import cron from 'node-cron'; // Use for periodic tasks
import { syncDatabases, backupDatabase } from '../../shared/syncUtils.js';

dotenv.config();

const primaryURI = process.env.MONGODB_PRIMARY_URI || 'mongodb://localhost:27017/appointments';
const fallbackURI = process.env.MONGODB_FALLBACK_URI || 'mongodb://localhost:27018/appointments';

const MAX_RETRIES = 5; // Maximum retry attempts
const RETRY_DELAY = 5000; // Delay between retries in milliseconds

async function connectDB() {
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        const primaryHealth = await checkDBHealth(primaryURI);
        const selectedURI = primaryHealth.status === 'healthy' ? primaryURI : fallbackURI;

        try {
            console.log(`Attempting to connect to MongoDB: ${selectedURI}`);
            await mongoose.connect(selectedURI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log(`Connected to MongoDB with URI: ${selectedURI}`);
            // Start periodic synchronization and backup
            if (selectedURI === primaryURI) {
                startSyncAndBackup();
            }
            return; // Exit the function once connected
        } catch (err) {
            console.error(`Failed to connect to MongoDB with URI: ${selectedURI}`);
            console.error(err.message);

            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying connection... (${retryCount}/${MAX_RETRIES})`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY)); // Wait before retrying
            } else {
                console.error(`Max retries reached. Could not connect to any database.`);
                process.exit(1); // Exit the process after max retries
            }
        }
    }
}

function startSyncAndBackup() {
    // Sync every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        console.log('Starting database synchronization...');
        await syncDatabases(primaryURI, fallbackURI);
    });

    // Backup every day at midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Starting database backup...');
        await backupDatabase(primaryURI, '../backups/dentists_backup.json');
    });
}

export default connectDB;
