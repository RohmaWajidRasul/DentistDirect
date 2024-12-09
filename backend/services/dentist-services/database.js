import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { checkDBHealth } from '../../shared/checkDBHealth.js';
import { syncDatabases, backupDatabase } from '../../shared/syncUtils.js'; // Utility functions for sync and backup

dotenv.config();

const primaryURI = process.env.MONGODB_PRIMARY_URI || 'mongodb://localhost:27017/dentists';
const fallbackURI = process.env.MONGODB_FALLBACK_URI || 'mongodb://localhost:27017/dentists_fallback';

const MAX_RETRIES = 5; // Maximum retry attempts
const RETRY_DELAY = 5000; // Delay between retries in milliseconds

const SYNC_INTERVAL = 5 * 60 * 1000; // Sync every 5 minutes
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // Backup every 24 hours

async function connectDB() {
    let retryCount = 0;

    while (retryCount < MAX_RETRIES) {
        const primaryHealth = await checkDBHealth(primaryURI);
        const selectedURI = primaryHealth.status === 'healthy' ? primaryURI : fallbackURI;

        try {
            console.log(`Attempting to connect to MongoDB: ${selectedURI}`);
            await mongoose.connect(selectedURI);
            console.log(`Connected to MongoDB with URI: ${selectedURI}`);
            // Start periodic synchronization and backup
            if (selectedURI === primaryURI) {
                console.log("Primary database connected. Starting sync and backup...");
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
    console.log("startSyncAndBackup function called.");
    let syncIntervalId = null;
    let backupIntervalId = null;

    // Clear existing intervals to prevent duplicates
    if (syncIntervalId) {
        console.log("Clearing existing sync interval...");
        clearInterval(syncIntervalId);
    }
    if (backupIntervalId) {
        console.log("Clearing existing backup interval...");
        clearInterval(backupIntervalId);
    }

    // Set interval for synchronization
    syncIntervalId = setInterval(async () => {
        console.log('Starting database synchronization...');
        try {
            await syncDatabases(primaryURI, fallbackURI);
            console.log('Database synchronization completed successfully.');
        } catch (err) {
            console.error('Error during database synchronization:', err.message);
        }
    }, SYNC_INTERVAL);

    // Set interval for backup
    backupIntervalId = setInterval(async () => {
        console.log('Starting database backup...');
        try {
            await backupDatabase(primaryURI, '../backups/dentists_backup.json');
            console.log('Database backup completed successfully.');
        } catch (err) {
            console.error('Error during database backup:', err.message);
        }
    }, BACKUP_INTERVAL);
}

export default connectDB;
