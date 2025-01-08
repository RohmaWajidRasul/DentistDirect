import Log from '../models/logs.js';

export const deleteLogs = async () => {

    
    try {
        await Log.deleteMany({
            createdAt: { $lt: new Date(new Date() - 24 * 60 * 60 * 1000) }
          });
          
    } catch(error) {
        console.log(error)
    }
}