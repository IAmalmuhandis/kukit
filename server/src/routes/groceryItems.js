import { Router } from 'express';
import CustomGroceryItem from '../models/CustomGroceryItem.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const items = await CustomGroceryItem.find({ user: req.userId }).sort({ createdAt: 1 });
    res.json({ items });
  })
);

// Upsert (case-insensitively) rather than plain create — the picker calls
// this from "+ Add '<query>' as new item", and if the user already added
// that item on a previous trip this just hands back the existing one
// instead of erroring or creating a near-duplicate entry.
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, category } = req.body ?? {};
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }
    const trimmed = name.trim();
    const item = await CustomGroceryItem.findOneAndUpdate(
      { user: req.userId, name: trimmed },
      { $setOnInsert: { user: req.userId, name: trimmed, category: (category && String(category).trim()) || 'Other' } },
      { new: true, upsert: true, collation: { locale: 'en', strength: 2 } }
    );
    res.status(201).json({ item });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await CustomGroceryItem.deleteOne({ _id: req.params.id, user: req.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.status(204).end();
  })
);

export default router;
