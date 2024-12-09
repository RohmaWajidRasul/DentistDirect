import mongoose from 'mongoose';
import fs from 'fs';

/**
 * Synchronizes data between the primary and fallback databases.
 * Ensures no duplicate records and maintains data consistency.
 * @param {string} primaryURI - MongoDB URI of the primary database.
 * @param {string} fallbackURI - MongoDB URI of the fallback database.
 */
export async function syncDatabases(primaryURI, fallbackURI) {
    try {
        // Connect to both databases
        const primaryConnection = await mongoose.createConnection(primaryURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const fallbackConnection = await mongoose.createConnection(fallbackURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const primaryCollections = await primaryConnection.db.collections();
        const fallbackCollections = await fallbackConnection.db.collections();

        for (const primaryCollection of primaryCollections) {
            const collectionName = primaryCollection.collectionName;
            const primaryData = await primaryCollection.find({}).toArray();

            // Get the corresponding collection in the fallback database
            const fallbackCollection = fallbackCollections.find(
                (col) => col.collectionName === collectionName
            );

            if (fallbackCollection) {
                for (const record of primaryData) {
                    const exists = await fallbackCollection.findOne({ _id: record._id });
                    if (!exists) {
                        await fallbackCollection.insertOne(record);
                    }
                }
            }
        }

        console.log('Database synchronization complete.');
    } catch (err) {
        console.error('Error during database synchronization:', err.message);
    }
}

/**
 * Creates a backup of the database.
 * @param {string} dbURI - MongoDB URI of the database to back up.
 * @param {string} backupPath - Path to save the backup file.
 */
export async function backupDatabase(dbURI, backupPath) {
    try {
        const connection = await mongoose.createConnection(dbURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        const collections = await connection.db.collections();
        const backupData = {};

        for (const collection of collections) {
            const collectionName = collection.collectionName;
            const data = await collection.find({}).toArray();
            backupData[collectionName] = data;
        }

        fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
        console.log(`Database backup saved at ${backupPath}`);
    } catch (err) {
        console.error('Error during database backup:', err.message);
    }
}
