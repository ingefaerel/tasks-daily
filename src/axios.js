import axios from "axios";

const api = axios.create({
  baseURL: "http://10.147.19.42:5000", // Your backend URL
});

export default api;
