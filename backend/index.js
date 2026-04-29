const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Warning: SUPABASE_URL and SUPABASE_KEY are not set in the environment.');
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Initialize Redis Client
let redisClient;
let isRedisConnected = false;

(async () => {
  redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  });

  redisClient.on('error', (err) => console.log('Redis Client Error', err));
  
  try {
    await redisClient.connect();
    isRedisConnected = true;
    console.log('Connected to Redis');
  } catch (err) {
    console.log('Could not connect to Redis, falling back to direct DB calls', err);
  }
})();

// Cache Middleware for GET /api/journals
const cacheMiddleware = async (req, res, next) => {
  if (!isRedisConnected) return next();
  try {
    const data = await redisClient.get('journals');
    if (data) {
      console.log('Serving from cache');
      return res.json(JSON.parse(data));
    }
    next();
  } catch (err) {
    console.error('Redis GET error:', err);
    next();
  }
};

// API Routes

// GET all journals
app.get('/api/journals', cacheMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('journals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Save to cache
    if (isRedisConnected) {
      await redisClient.setEx('journals', 3600, JSON.stringify(data)); // Cache for 1 hour
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST a new journal
app.post('/api/journals', async (req, res) => {
  try {
    const { title, content } = req.body;
    const { data, error } = await supabase
      .from('journals')
      .insert([{ title, content }])
      .select();

    if (error) throw error;

    // Invalidate cache
    if (isRedisConnected) {
      await redisClient.del('journals');
    }

    res.status(201).json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT (update) a journal
app.put('/api/journals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const { data, error } = await supabase
      .from('journals')
      .update({ title, content })
      .eq('id', id)
      .select();

    if (error) throw error;

    // Invalidate cache
    if (isRedisConnected) {
      await redisClient.del('journals');
    }

    res.json(data[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a journal
app.delete('/api/journals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('journals')
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    // Invalidate cache
    if (isRedisConnected) {
      await redisClient.del('journals');
    }

    res.json({ message: 'Journal deleted successfully', data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
