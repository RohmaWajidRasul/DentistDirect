import mqttClient from '../../shared/mqtt-client.js';
import Appointment from '../../models/appointment.js';



export const cancelAppointment = async (req, res) =>{
    try {
        const { appointmentId } = req.body; 

        const appointment = await Appointment.findById(appointmentId)

        if(!appoinmentId){
            return res.status(404).json({message: 'Appointment not found'}); 
        }

        if(appointment.status === 'canceled'){
            return res.status(400).json({message: 'Appointment is already cancelled '}); 
        }

        appointment.status = 'canceled'; 
        await appointment.save(); 


        mqttClient.publish('booking/updates', JSON.stringify({
            appointmentId: appointmentId, 
            status: 'canceled', 
            dentistID: appointment.dentistID, 
            patientID: appointment.patientID, 
            slotId: appointment.slotId,
        })); 
    } catch (error){
        res.status(500).json({message: 'Error cancelling appointment', error}); 
    }
}