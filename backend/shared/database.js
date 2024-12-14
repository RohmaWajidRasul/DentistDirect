import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { checkDBHealth } from './checkDBHealth.js';
import { syncDatabases, backupDatabase } from './syncUtils.js';

dotenv.config();

const SYNC_INTERVAL = 5 * 60 * 1000; // Sync every 5 minutes
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // Backup every 24 hours

// Variables to hold interval IDs for sync and backup
let syncIntervalId = null;
let backupIntervalId = null;

async function connectDB(uri, fallbackUri, dbName) {
    const MAX_RETRIES = 5; // Maximum retry attempts
    const RETRY_DELAY = 5000; // Delay between retries in milliseconds

    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        const primaryHealth = await checkDBHealth(uri);
        const selectedURI = primaryHealth.status === 'healthy' ? uri : fallbackUri;

        try {
            console.log(`Attempting to connect to MongoDB for ${dbName}: ${selectedURI}`);
            await mongoose.connect(selectedURI);
            console.log(`Connected to MongoDB for ${dbName} with URI: ${selectedURI}`);

            // Start periodic synchronization and backup for this database
            if (selectedURI === uri) {
                startSyncAndBackup(uri, fallbackUri, dbName);
            }
            return; // Exit the function once connected
        } catch (err) {
            console.error(`Failed to connect to MongoDB for ${dbName} with URI: ${selectedURI}`);
            console.error(err.message);

            retryCount++;
            if (retryCount < MAX_RETRIES) {
                console.log(`Retrying connection for ${dbName}... (${retryCount}/${MAX_RETRIES})`);
                await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY)); // Wait before retrying
            } else {
                console.error(`Max retries reached for ${dbName}. Could not connect to any database.`);
                process.exit(1); // Exit the process after max retries
            }
        }
    }
}

function startSyncAndBackup(uri, fallbackUri, dbName) {
    console.log(`startSyncAndBackup called for ${dbName}.`);

    // Clear existing intervals to prevent duplicates
    if (syncIntervalId) {
        console.log(`Clearing existing sync interval for ${dbName}...`);
        clearInterval(syncIntervalId);
    }
    if (backupIntervalId) {
        console.log(`Clearing existing backup interval for ${dbName}...`);
        clearInterval(backupIntervalId);
    }

    // Set interval for synchronization
    syncIntervalId = setInterval(async () => {
        console.log(`Starting database synchronization for ${dbName}...`);
        try {
            await syncDatabases(uri, fallbackUri);
            console.log(`Database synchronization completed successfully for ${dbName}.`);
        } catch (err) {
            console.error(`Error during database synchronization for ${dbName}:`, err.message);
        }
    }, SYNC_INTERVAL);

    // Set interval for backup
    backupIntervalId = setInterval(async () => {
        console.log(`Starting database backup for ${dbName}...`);
        try {
            await backupDatabase(uri, `../backups/${dbName}_backup.json`);
            console.log(`Database backup completed successfully for ${dbName}.`);
        } catch (err) {
            console.error(`Error during database backup for ${dbName}:`, err.message);
        }
    }, BACKUP_INTERVAL);
}
export default connectDB;
