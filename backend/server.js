require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
var mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/group-5';
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

mongoose
  .connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error(err));

app.get('/', (req, res) => res.send('Backend running'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
