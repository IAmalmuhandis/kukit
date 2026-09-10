import { useState } from 'react';
import { formatMoney } from '../utils/format';
import { canonicalizeName } from '../utils/groceryCatalog';

export default function GroceryItemRow({ item, catalog, onToggle, onUpdate, onRemove }) {
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(item.name);

  function saveName() {
    const trimmed = nameDraft.trim();
    if (trimmed) onUpdate({ name: catalog ? canonicalizeName(trimmed, catalog) : trimmed });
    else setNameDraft(item.name);
    setEditingName(false);
  }

  const quantity = Number(item.quantity) || 1;
  const lineTotal = (Number(item.price) || 0) * quantity;

  return (
    <div className={`grocery-item ${item.bought ? 'grocery-item--bought' : ''}`}>
      <input
        type="checkbox"
        className="grocery-item__check"
        checked={item.bought}
        onChange={onToggle}
        aria-label={`Mark ${item.name} as bought`}
      />

      {editingName ? (
        <input
          type="text"
          className="grocery-item__name-input"
          value={nameDraft}
          autoFocus
          onChange={(e) => setNameDraft(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => {
            if (e.key === 'Enter') saveName();
            if (e.key === 'Escape') {
              setNameDraft(item.name);
              setEditingName(false);
            }
          }}
        />
      ) : (
        <button type="button" className="grocery-item__name" onClick={() => setEditingName(true)} title="Click to edit">
          {item.name}
        </button>
      )}

      <label className="grocery-item__qty" title="Quantity">
        ×
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.quantity ?? 1}
          onChange={(e) => onUpdate({ quantity: Math.max(0, Number(e.target.value)) || 1 })}
        />
      </label>

      <label className="grocery-item__price" title="Unit price">
        ₦
        <input
          type="number"
          min="0"
          step="0.01"
          value={item.price}
          onChange={(e) => onUpdate({ price: Math.max(0, Number(e.target.value) || 0) })}
        />
      </label>

      {quantity !== 1 && <span className="grocery-item__line-total">{formatMoney(lineTotal)}</span>}

      <button type="button" className="grocery-item__remove" onClick={onRemove} aria-label={`Remove ${item.name}`}>
        ×
      </button>
    </div>
  );
}
