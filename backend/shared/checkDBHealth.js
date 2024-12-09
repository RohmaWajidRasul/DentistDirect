import mongoose from 'mongoose';

export const checkDBHealth = async (uri) => {
    let connection;
    try {
        // Use `mongoose.createConnection` to establish a new connection instance
        connection = await mongoose.createConnection(uri).asPromise();

        // Ensure the database is accessible by running the `ping` command
        const adminDb = connection.db.admin();
        await adminDb.ping();

        console.log(`Database ${uri} is healthy`);
        await connection.close(); // Close connection after health check
        return { status: 'healthy', uri };
    } catch (err) {
        console.error(`Database ${uri} is down:`, err.message);
        if (connection) {
            await connection.close();
        }
        return { status: 'down', uri };
    }
};