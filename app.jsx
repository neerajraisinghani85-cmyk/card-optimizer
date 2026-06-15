const { useState, useEffect } = React;

const CATEGORIES = [
  { key: 'amazon', label: 'Amazon' },
  { key: 'flipkart', label: 'Flipkart' },
  { key: 'groceries', label: 'Groceries' },
  { key: 'fuel', label: 'Fuel' },
  { key: 'dining', label: 'Dining / Food delivery' },
  { key: 'travel', label: 'Travel / Hotels' },
  { key: 'utilities', label: 'Utilities / Bills' },
  { key: 'online', label: 'Other Online' },
  { key: 'offline', label: 'Other Offline' },
];

function ApiSetup({ onSave }) {
  const [key, setKey] = useState('');
  return (
    <div className="api-setup">
      <h2>Enter your Anthropic API Key</h2>
      <p>Your key is saved only in your browser. It's never stored anywhere else or sent to anyone except Anthropic directly.</p>
      <div className="input-group">
        <input className="input" type="password" placeholder="sk-ant-..." value={key} onChange={e => setKey(e.target.value)} />
      </div>
      <button className="btn btn-primary" onClick={() => { if(key.trim()) onSave(key.trim()); }}>Save & Continue</button>
      <p style={{marginTop: 12, fontSize: 13, color: '#aaa'}}>Get your key at console.anthropic.com</p>
    </div>
  );
}

