const express = require('express');
require('dotenv').config()

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const app = express();

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}...`);
})