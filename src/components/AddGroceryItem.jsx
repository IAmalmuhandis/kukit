import { useMemo, useState } from 'react';
import { looksLikeList, parseGroceryList } from '../utils/parseGroceryList';
import { formatMoney } from '../utils/format';
import { PRESET_GROCERY_ITEMS } from '../data/presetGroceryItems';
import { canonicalizeName } from '../utils/groceryCatalog';
import GroceryItemPicker from './GroceryItemPicker';

// Paste a whole list — from Notes, Google Keep, WhatsApp, wherever — into
// the item field and it's split into one item per line automatically
// (quantities like "2x" and prices like "₦500" are picked out too, where
// present). A single line pastes normally into the field, same as typing.
//
// The name field is a searchable catalog picker rather than plain text —
// see GroceryItemPicker — but free-typing and hitting Add still works
// exactly as before; on submit (and for each pasted line) the typed name is
// snapped to its catalog spelling when one matches, so "egg" / "Egg" /
// "Eggs" all end up recorded the same way. That's what the Reports tab's
// per-item tracking depends on.
export default function AddGroceryItem({ onAdd, onAddMany, customItems, onAddCustomItem }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [pending, setPending] = useState(null); // parsed preview from a list paste
  const [status, setStatus] = useState('');

  const catalog = useMemo(() => [...PRESET_GROCERY_ITEMS, ...customItems], [customItems]);

  const numericPrice = price === '' ? 0 : Math.max(0, Number(price));
  const numericQty = quantity === '' ? 1 : Math.max(0, Number(quantity)) || 1;
  const lineTotal = numericPrice * numericQty;

  function handlePaste(e) {
    const text = e.clipboardData?.getData('text');
    if (!text || !looksLikeList(text)) return; // let a single-line paste behave normally
    e.preventDefault();
    const parsed = parseGroceryList(text).map((row) => ({ ...row, name: canonicalizeName(row.name, catalog) }));
    if (parsed.length > 0) setPending(parsed);
  }

  function updatePendingRow(index, patch) {
    setPending((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function removePendingRow(index) {
    setPending((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : null;
    });
  }

  async function confirmPending() {
    if (!pending || pending.length === 0) return;
    const count = await onAddMany(pending);
    setPending(null);
    setStatus(`Added ${count} item${count === 1 ? '' : 's'}.`);
    setTimeout(() => setStatus(''), 3000);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(canonicalizeName(trimmed, catalog), numericPrice, numericQty);
    setName('');
    setPrice('');
    setQuantity('');
  }

  if (pending) {
    return (
      <div className="paste-preview">
        <p className="paste-preview__title">
          Found {pending.length} item{pending.length === 1 ? '' : 's'} in what you pasted — check them over, then add.
        </p>
        <div className="paste-preview__rows">
          {pending.map((row, i) => (
            <div className="paste-preview__row" key={i}>
              <input
                type="text"
                className="paste-preview__name"
                value={row.name}
                onChange={(e) => updatePendingRow(i, { name: e.target.value })}
                aria-label="Item name"
              />
              <label className="paste-preview__field">
                qty
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.quantity}
                  onChange={(e) => updatePendingRow(i, { quantity: Math.max(0, Number(e.target.value)) || 1 })}
                />
              </label>
              <label className="paste-preview__field">
                ₦
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={row.price}
                  onChange={(e) => updatePendingRow(i, { price: Math.max(0, Number(e.target.value)) || 0 })}
                />
              </label>
              <button
                type="button"
                className="paste-preview__remove"
                onClick={() => removePendingRow(i)}
                aria-label={`Remove ${row.name} from list`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="paste-preview__actions">
          <button type="button" className="btn btn--outline btn--small" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn--primary btn--small" onClick={confirmPending}>
            Add {pending.length} item{pending.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="add-item" onSubmit={handleSubmit}>
      <GroceryItemPicker
        value={name}
        onChange={setName}
        catalog={catalog}
        onAddCustom={onAddCustomItem}
        onPaste={handlePaste}
      />
      <label className="add-item__qty" title="Quantity">
        ×
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </label>
      <label className="add-item__price">
        ₦
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </label>
      {(price !== '' || quantity !== '') && numericQty !== 1 && (
        <span className="add-item__line-total">= {formatMoney(lineTotal)}</span>
      )}
      <button type="submit" className="btn btn--primary">
        Add
      </button>
      {status && <span className="add-item__status">{status}</span>}
    </form>
  );
}
