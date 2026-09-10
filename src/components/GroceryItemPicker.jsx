import { useEffect, useMemo, useRef, useState } from 'react';
import { GROCERY_CATEGORIES } from '../data/presetGroceryItems';

// A searchable dropdown over the grocery catalog, standing in for the plain
// item-name text field. Click/focus opens it; typing filters live; picking
// a result (or hitting Enter with an exact match) fills the name field with
// its canonical spelling. Nothing in the list? "+ Add ... as new item"
// saves it to the user's own catalog (tagged "Other") so it's searchable
// from here on — and still fills the field either way, so free-typing and
// hitting the form's Add button always keeps working too.
export default function GroceryItemPicker({ value, onChange, catalog, onAddCustom, onPaste, inputRef }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('All');
  const wrapRef = useRef(null);
  const localInputRef = useRef(null);

  function setRefs(node) {
    localInputRef.current = node;
    if (inputRef) inputRef.current = node;
  }

  const query = value.trim();

  const results = useMemo(() => {
    if (!query) {
      const pool = category === 'All' ? catalog : catalog.filter((it) => it.category === category);
      return pool.slice(0, 60);
    }
    const q = query.toLowerCase();
    const starts = [];
    const includes = [];
    for (const it of catalog) {
      const n = it.name.toLowerCase();
      if (n.startsWith(q)) starts.push(it);
      else if (n.includes(q)) includes.push(it);
    }
    return [...starts, ...includes].slice(0, 30);
  }, [catalog, query, category]);

  const exactMatch = query !== '' && catalog.some((it) => it.name.toLowerCase() === query.toLowerCase());

  useEffect(() => {
    function handleDocMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleDocMouseDown);
    return () => document.removeEventListener('mousedown', handleDocMouseDown);
  }, []);

  function selectItem(item) {
    onChange(item.name);
    setOpen(false);
    localInputRef.current?.focus();
  }

  async function handleAddAsNew() {
    if (!query) return;
    const item = await onAddCustom(query);
    onChange(item.name);
    setOpen(false);
    localInputRef.current?.focus();
  }

  return (
    <div className="item-picker" ref={wrapRef}>
      <input
        ref={setRefs}
        type="text"
        placeholder="Item — search, pick, or paste a whole list"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onPaste={onPaste}
        className="add-item__name"
        autoComplete="off"
        required
      />

      {open && (
        <div className="item-picker__menu">
          {!query && (
            <div className="item-picker__categories">
              {['All', ...GROCERY_CATEGORIES].map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`chip item-picker__chip ${category === c ? 'chip--active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <ul className="item-picker__list">
            {results.map((it) => (
              <li key={it.id}>
                <button
                  type="button"
                  className="item-picker__option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectItem(it)}
                >
                  <span>{it.name}</span>
                  {it.custom && <span className="item-picker__tag">Other</span>}
                </button>
              </li>
            ))}
            {results.length === 0 && <li className="item-picker__empty">No matches — add it below.</li>}
          </ul>

          {query && !exactMatch && (
            <button
              type="button"
              className="item-picker__add-new"
              onMouseDown={(e) => e.preventDefault()}
              onClick={handleAddAsNew}
            >
              + Add "{query}" as new item
            </button>
          )}
        </div>
      )}
    </div>
  );
}
