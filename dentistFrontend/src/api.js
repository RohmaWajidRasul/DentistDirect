import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5007/v1",
  timeout: 5000,
});

export const getBookedAppointmentsForDentist = async (dentistId) => {
  try {
    const response = await api.get(`/appointments/booked/${dentistId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching booked appointments:", error);
    throw error;
  }
};

export const createAppointment = async (appointmentData) => {
  try {
    const response = await api.post("/appointments", appointmentData);
    return response.data;
  } catch (error) {
    console.error("Error creating appointment:", error);
    throw error;
  }
};

export const loginDentist = async (credentials) => {
  try {
    console.log(credentials); //debugging
    const response = await api.post("/dentists/login", credentials);
    return response.data;
  } catch (error) {
    console.error("Error logging in dentist:", error);
    throw error;
  }
};

export const registerDentist = async (dentistData) => {
  try {
    const response = await api.post("/dentists/register", dentistData);
    return response.data;
  } catch (error) {
    console.error("Error during dentist registration:", error);
    throw error;
  }
};

export default api;
