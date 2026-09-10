import { useEffect, useMemo, useState } from 'react';
import { useGroceries } from '../hooks/useGroceries';
import { useCustomGroceryItems } from '../hooks/useCustomGroceryItems';
import GroceryItemRow from './GroceryItemRow';
import AddGroceryItem from './AddGroceryItem';
import { formatMoney } from '../utils/format';
import { PRESET_GROCERY_ITEMS } from '../data/presetGroceryItems';

export default function GroceriesView() {
  const {
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
  } = useGroceries();
  const { customItems, addCustomItem } = useCustomGroceryItems();
  const catalog = useMemo(() => [...PRESET_GROCERY_ITEMS, ...customItems], [customItems]);

  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  // Always land on something — first sign-in, or right after deleting the
  // last list. Gated on `loaded` so this doesn't fire (and create a spurious
  // list) while the real lists are still being fetched from the server.
  useEffect(() => {
    if (loaded && trips.length === 0) createTrip();
  }, [loaded, trips.length, createTrip]);

  if (!loaded) {
    return <p className="picker__empty">Loading your lists…</p>;
  }

  if (!activeTrip) return null;

  const lineTotal = (it) => (Number(it.price) || 0) * (Number(it.quantity) || 1);
  const total = activeTrip.items.reduce((sum, it) => sum + lineTotal(it), 0);
  const spent = activeTrip.items.filter((it) => it.bought).reduce((sum, it) => sum + lineTotal(it), 0);
  const boughtCount = activeTrip.items.filter((it) => it.bought).length;

  function startRename() {
    setNameDraft(activeTrip.name);
    setRenaming(true);
  }

  function saveRename() {
    const trimmed = nameDraft.trim();
    if (trimmed) renameTrip(activeTrip.id, trimmed);
    setRenaming(false);
  }

  return (
    <section className="groceries" aria-label="Grocery list">
      <div className="groceries__toolbar">
        <select
          className="groceries__trip-select"
          value={activeTripId ?? ''}
          onChange={(e) => setActiveTrip(e.target.value)}
          aria-label="Choose a saved list"
        >
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} — {t.items.length} item{t.items.length === 1 ? '' : 's'}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--outline btn--small" onClick={() => createTrip()}>
          + New list
        </button>
        <button
          type="button"
          className="btn btn--outline btn--small"
          onClick={() => duplicateTrip(activeTrip.id)}
          title="Start a new list with this one's items, all unchecked"
        >
          ⧉ Duplicate
        </button>
        <button type="button" className="btn btn--danger btn--small" onClick={() => deleteTrip(activeTrip.id)}>
          Delete list
        </button>
      </div>

      <div className="groceries__header">
        {renaming ? (
          <input
            type="text"
            className="groceries__name-input"
            value={nameDraft}
            autoFocus
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={saveRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveRename();
              if (e.key === 'Escape') setRenaming(false);
            }}
          />
        ) : (
          <button type="button" className="groceries__name" onClick={startRename} title="Click to rename">
            {activeTrip.name}
          </button>
        )}
        <div className="groceries__totals">
          <span>
            {boughtCount}/{activeTrip.items.length} bought
          </span>
          <span className="groceries__total-amount">
            {formatMoney(spent)} <span className="groceries__total-of">/ {formatMoney(total)}</span>
          </span>
        </div>
      </div>

      <AddGroceryItem
        onAdd={(name, price, quantity) => addItem(activeTrip.id, name, price, quantity)}
        onAddMany={(items) => addItems(activeTrip.id, items)}
        customItems={customItems}
        onAddCustomItem={addCustomItem}
      />

      {activeTrip.items.length === 0 ? (
        <p className="picker__empty">No items yet — add what you need above.</p>
      ) : (
        <div className="grocery-list">
          {activeTrip.items.map((item) => (
            <GroceryItemRow
              key={item.id}
              item={item}
              catalog={catalog}
              onToggle={() => toggleBought(activeTrip.id, item.id)}
              onUpdate={(patch) => updateItem(activeTrip.id, item.id, patch)}
              onRemove={() => removeItem(activeTrip.id, item.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
