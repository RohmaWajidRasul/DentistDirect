import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


export const spawnBroker = () => {

    try {

        const localConfigPath = path.resolve(__dirname, './mosquitto/config');
        const id = Math.floor(Math.random() * 1000000000);


        const broker = spawn("docker", [
            "run", 
            "-it", 
            "-d", 
            "--name", id, 
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

spawnBroker();

export const runBroker = () => {

    try {
        const broker = spawn("docker", ["start", "Broker"]);

    broker.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
      });
      
      broker.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
      });
      

    } catch(err) {
        console.log(err)
    }

}


//runBroker();