function AddCardForm({ onAdd, onCancel }) {
  const [name, setName] = useState('');
  const [bank, setBank] = useState('');
  const [digits, setDigits] = useState('');
  const [isFlatRate, setIsFlatRate] = useState(false);
  const [flatRate, setFlatRate] = useState('');
  const [categories, setCategories] = useState({});
  const [specialOffers, setSpecialOffers] = useState('');

  const setCat = (key, val) => setCategories(prev => ({ ...prev, [key]: val }));

  const handleAdd = () => {
    if (!name.trim() || !bank.trim()) return alert('Please enter card name and bank.');
    const card = {
      id: Date.now(),
      name: name.trim(),
      bank: bank.trim(),
      digits: digits.trim(),
      isFlatRate,
      flatRate: parseFloat(flatRate) || 0,
      categories,
      specialOffers: specialOffers.trim(),
    };
    onAdd(card);
  };

  return (
    <div className="card">
      <div className="section-title">Add new card</div>

      <div className="input-row">
        <div className="input-group">
          <div className="label">Card name</div>
          <input className="input" placeholder="e.g. Millennia" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="input-group">
          <div className="label">Bank</div>
          <input className="input" placeholder="e.g. HDFC" value={bank} onChange={e => setBank(e.target.value)} />
        </div>
      </div>

      <div className="input-group">
        <div className="label">Last 4 digits (optional)</div>
        <input className="input" placeholder="e.g. 4321" maxLength={4} value={digits} onChange={e => setDigits(e.target.value)} />
      </div>

      <div className="divider" />

      <div className="toggle-row">
        <input type="checkbox" id="flatToggle" checked={isFlatRate} onChange={e => setIsFlatRate(e.target.checked)} />
        <label className="toggle-label" htmlFor="flatToggle">This card has a flat cashback rate on everything</label>
      </div>

      {isFlatRate && (
        <div className="flat-rate-section">
          <div className="label">Flat cashback % on all spends</div>
          <input className="input" type="number" placeholder="e.g. 2" value={flatRate} onChange={e => setFlatRate(e.target.value)} />
        </div>
      )}

      <div className="label" style={{marginBottom: 10}}>Cashback % by category {isFlatRate ? '(overrides flat rate for these)' : ''}</div>
      <div className="category-grid">
        {CATEGORIES.map(cat => (
          <div className="category-item" key={cat.key}>
            <label>{cat.label}</label>
            <input className="input" type="number" placeholder="%" value={categories[cat.key] || ''} onChange={e => setCat(cat.key, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="divider" />

      <div className="input-group">
        <div className="label">Special offers & deals (describe in plain text)</div>
        <textarea
          className="input"
          style={{minHeight: 80, resize: 'vertical'}}
          placeholder="e.g. 5% cashback on Swiggy and Zomato. Buy Lifestyle gift voucher from Woohoo to get extra 3% back. 10x reward points on weekend dining."
          value={specialOffers}
          onChange={e => setSpecialOffers(e.target.value)}
        />
      </div>

      <button className="btn btn-primary" onClick={handleAdd}>Add card</button>
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
    </div>
  );
}

function CardsList({ cards, onDelete }) {
  if (cards.length === 0) {
    return (
      <div className="empty-state">
        <div style={{fontSize: 40}}>💳</div>
        <p>No cards yet. Add your first card above.</p>
      </div>
    );
  }

  return cards.map(card => (
    <div className="card" key={card.id}>
      <div className="card-header">
        <div>
          <div className="card-name">{card.bank} {card.name}</div>
          {card.digits && <div className="card-bank">•••• {card.digits}</div>}
        </div>
        <button className="btn btn-danger" onClick={() => onDelete(card.id)}>Remove</button>
      </div>
      {card.isFlatRate && <div className="tag">Flat {card.flatRate}% on all</div>}
      {CATEGORIES.filter(c => card.categories[c.key]).map(c => (
        <div className="tag" key={c.key}>{c.label}: {card.categories[c.key]}%</div>
      ))}
      {card.specialOffers && (
        <div style={{marginTop: 10, fontSize: 13, color: '#666', lineHeight: 1.5}}>
          <span style={{fontWeight: 600}}>Special offers: </span>{card.specialOffers}
        </div>
      )}
    </div>
  ));
}

function FindBestCard({ cards, apiKey }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!query.trim()) return;
    if (cards.length === 0) return;
    setLoading(true);
    setError('');
    setResult(null);

    const cardsInfo = cards.map(c => {
      const cats = CATEGORIES.filter(cat => c.categories[cat.key]).map(cat => `${cat.label}: ${c.categories[cat.key]}%`).join(', ');
      return `Card: ${c.bank} ${c.name}${c.digits ? ` (••${c.digits})` : ''}
Flat rate: ${c.isFlatRate ? c.flatRate + '%' : 'None'}
Category rates: ${cats || 'None specified'}
Special offers: ${c.specialOffers || 'None'}`;
    }).join('\n\n');

    const prompt = `You are a smart credit/debit card optimizer for India. The user wants to make a purchase. Analyze which card gives maximum real value.

USER'S PURCHASE: ${query}

USER'S CARDS:
${cardsInfo}

YOUR TASK:
1. Figure out the merchant, category, and amount from the purchase description.
2. For each card, calculate exact cashback/reward value in ₹ based on the amount.
3. Rank ALL cards from best to worst.
4. If there is a genuinely smarter route (like buying a gift voucher from a specific platform that gives more cashback than direct payment), suggest it clearly with exact savings. Only suggest if it gives meaningfully more value. Do NOT suggest gift cards or workarounds unless they give clearly more value.

RESPOND ONLY IN THIS EXACT JSON FORMAT:
{
  "merchant": "name of merchant",
  "category": "category detected",
  "amount": 1234,
  "smart_suggestion": null or "Clear description of smarter route with exact savings in ₹",
  "rankings": [
    {
      "card": "Bank CardName (••digits or empty)",
      "cashback_inr": 150,
      "cashback_percent": 5,
      "reason": "Short reason why this rate applies"
    }
  ]
}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content[0].text;
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError('Something went wrong: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {cards.length === 0 && (
        <div className="no-cards-warning">
          ⚠️ You haven't added any cards yet. Go to "My Cards" tab and add your cards first.
        </div>
      )}

      <div className="query-box">
        <div className="label" style={{marginBottom: 8}}>What are you buying?</div>
        <textarea
          className="query-input"
          placeholder="e.g. buying Nike shoes for ₹3000 from Lifestyle&#10;or: petrol ₹2000 at HP pump&#10;or: dinner at Zomato ₹800"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
        <button
          className="btn btn-primary"
          style={{marginTop: 12}}
          onClick={analyze}
          disabled={loading || cards.length === 0}
        >
          {loading ? 'Analyzing...' : 'Find best card →'}
        </button>
      </div>

      {loading && <div className="loading">Analyzing your cards and finding best options...</div>}
      {error && <div style={{color: '#dc2626', padding: 16, background: '#fee2e2', borderRadius: 10, marginBottom: 16}}>{error}</div>}

      {result && (
        <div>
          <div style={{fontSize: 13, color: '#888', marginBottom: 16}}>
            {result.merchant} · {result.category} · ₹{result.amount?.toLocaleString()}
          </div>

          {result.smart_suggestion && (
            <div className="smart-suggestion">
              <div className="smart-title">💡 Smarter route</div>
              <div className="smart-text">{result.smart_suggestion}</div>
            </div>
          )}

          <div className="section-title">All cards ranked</div>
          {result.rankings?.map((r, i) => (
            <div className={`result-card ${i === 0 ? 'best' : ''}`} key={i}>
              <div className="result-rank">#{i + 1} {i === 0 ? '· Best option' : ''}</div>
              <div className="result-top">
                <div className="result-card-name">{r.card}</div>
                <div className="result-cashback">₹{r.cashback_inr}</div>
              </div>
              <div className="result-detail">{r.cashback_percent}% · {r.reason}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function App() {
  const [tab, setTab] = useState('find');
  const [cards, setCards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cards') || '[]'); } catch { return []; }
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('apiKey') || '');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => { localStorage.setItem('cards', JSON.stringify(cards)); }, [cards]);

  const saveApiKey = (key) => {
    localStorage.setItem('apiKey', key);
    setApiKey(key);
  };

  const addCard = (card) => {
    setCards(prev => [...prev, card]);
    setShowAddForm(false);
  };

  const deleteCard = (id) => {
    if (confirm('Remove this card?')) setCards(prev => prev.filter(c => c.id !== id));
  };

  if (!apiKey) return (
    <div className="app">
      <div className="header">
        <h1>Card Optimizer</h1>
        <p>Find the best card for every purchase</p>
      </div>
      <ApiSetup onSave={saveApiKey} />
    </div>
  );

  return (
    <div className="app">
      <div className="header">
        <h1>Card Optimizer</h1>
        <p>Find the best card for every purchase</p>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'find' ? 'active' : ''}`} onClick={() => setTab('find')}>Find best card</button>
        <button className={`tab ${tab === 'cards' ? 'active' : ''}`} onClick={() => setTab('cards')}>My cards ({cards.length})</button>
        <button className={`tab ${tab === 'settings' ? 'active' : ''}`} onClick={() => setTab('settings')}>Settings</button>
      </div>

      {tab === 'find' && <FindBestCard cards={cards} apiKey={apiKey} />}

      {tab === 'cards' && (
        <div>
          {!showAddForm && (
            <button className="btn btn-primary" style={{marginBottom: 20}} onClick={() => setShowAddForm(true)}>
              + Add new card
            </button>
          )}
          {showAddForm && <AddCardForm onAdd={addCard} onCancel={() => setShowAddForm(false)} />}
          <CardsList cards={cards} onDelete={deleteCard} />
        </div>
      )}

      {tab === 'settings' && (
        <div className="card">
          <div className="section-title">API Key</div>
          <p style={{fontSize: 14, color: '#666', marginBottom: 14}}>Update your Anthropic API key</p>
          <input className="input" type="password" defaultValue={apiKey} id="newKey" />
          <button className="btn btn-primary" style={{marginTop: 12}} onClick={() => {
            const val = document.getElementById('newKey').value.trim();
            if (val) saveApiKey(val);
          }}>Update key</button>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
