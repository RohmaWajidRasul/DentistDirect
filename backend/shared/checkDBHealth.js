import mongoose from 'mongoose';

export const checkDBHealth = async (uri) => {
    try {
        const connection = await mongoose.createConnection(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        // Ping the database
        await connection.db.command({ ping: 1 });

        console.log(`Database ${uri} is healthy`);
        await connection.close(); // Close connection after health check
        return { status: 'healthy', uri };
    } catch (err) {
        console.error(`Database ${uri} is down:`, err.message);
        return { status: 'down', uri };
    }
};
