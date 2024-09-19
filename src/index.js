const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
app.use(cors());
connectDB();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('API File Listing');
});
app.use('/api/auth', require('./routes/auth'));
app.use('/api/files', require('./routes/files'));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;