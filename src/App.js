import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [config, setConfig] = useState({ url: '', key: '' });
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('add');
  
  // PHASE 2: Updated fields
  const [formData, setFormData] = useState({
    player_card_name: '',
    cost: '',
    year: '',
    set_name: '',
    status: 'Purchased',
    notes: '',
    // UPDATED FIELDS
    source: 'eBay',
    seller_name: '',
    listing_link: '',
    card_type: '',
    card_number: '',
    condition_purchased: '',
    serial_number: '',
    grading_company: '',
    grade: '', // NEW GRADE FIELD
    grading_cost: '',
    selling_platform: 'eBay',
    price: '',
    photo_links: ''
  });

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      supabase = createClient(config.url, config.key);
      const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setCards(data || []);
      setIsConnected(true);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const generateCardId = async () => {
    try {
      const { data } = await supabase.from('cards').select('card_id').order('id', { ascending: false }).limit(1);
      const lastCard = data && data.length > 0 ? data[0] : null;
      const nextNumber = lastCard ? parseInt(lastCard.card_id.replace('CARD', '')) + 1 : 1;
      return `CARD${String(nextNumber).padStart(7, '0')}`;
    } catch (error) {
      return `CARD${String(Date.now()).slice(-7)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.player_card_name.trim()) return;
    
    try {
      const cardId = await generateCardId();
      const cardData = {
        card_id: cardId,
        player_card_name: formData.player_card_name,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        year: formData.year || null,
        set_name: formData.set_name || null,
        status: formData.status,
        notes: formData.notes || null,
        source: formData.source,
        seller_name: formData.seller_name || null,
        listing_link: formData.listing_link || null,
        card_type: formData.card_type || null,
        card_number: formData.card_number || null,
        condition_purchased: formData.condition_purchased || null,
        serial_number: formData.serial_number || null,
        grading_company: formData.grading_company || null,
        grade: formData.grade ? parseInt(formData.grade) : null, // NEW GRADE FIELD
        grading_cost: formData.grading_cost ? parseFloat(formData.grading_cost) : null,
        selling_platform: formData.selling_platform,
        price: formData.price ? parseFloat(formData.price) : null,
        photo_links: formData.photo_links || null
      };
      
      const { error } = await supabase.from('cards').insert([cardData]);
      if (error) throw error;
      
      alert('Card added successfully!');
      
      // Reset form
      setFormData({
        player_card_name: '',
        cost: '',
        year: '',
        set_name: '',
        status: 'Purchased',
        notes: '',
        source: 'eBay',
        seller_name: '',
        listing_link: '',
        card_type: '',
        card_number: '',
        condition_purchased: '',
        serial_number: '',
        grading_company: '',
        grade: '',
        grading_cost: '',
        selling_platform: 'eBay',
        price: '',
        photo_links: ''
      });
      
      // Reload cards
      const { data } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
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
        <h1 style={{ margin: 0 }}>📦 Card Tracking System - Phase 2</h1>
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
            <strong>🔧 Phase 2 Updated:</strong> Removed sport field, added grade (1-10), moved status to top section!
          </div>
          
          <form onSubmit={handleSubmit} style={{ maxWidth: '800px' }}>
            {/* Basic Card Info - NOW WITH STATUS */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>📋 Basic Card Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>📊 Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="Purchased">Purchased</option>
                    <option value="Grading">Grading</option>
                    <option value="Selling">Selling</option>
                    <option value="Sold">Sold</option>
                    <option value="Other">Other</option>
                  </select>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Card Type</label>
                  <input
                    type="text"
                    value={formData.card_type}
                    onChange={(e) => setFormData({...formData, card_type: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="e.g., Sports, Pokemon, Magic"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Card Number</label>
                  <input
                    type="text"
                    value={formData.card_number}
                    onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="e.g., #23"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Serial Number/Parallel</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="e.g., /99, Gold Parallel"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Condition When Purchased</label>
                  <input
                    type="text"
                    value={formData.condition_purchased}
                    onChange={(e) => setFormData({...formData, condition_purchased: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="e.g., Near Mint, Raw"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Info */}
            <div style={{ backgroundColor: '#fff3cd', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>💰 Purchase Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="eBay">eBay</option>
                    <option value="Card Show">Card Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Seller Name</label>
                  <input
                    type="text"
                    value={formData.seller_name}
                    onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="Seller username or name"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Listing Link</label>
                  <input
                    type="url"
                    value={formData.listing_link}
                    onChange={(e) => setFormData({...formData, listing_link: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="https://ebay.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Grading Info - NOW WITH GRADE DROPDOWN */}
            <div style={{ backgroundColor: '#d4edda', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#155724' }}>🏆 Grading Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grading Company</label>
                  <select
                    value={formData.grading_company}
                    onChange={(e) => setFormData({...formData, grading_company: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="">Not Graded</option>
                    <option value="PSA">PSA</option>
                    <option value="BGS">BGS</option>
                    <option value="SGC">SGC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>🆕 Grade (1-10)</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({...formData, grade: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="">No Grade</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Grading Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grading_cost}
                    onChange={(e) => setFormData({...formData, grading_cost: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            {/* Sale Info */}
            <div style={{ backgroundColor: '#f8d7da', padding: '15px', marginBottom: '20px', borderRadius: '4px' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#721c24' }}>💸 Sale Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Selling Platform</label>
                  <select
                    value={formData.selling_platform}
                    onChange={(e) => setFormData({...formData, selling_platform: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  >
                    <option value="eBay">eBay</option>
                    <option value="Card Show">Card Show</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Photo Links</label>
                  <input
                    type="text"
                    value={formData.photo_links}
                    onChange={(e) => setFormData({...formData, photo_links: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    placeholder="Comma-separated URLs"
                  />
                </div>
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
              style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}
            >
              💾 Add Card to Collection
            </button>
          </form>
        </div>
      )}

      {currentView === 'list' && (
        <div>
          <h2>📋 Your Card Collection ({cards.length})</h2>
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
              <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#0066cc' }}>Total Cards</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{cards.length}</p>
              </div>
              <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#856404' }}>Total Invested</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  ${cards.reduce((sum, card) => sum + (parseFloat(card.cost) || 0) + (parseFloat(card.grading_cost) || 0), 0).toFixed(2)}
                </p>
              </div>
              <div style={{ backgroundColor: '#d4edda', padding: '15px', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 5px 0', color: '#155724' }}>Total Revenue</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                  ${cards.filter(card => card.status === 'Sold').reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {cards.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No cards added yet. Click "Add Card" to get started!</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Card ID</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Player/Card</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Set</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Cost</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Grade</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Price</th>
                    <th style={{ padding: '10px', border: '1px solid #ccc', textAlign: 'left' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr key={card.id}>
                      <td style={{ padding: '8px', border: '1px solid #ccc', fontFamily: 'monospace', fontSize: '12px' }}>{card.card_id}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.player_card_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.set_name}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>${parseFloat(card.cost || 0).toFixed(2)}</td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                        {card.grade ? (
                          <span style={{ 
                            padding: '2px 6px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: 'bold',
                            backgroundColor: card.grade >= 9 ? '#d4edda' : card.grade >= 7 ? '#fff3cd' : '#f8d7da',
                            color: card.grade >= 9 ? '#155724' : card.grade >= 7 ? '#856404' : '#721c24'
                          }}>
                            {card.grade}/10
                          </span>
                        ) : (card.grading_company || 'Raw')}
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ccc' }}>{card.price ? `$${parseFloat(card.price).toFixed(2)}` : 'N/A'}</td>
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
