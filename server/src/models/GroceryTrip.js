import mongoose from 'mongoose';

const groceryItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  // Unit price — the amount for one unit of the item. Line total (what the
  // report/export math uses) is always derived as price * quantity, never
  // stored, so it can't drift out of sync with either field.
  price: { type: Number, required: true, min: 0, default: 0 },
  quantity: { type: Number, min: 0, default: 1 },
  bought: { type: Boolean, default: false },
});

const groceryTripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    items: [groceryItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model('GroceryTrip', groceryTripSchema);
