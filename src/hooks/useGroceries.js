import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';

// Grocery trips: each trip is a saved shopping list (name + date + items),
// stored server-side per account. "Duplicate" copies a past trip's items
// into a new trip with everything unchecked, so a repeat shop starts from
// last time instead of a blank page.

function mapTrip(t) {
  return {
    id: t._id,
    name: t.name,
    createdAt: new Date(t.createdAt).getTime(),
    items: t.items.map((it) => ({
      id: it._id,
      name: it.name,
      price: it.price,
      quantity: it.quantity ?? 1,
      bought: it.bought,
    })),
  };
}

export function useGroceries() {
  const [trips, setTrips] = useState([]);
  const [activeTripId, setActiveTripId] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/groceries')
      .then(({ trips }) => {
        if (cancelled) return;
        const mapped = trips.map(mapTrip);
        setTrips(mapped);
        setActiveTripId(mapped[0]?.id ?? null);
      })
      .catch((err) => console.error('Failed to load grocery lists:', err))
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const createTrip = useCallback(async (name) => {
    const { trip } = await api.post('/groceries', { name });
    const mapped = mapTrip(trip);
    setTrips((prev) => [mapped, ...prev]);
    setActiveTripId(mapped.id);
    return mapped.id;
  }, []);

  const duplicateTrip = useCallback(async (tripId) => {
    const { trip } = await api.post(`/groceries/${tripId}/duplicate`);
    const mapped = mapTrip(trip);
    setTrips((prev) => [mapped, ...prev]);
    setActiveTripId(mapped.id);
  }, []);

  const deleteTrip = useCallback(
    (tripId) => {
      const next = trips.filter((t) => t.id !== tripId);
      setTrips(next);
      setActiveTripId((curr) => (curr === tripId ? next[0]?.id ?? null : curr));
      api.delete(`/groceries/${tripId}`).catch((err) => console.error('Failed to delete list:', err));
    },
    [trips]
  );

  const renameTrip = useCallback((tripId, name) => {
    setTrips((prev) => prev.map((t) => (t.id === tripId ? { ...t, name } : t)));
    api.patch(`/groceries/${tripId}`, { name }).catch((err) => console.error('Failed to rename list:', err));
  }, []);

  const setActiveTrip = useCallback((tripId) => setActiveTripId(tripId), []);

  const addItem = useCallback(async (tripId, name, price, quantity) => {
    const { trip } = await api.post(`/groceries/${tripId}/items`, { name, price, quantity });
    const mapped = mapTrip(trip);
    setTrips((prev) => prev.map((t) => (t.id === tripId ? mapped : t)));
  }, []);

  // Bulk-adds items parsed from a pasted list in one request. Returns how
  // many were actually added so the caller can confirm it to the user.
  const addItems = useCallback(async (tripId, items) => {
    const { trip } = await api.post(`/groceries/${tripId}/items/bulk`, { items });
    const mapped = mapTrip(trip);
    setTrips((prev) => prev.map((t) => (t.id === tripId ? mapped : t)));
    return items.length;
  }, []);

  const updateItem = useCallback((tripId, itemId, patch) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id !== tripId ? t : { ...t, items: t.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)) }
      )
    );
    api
      .patch(`/groceries/${tripId}/items/${itemId}`, patch)
      .then(({ trip }) => setTrips((prev) => prev.map((t) => (t.id === tripId ? mapTrip(trip) : t))))
      .catch((err) => console.error('Failed to update item:', err));
  }, []);

  const toggleBought = useCallback(
    (tripId, itemId) => {
      const trip = trips.find((t) => t.id === tripId);
      const item = trip?.items.find((it) => it.id === itemId);
      if (!item) return;
      updateItem(tripId, itemId, { bought: !item.bought });
    },
    [trips, updateItem]
  );

  const removeItem = useCallback((tripId, itemId) => {
    setTrips((prev) =>
      prev.map((t) => (t.id !== tripId ? t : { ...t, items: t.items.filter((it) => it.id !== itemId) }))
    );
    api.delete(`/groceries/${tripId}/items/${itemId}`).catch((err) => console.error('Failed to remove item:', err));
  }, []);

  const activeTrip = trips.find((t) => t.id === activeTripId) ?? null;

  return {
    trips,
    activeTrip,
    activeTripId,
    loaded,
    createTrip,
    duplicateTrip,
    deleteTrip,
    renameTrip,
    setActiveTrip,
    addItem,
    addItems,
    updateItem,
    toggleBought,
    removeItem,
  };
}
