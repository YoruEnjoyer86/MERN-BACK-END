const express = require('express');
const database = require('./config/database');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
app.use(express.json());
app.use('/events', eventRoutes);

const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

