// Turns the raw trips array (as already shaped by useGroceries' mapTrip)
// into the numbers the Reports view and PDF export show. Pure and
// synchronous — the whole history is already in memory client-side, so
// there's no separate report endpoint to keep in sync.

const DAY_MS = 24 * 60 * 60 * 1000;

function lineTotal(item) {
  return (Number(item.price) || 0) * (Number(item.quantity) || 1);
}

function monthKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/**
 * @param {Array} trips - trips from useGroceries (id, name, createdAt, items[])
 * @returns report summary — totals, per-item frequency/interval/price-trend
 *   breakdowns, monthly spend, and a chronological trip history.
 */
export function buildReport(trips) {
  const purchases = [];
  for (const trip of trips) {
    for (const item of trip.items) {
      if (!item.bought) continue;
      const name = (item.name || '').trim();
      if (!name) continue;
      purchases.push({
        tripId: trip.id,
        tripName: trip.name,
        date: trip.createdAt,
        name,
        key: name.toLowerCase(),
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        total: lineTotal(item),
      });
    }
  }

  const totalSpent = purchases.reduce((s, p) => s + p.total, 0);
  const tripsWithPurchases = new Set(purchases.map((p) => p.tripId)).size;

  const byItem = new Map();
  for (const p of purchases) {
    if (!byItem.has(p.key)) byItem.set(p.key, []);
    byItem.get(p.key).push(p);
  }

  const items = [];
  for (const group of byItem.values()) {
    const sorted = [...group].sort((a, b) => a.date - b.date);
    const timesBought = sorted.length;
    const totalQty = sorted.reduce((s, p) => s + p.quantity, 0);
    const itemTotalSpent = sorted.reduce((s, p) => s + p.total, 0);
    const avgUnitPrice = sorted.reduce((s, p) => s + p.price, 0) / timesBought;

    let avgDaysBetween = null;
    if (sorted.length >= 2) {
      let sumDays = 0;
      for (let i = 1; i < sorted.length; i++) sumDays += (sorted[i].date - sorted[i - 1].date) / DAY_MS;
      avgDaysBetween = sumDays / (sorted.length - 1);
    }

    let priceChangePct = null;
    let priceDirection = 'flat';
    if (sorted.length >= 2) {
      const prev = sorted[sorted.length - 2].price;
      const latest = sorted[sorted.length - 1].price;
      if (prev > 0) {
        priceChangePct = ((latest - prev) / prev) * 100;
        priceDirection = latest > prev ? 'up' : latest < prev ? 'down' : 'flat';
      }
    }

    items.push({
      key: sorted[sorted.length - 1].key,
      name: sorted[sorted.length - 1].name, // most recent spelling/casing used
      timesBought,
      totalQty,
      totalSpent: itemTotalSpent,
      avgUnitPrice,
      avgDaysBetween,
      lastBoughtAt: sorted[sorted.length - 1].date,
      lastPrice: sorted[sorted.length - 1].price,
      priceChangePct,
      priceDirection,
      history: sorted.map((p) => ({ date: p.date, price: p.price, quantity: p.quantity, tripName: p.tripName })),
    });
  }

  const mostFrequent = [...items].sort(
    (a, b) => b.timesBought - a.timesBought || b.totalSpent - a.totalSpent
  );

  const priceMovers = items
    .filter((i) => i.priceChangePct !== null && Math.abs(i.priceChangePct) >= 0.5)
    .sort((a, b) => Math.abs(b.priceChangePct) - Math.abs(a.priceChangePct));

  const monthly = new Map();
  for (const p of purchases) {
    const key = monthKey(p.date);
    monthly.set(key, (monthly.get(key) || 0) + p.total);
  }
  const spendByMonth = [...monthly.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, total]) => ({ key, label: monthLabel(key), total }));

  const tripHistory = [...trips]
    .map((t) => {
      const bought = t.items.filter((i) => i.bought);
      return {
        id: t.id,
        name: t.name,
        date: t.createdAt,
        itemCount: t.items.length,
        boughtCount: bought.length,
        spent: bought.reduce((s, i) => s + lineTotal(i), 0),
        plannedTotal: t.items.reduce((s, i) => s + lineTotal(i), 0),
      };
    })
    .sort((a, b) => b.date - a.date);

  return {
    generatedAt: Date.now(),
    totalSpent,
    totalTrips: trips.length,
    tripsWithPurchases,
    purchaseCount: purchases.length,
    uniqueItemCount: items.length,
    items,
    mostFrequent,
    priceMovers,
    spendByMonth,
    tripHistory,
  };
}
