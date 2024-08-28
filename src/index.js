const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Placeholder para futuras rotas
app.get('/', (req, res) => {
    res.send('API File Listing');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
