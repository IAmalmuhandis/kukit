import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

// Grocery items a user has added that aren't in the built-in catalog —
// "+ Add as new item" in the picker. Persisted per-account so the same
// canonical spelling comes back up in search on the next trip, which is
// what keeps frequency/price-history reports matching an item to itself.

function mapItem(it) {
  return { id: it._id, name: it.name, category: it.category || 'Other', custom: true };
}

export function useCustomGroceryItems() {
  const [customItems, setCustomItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/grocery-items')
      .then(({ items }) => {
        if (!cancelled) setCustomItems(items.map(mapItem));
      })
      .catch((err) => console.error('Failed to load custom grocery items:', err));
    return () => {
      cancelled = true;
    };
  }, []);

  const addCustomItem = useCallback(async (name) => {
    const { item } = await api.post('/grocery-items', { name });
    const mapped = mapItem(item);
    setCustomItems((prev) => (prev.some((i) => i.id === mapped.id) ? prev : [...prev, mapped]));
    return mapped;
  }, []);

  const removeCustomItem = useCallback((id) => {
    setCustomItems((prev) => prev.filter((i) => i.id !== id));
    api.delete(`/grocery-items/${id}`).catch((err) => console.error('Failed to remove custom grocery item:', err));
  }, []);

  return { customItems, addCustomItem, removeCustomItem };
}
