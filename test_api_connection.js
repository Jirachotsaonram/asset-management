
import axios from 'axios';

const API_URL = 'http://10.88.226.98/asset-management/asset_management_api/login';

console.log(`Testing connection to: ${API_URL}`);

try {
    const response = await axios.post(API_URL, {
        username: 'test',
        password: 'password'
    });
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
} catch (error) {
    if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Server responded with error status:', error.response.status);
        console.log('Data:', error.response.data);
    } else if (error.request) {
        // The request was made but no response was received
        console.log('No response received (Network Error)');
        console.error(error.message);
    } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error setting up request:', error.message);
    }
}
