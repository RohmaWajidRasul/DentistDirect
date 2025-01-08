import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { exec } from 'child_process';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const createContainer = async () => {

    try {
        const localConfigPath = path.resolve(__dirname, './mosquitto/config');

        const broker = spawn("docker", [
            "run", 
            "-it", 
            "-d", 
            "--name", "Broker", 
            "-p", `${process.env.BACKEND_PORT}:1883`, 
            "-p", `${process.env.FRONTEND_PORT}:8080`, 
            "-v", `${localConfigPath}:/mosquitto/config`,
            "eclipse-mosquitto"
          ]);

    broker.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      
      broker.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });

      broker.on('close', (code) => {
        console.log(`Child process exited with code ${code}`);
        if (code !== 0) {
          console.error('There was an error starting the container.');
        } else {
          console.log('Docker container started successfully.');
        }
      });
      

    } catch(err) {
        console.log(err)
    }

}


const stopContainer = async () => {
  try {
    exec('docker rm --force Broker', (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${err.message}`);
        return;
      }
      if (stderr) {
        console.error(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.log('Docker container removed successfully.');
    });
  } catch (err) {
    console.error('Error:', err);
  }
};

export const spawnBroker = async () => {

  stopContainer()

  setTimeout(createContainer, 2000);

}

//spawnBroker();
