import mongoose from 'mongoose';
import fs from 'fs';

/**
 * Synchronizes data between the primary and fallback databases.
 * Ensures no duplicate records and maintains data consistency.
 * @param {string} primaryURI - MongoDB URI of the primary database.
 * @param {string} fallbackURI - MongoDB URI of the fallback database.
 */
export async function syncDatabases(primaryURI, fallbackURI) {
    console.log("syncDatabases called with URIs:", primaryURI, fallbackURI);
    try {
        // Connect to primary database
        const primaryConnection = await mongoose.createConnection(primaryURI).asPromise();
        console.log(`Primary database connected: ${primaryURI}`);

        // Connect to fallback database
        const fallbackConnection = await mongoose.createConnection(fallbackURI).asPromise();
        console.log(`Fallback database connected: ${fallbackURI}`);

        // Fetch collections from the primary database
        const primaryCollections = await primaryConnection.db.collections();
        if (!primaryCollections || primaryCollections.length === 0) {
            console.log("No collections found in the primary database.");
            await primaryConnection.close();
            await fallbackConnection.close();
            return;
        }

        const fallbackCollections = await fallbackConnection.db.collections();
        const fallbackCollectionNames = fallbackCollections.map(c => c.collectionName);

        console.log(`Primary collections:`, primaryCollections.map(c => c.collectionName));
        console.log(`Fallback collections:`, fallbackCollectionNames);

        // Sync collections
        for (const primaryCollection of primaryCollections) {
            const collectionName = primaryCollection.collectionName;
            console.log(`Processing collection: ${collectionName}`);

            // Create missing collection in the fallback database
            if (!fallbackCollectionNames.includes(collectionName)) {
                console.log(`Creating collection '${collectionName}' in the fallback database.`);
                await fallbackConnection.createCollection(collectionName);
            }

            const primaryData = await primaryCollection.find({}).toArray();
            const fallbackCollection = fallbackConnection.db.collection(collectionName);

            // Upsert documents into fallback database
            for (const doc of primaryData) {
                await fallbackCollection.updateOne(
                    { _id: doc._id },
                    { $set: doc },
                    { upsert: true }
                );
            }
        }

        console.log("Database synchronization completed successfully.");
        await primaryConnection.close();
        await fallbackConnection.close();
    } catch (err) {
        console.error("Error synchronizing databases:", err.message);
    }
}


/**
 * Creates a backup of the database.
 * @param {string} dbURI - MongoDB URI of the database to back up.
 * @param {string} backupPath - Path to save the backup file.
 */
export async function backupDatabase(dbURI, backupPath) {
    console.log("backupDatabase called for URI:", dbURI);
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
