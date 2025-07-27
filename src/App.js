import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState({ url: '', key: '' });
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('add');
  
  // Simple form with just essential fields
  const [formData, setFormData] = useState({
    player_card_name: '',
    cost: '',
    year: '',
    set_name: '',
    status: 'Purchased',
    notes: ''
  });

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      supabase = createClient(config.url, config.key);
      const { data, error } = await supabase.from('cards').select('*');
      if (error) throw error;
      setCards(data || []);
      setIsConnected(true);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.player_card_name.trim()) return;
    
    try {
      const cardData = {
        player_card_name: formData.player_card_name,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        year: formData.year || null,
        set_name: formData.set_name || null,
        status: formData.status,
        notes: formData.notes || null,
        card_id: `CARD${String(Date.now()).slice(-7)}`
      };
      
      const { error } = await supabase.from('cards').insert([cardData]);
      if (error) throw error;
      
      alert('Card added successfully!');
      setFormData({ player_card_name: '', cost: '', year: '', set_name: '', status: 'Purchased', notes: '' });
      
      // Reload cards
      const { data } = await supabase.from('cards').select('*');
      setCards(data || []);
    } catch (error) {
      alert('Error adding card: ' + error.message);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial' }}>
        <h1>🔥 Card Tracking System</h1>
        <form onSubmit={handleConnect}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Supabase URL:</label>
            <input
              type="url"
              value={config.url}
              onChange={(e) => setConfig({...config, url: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
              placeholder="https://your-project.supabase.co"
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>API Key:</label>
            <input
              type="password"
              value={config.key}
              onChange={(e) => setConfig({...config, key: e.target.value})}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
              required
            />
          </div>
          <button 
            type="submit" 
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Connect to Database
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>📦 Card Tracking System</h1>
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => setCurrentView('add')}
            style={{ padding: '5px 15px', marginRight: '10px', backgroundColor: currentView === 'add' ? '#007bff' : '#f8f9fa', color: currentView === 'add' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            Add Card
          </button>
          <button 
            onClick={() => setCurrentView('list')}
            style={{ padding: '5px 15px', backgroundColor: currentView === 'list' ? '#007bff' : '#f8f9fa', color: currentView === 'list' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}
          >
            View Cards ({cards.length})
          </button>
        </div>
      </div>

      {currentView === 'add' && (
        <div>
          <h2>➕ Add New Card</h2>
          <div style={{ backgroundColor: '#e7f3ff', padding: '10px', marginBottom: '20px', borderRadius: '4px' }}>
            <strong>Phase 1:</strong> Basic fields only - no dates yet to ensure stability!
          </div>
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Player/Card Name *</label>
                <input
                  type="text"
                  value={formData.player_card_name}
                  onChange={(e) => setFormData({...formData, player_card_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="e.g., Michael Jordan"
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Year</label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({...formData, year: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="e.g., 2024-25"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Set</label>
                <input
                  type="text"
                  value={formData.set_name}
                  onChange={(e) => setFormData({...formData, set_name: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  placeholder="e.g., Panini Prizm"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                >
                  <option value="Purchased">Purchased</option>
                  <option value="Grading">Grading</option>
                  <option value="Selling">Selling</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                rows="3"
                placeholder="Any notes about this card..."
              />
            </div>
            
            <button 
              type="submit" 
              style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              💾 Add Card
            </button>
          </form>
        </div>
      )}

      {currentView === 'list' && (
        <div>
          <h2>📋 Your Cards ({cards.length})</h2>
          {cards.length === 0 ? (
            <p style={{ color: '#666' }}>No cards added yet. Click "Add Card" to get started!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Card ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Player/Card</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Year</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Set</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Cost</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr key={card.id}>
                      <td style={{ padding: '8px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '12px' }}>{card.card_id}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.player_card_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.year}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.set_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>${parseFloat(card.cost || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        <span style={{ 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          backgroundColor: card.status === 'Sold' ? '#d4edda' : card.status === 'Selling' ? '#fff3cd' : '#f8f9fa',
                          color: card.status === 'Sold' ? '#155724' : card.status === 'Selling' ? '#856404' : '#495057'
                        }}>
                          {card.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
