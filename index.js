require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
const taskRoutes = require('./routes/tasks');
const { authenticateUser } = require('./middleware/auth');

app.use(express.json());

// Routes
app.use('/api/tasks', authenticateUser, taskRoutes);

app.get('/', (req, res) => {
    res.send('To-Do API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
