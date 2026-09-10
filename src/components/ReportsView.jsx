import { useMemo } from 'react';
import { useGroceries } from '../hooks/useGroceries';
import { buildReport } from '../utils/reports';
import { formatMoney, formatDate, formatDays } from '../utils/format';

function StatCard({ label, value, hint }) {
  return (
    <div className="report-stat">
      <span className="report-stat__label">{label}</span>
      <span className="report-stat__value">{value}</span>
      {hint && <span className="report-stat__hint">{hint}</span>}
    </div>
  );
}

function PriceChangeBadge({ pct, direction }) {
  if (pct === null) return <span className="price-change price-change--flat">—</span>;
  const sign = pct > 0 ? '+' : '';
  return (
    <span className={`price-change price-change--${direction}`}>
      {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–'} {sign}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function ReportsView() {
  const { trips, loaded } = useGroceries();
  const report = useMemo(() => buildReport(trips), [trips]);

  if (!loaded) {
    return <p className="picker__empty">Loading your history…</p>;
  }

  if (report.purchaseCount === 0) {
    return (
      <section className="reports" aria-label="Grocery spending report">
        <p className="picker__empty">
          No purchase history yet. Check off items as "bought" on a shopping list, and your spending report will
          build up here — total spend, what you buy most, and how prices move over time.
        </p>
      </section>
    );
  }

  const maxMonth = Math.max(...report.spendByMonth.map((m) => m.total), 1);

  return (
    <section className="reports" aria-label="Grocery spending report">
      <div className="reports__toolbar no-print">
        <p className="reports__toolbar-hint">
          Based on {report.purchaseCount} purchased item{report.purchaseCount === 1 ? '' : 's'} across{' '}
          {report.tripsWithPurchases} trip{report.tripsWithPurchases === 1 ? '' : 's'}.
        </p>
        <button type="button" className="btn btn--primary btn--small" onClick={() => window.print()}>
          ⭳ Export as PDF
        </button>
      </div>

      <div className="report-print">
        <header className="report-print__header">
          <h2>Grocery spending report</h2>
          <p>Generated {formatDate(report.generatedAt)}</p>
        </header>

        <div className="report-stats">
          <StatCard label="Total spent" value={formatMoney(report.totalSpent)} />
          <StatCard label="Shopping trips" value={report.totalTrips} hint={`${report.tripsWithPurchases} with purchases`} />
          <StatCard label="Items tracked" value={report.uniqueItemCount} />
          <StatCard label="Items purchased" value={report.purchaseCount} />
        </div>

        {report.spendByMonth.length > 1 && (
          <div className="report-card">
            <h3>Spending by month</h3>
            <div className="spend-chart">
              {report.spendByMonth.map((m) => (
                <div className="spend-chart__col" key={m.key}>
                  <span className="spend-chart__amount">{formatMoney(m.total)}</span>
                  <div className="spend-chart__bar" style={{ height: `${Math.max(6, (m.total / maxMonth) * 100)}%` }} />
                  <span className="spend-chart__label">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="report-card">
          <h3>Most frequently bought</h3>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Times bought</th>
                  <th>Total qty</th>
                  <th>Avg unit price</th>
                  <th>Total spent</th>
                  <th>Buys again after</th>
                </tr>
              </thead>
              <tbody>
                {report.mostFrequent.slice(0, 15).map((it) => (
                  <tr key={it.key}>
                    <td>{it.name}</td>
                    <td>{it.timesBought}</td>
                    <td>{it.totalQty}</td>
                    <td>{formatMoney(it.avgUnitPrice)}</td>
                    <td>{formatMoney(it.totalSpent)}</td>
                    <td>{formatDays(it.avgDaysBetween)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="report-card">
          <h3>Price changes</h3>
          {report.priceMovers.length === 0 ? (
            <p className="report-card__empty">No repeat purchases with a price change yet.</p>
          ) : (
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Previous price</th>
                    <th>Latest price</th>
                    <th>Change</th>
                    <th>Last bought</th>
                  </tr>
                </thead>
                <tbody>
                  {report.priceMovers.map((it) => {
                    const prevPrice = it.history[it.history.length - 2]?.price ?? null;
                    return (
                      <tr key={it.key}>
                        <td>{it.name}</td>
                        <td>{prevPrice === null ? '—' : formatMoney(prevPrice)}</td>
                        <td>{formatMoney(it.lastPrice)}</td>
                        <td>
                          <PriceChangeBadge pct={it.priceChangePct} direction={it.priceDirection} />
                        </td>
                        <td>{formatDate(it.lastBoughtAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="report-card">
          <h3>Trip history</h3>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>List</th>
                  <th>Bought</th>
                  <th>Spent</th>
                </tr>
              </thead>
              <tbody>
                {report.tripHistory.map((t) => (
                  <tr key={t.id}>
                    <td>{formatDate(t.date)}</td>
                    <td>{t.name}</td>
                    <td>
                      {t.boughtCount}/{t.itemCount}
                    </td>
                    <td>{formatMoney(t.spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
