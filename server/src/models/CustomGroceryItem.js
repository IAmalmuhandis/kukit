import mongoose from 'mongoose';

// Items a user has added that weren't in the built-in catalog ("+ Add as
// new item" in the grocery item picker). Persisted per-user so it shows up
// in search from then on — the whole point being one canonical spelling to
// pick, instead of free-typing a new variant of the same item each time.
const customGroceryItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, default: 'Other' },
  },
  { timestamps: true }
);

customGroceryItemSchema.index({ user: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('CustomGroceryItem', customGroceryItemSchema);
