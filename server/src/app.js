import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import foodsRoutes from './routes/foods.js';
import overridesRoutes from './routes/overrides.js';
import groceriesRoutes from './routes/groceries.js';
import groceryItemsRoutes from './routes/groceryItems.js';

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || true,
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Every request from here down waits for a real, established DB connection
// before hitting a route — connectDB() is cached, so on a warm instance
// this resolves immediately. On a cold start it awaits the actual connect
// instead of letting a query buffer silently (and eventually time out with
// no useful error) against a connection that's still opening or has failed.
app.use((req, res, next) => {
  connectDB().then(() => next(), next);
});

app.use('/api/auth', authRoutes);
app.use('/api/foods', foodsRoutes);
app.use('/api/overrides', overridesRoutes);
app.use('/api/groceries', groceriesRoutes);
app.use('/api/grocery-items', groceryItemsRoutes);

// Not attached here — callers (local index.js, the Vercel function) may
// register more routes after importing `app` (e.g. static file serving),
// and error-handling middleware only works correctly as the very last
// thing registered. Each entrypoint calls `app.use(errorHandler)` itself,
// after its own setup, as the final line before listening/exporting.
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.publicMessage || 'Something went wrong' });
}

export default app;
