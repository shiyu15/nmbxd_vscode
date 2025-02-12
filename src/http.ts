import axios from "axios";
import Global from "./global";

const http = axios.create({
    timeout: 150000,
    baseURL: "",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:130.0) Gecko/20100101 Firefox/130.0",
    },
  });

axios.interceptors.request.use(request => {
    console.log('Starting Request', JSON.stringify({
        url: request.url,
        method: request.method,
        headers: request.headers,
        data: request.data
    }, null, 2));
    return request;
});

export default http;
