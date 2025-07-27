import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Simple icons as text (no external dependencies)
const PlusIcon = () => <span>+</span>;
const SearchIcon = () => <span>🔍</span>;
const EditIcon = () => <span>✏️</span>;
const DeleteIcon = () => <span>🗑️</span>;
const DatabaseIcon = () => <span>💾</span>;

let supabase = null;
let supabaseOperations = null;

const createSupabaseClient = (url, key) => {
  return createClient(url, key);
};

const createSupabaseOperations = (client) => ({
  async select() {
    const { data, error } = await client
      .from('cards')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },
  
  async insert(card) {
    const { data: existingCards } = await client
      .from('cards')
      .select('card_id')
      .order('id', { ascending: false })
      .limit(1);
    
    const nextNumber = existingCards && existingCards.length > 0 
      ? parseInt(existingCards[0].card_id.replace('CARD', '')) + 1 
      : 1;
    
    const cardWithId = {
      ...card,
      card_id: `CARD${String(nextNumber).padStart(7, '0')}`
    };
    
    const { data, error } = await client
      .from('cards')
      .insert([cardWithId])
      .select();
    return { data, error };
  },
  
  async update(id, updates) {
    const { data, error } = await client
      .from('cards')
      .update(updates)
      .eq('id', id)
      .select();
    return { data, error };
  },
  
  async delete(id) {
    const { data, error } = await client
      .from('cards')
      .delete()
      .eq('id', id);
    return { data, error };
  }
});

const CardTrackingSystem = () => {
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    key: ''
  });

  // COMPLETE FORM DATA WITH ALL FIELDS
  const [formData, setFormData] = useState({
    date_purchased: '',
    source: 'eBay',
    seller_name: '',
    listing_link: '',
    player_card_name: '',
    year: '',
    set_name: '',
    card_type: '',
    card_number: '',
    condition_purchased: '',
    serial_number: '',
    cost: '',
    status: 'Purchased',
    grading_company: '',
    grade: '',
    graded_date: '',
    grading_cost: '',
    date_sold: '',
    selling_platform: 'eBay',
    price: '',
    photo_links: '',
    notes: ''
  });

  useEffect(() => {
    const savedConfig = sessionStorage.getItem('supabase_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setSupabaseConfig(config);
      initializeSupabase(config.url, config.key);
    }
  }, []);

  const initializeSupabase = async (url, key) => {
    try {
      supabase = createSupabaseClient(url, key);
      supabaseOperations = createSupabaseOperations(supabase);
      
      const { data, error } = await supabaseOperations.select();
      if (error) {
        throw error;
      }
      
      setIsConnected(true);
      setConnectionError('');
      setCurrentView('dashboard');
      setCards(data || []);
    } catch (error) {
      setConnectionError('Failed to connect to Supabase. Please check your credentials.');
      setIsConnected(false);
    }
  };

  const handleSupabaseConnect = async (e) => {
    e.preventDefault();
    
    if (!supabaseConfig.url || !supabaseConfig.key) {
      setConnectionError('Please enter both URL and API key');
      return;
    }

    sessionStorage.setItem('supabase_config', JSON.stringify(supabaseConfig));
    await initializeSupabase(supabaseConfig.url, supabaseConfig.key);
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('supabase_config');
    setIsConnected(false);
    setSupabaseConfig({ url: '', key: '' });
    setCurrentView('setup');
    setCards([]);
  };

  const loadCards = async () => {
    if (!supabaseOperations) return;
    
    const { data, error } = await supabaseOperations.select();
    if (!error) {
      setCards(data || []);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabaseOperations) return;
    
    try {
      if (editingCard) {
        await supabaseOperations.update(editingCard.id, formData);
        setEditingCard(null);
      } else {
        await supabaseOperations.insert(formData);
      }
      
      await loadCards();
      setCurrentView('inventory');
      // RESET FORM WITH ALL COMPLETE FIELDS
      setFormData({
        date_purchased: '',
        source: 'eBay',
        seller_name: '',
        listing_link: '',
        player_card_name: '',
        year: '',
        set_name: '',
        card_type: '',
        card_number: '',
        condition_purchased: '',
        serial_number: '',
        cost: '',
        status: 'Purchased',
        grading_company: '',
        grade: '',
        graded_date: '',
        grading_cost: '',
        date_sold: '',
        selling_platform: 'eBay',
        price: '',
        photo_links: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData(card);
    setCurrentView('add');
  };

  const handleDelete = async (id) => {
    if (!supabaseOperations) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      await supabaseOperations.delete(id);
      await loadCards();
    }
  };

  const filteredCards = cards.filter(card => 
    card.player_card_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.set_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.card_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dashboardStats = {
    totalCards: cards.length,
    totalInvested: cards.reduce((sum, card) => sum + (parseFloat(card.cost) || 0), 0),
    totalRevenue: cards.filter(card => card.status === 'Sold').reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0)
  };

  // HELPER FUNCTION TO FORMAT DATES
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (!isConnected && currentView === 'setup') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '20px' }}>
        <div style={{ maxWidth: '400px', margin: '40px auto', backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <DatabaseIcon />
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>Connect to Supabase</h2>
            <p style={{ color: '#666' }}>Enter your Supabase credentials to get started</p>
          </div>

          {connectionError && (
            <div style={{ backgroundColor: '#fee', border: '1px solid #fcc', color: '#c00', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
              {connectionError}
            </div>
          )}

          <form onSubmit={handleSupabaseConnect}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>
                Supabase Project URL
              </label>
              <input
                type="url"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
                placeholder="https://your-project.supabase.co"
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>
                Anon/Public API Key
              </label>
              <input
                type={showApiKey ? "text" : "password"}
                value={supabaseConfig.key}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, key: e.target.value})}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={{ marginTop: '5px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
              >
                {showApiKey ? 'Hide' : 'Show'} API Key
              </button>
            </div>

            <button
              type="submit"
              style={{ width: '100%', backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: '500' }}
            >
              Connect to Supabase
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Card Tracking System</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => setCurrentView('dashboard')}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: currentView === 'dashboard' ? '#dbeafe' : 'transparent',
                color: currentView === 'dashboard' ? '#1d4ed8' : '#666'
              }}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('inventory')}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                border: 'none', 
                cursor: 'pointer',
                backgroundColor: currentView === 'inventory' ? '#dbeafe' : 'transparent',
                color: currentView === 'inventory' ? '#1d4ed8' : '#666'
              }}
            >
              Inventory
            </button>
            <button
              onClick={handleDisconnect}
              style={{ padding: '8px 12px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px' }}>
        {currentView === 'dashboard' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#2563eb', fontSize: '14px', margin: '0 0 5px 0' }}>Total Cards</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{dashboardStats.totalCards}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#dc2626', fontSize: '14px', margin: '0 0 5px 0' }}>Total Invested</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>${dashboardStats.totalInvested.toFixed(2)}</p>
              </div>
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3 style={{ color: '#16a34a', fontSize: '14px', margin: '0 0 5px 0' }}>Total Revenue</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>${dashboardStats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Recent Cards</h3>
              {cards.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>No cards added yet. Click "Inventory" then "Add Card" to get started!</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Card ID</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Player/Card</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Set</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px' }}>Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cards.slice(0, 5).map(card => (
                        <tr key={card.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{card.card_id}</td>
                          <td style={{ padding: '8px' }}>{card.player_card_name}</td>
                          <td style={{ padding: '8px' }}>{card.set_name}</td>
                          <td style={{ padding: '8px' }}>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: '12px', 
                              fontSize: '12px',
                              backgroundColor: card.status === 'Sold' ? '#dcfce7' : '#f3f4f6',
                              color: card.status === 'Sold' ? '#166534' : '#374151'
                            }}>
                              {card.status}
                            </span>
                          </td>
                          <td style={{ padding: '8px' }}>${parseFloat(card.cost || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'inventory' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Card Inventory</h2>
              <button
                onClick={() => setCurrentView('add')}
                style={{ 
                  padding: '10px 20px', 
                  backgroundColor: '#2563eb', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <PlusIcon /> Add Card
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by player, set, or card ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
              />
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              {filteredCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  {cards.length === 0 ? (
                    <div>
                      <p style={{ fontSize: '18px', fontWeight: '500' }}>No cards yet</p>
                      <p>Add your first card to get started!</p>
                    </div>
                  ) : (
                    <p>No cards match your search.</p>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Card ID</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Player/Card</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Card Type</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Set</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Grade</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Cost</th>
                        <th style={{ textAlign: 'left', padding: '12px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCards.map(card => (
                        <tr key={card.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{card.card_id}</td>
                          <td style={{ padding: '12px' }}>{card.player_card_name}</td>
                          <td style={{ padding: '12px' }}>{card.card_type}</td>
                          <td style={{ padding: '12px' }}>{card.set_name}</td>
                          <td style={{ padding: '12px' }}>
                            {card.grade ? (
                              <span style={{ 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                fontSize: '12px', 
                                fontWeight: 'bold',
                                backgroundColor: card.grade >= 9 ? '#dcfce7' : card.grade >= 7 ? '#fff3cd' : '#f8d7da',
                                color: card.grade >= 9 ? '#166534' : card.grade >= 7 ? '#d69e2e' : '#dc2626'
                              }}>
                                {card.grade}/10
                              </span>
                            ) : (card.grading_company || 'Raw')}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              fontSize: '12px',
                              backgroundColor: card.status === 'Sold' ? '#dcfce7' : '#f3f4f6',
                              color: card.status === 'Sold' ? '#166534' : '#374151'
                            }}>
                              {card.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>${parseFloat(card.cost || 0).toFixed(2)}</td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => handleEdit(card)}
                                style={{ padding: '4px', backgroundColor: '#dbeafe', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(card.id)}
                                style={{ padding: '4px', backgroundColor: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
                          <td style={{ padding: '12px' }}>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button
                                onClick={() => handleEdit(card)}
                                style={{ padding: '4px', backgroundColor: '#dbeafe', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <EditIcon />
                              </button>
                              <button
                                onClick={() => handleDelete(card.id)}
                                style={{ padding: '4px', backgroundColor: '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                <DeleteIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'add' && (
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
              {editingCard ? 'Edit Card' : 'Add New Card'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Purchase Information Section */}
              <div style={{ backgroundColor: '#fff3cd', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ffeaa7' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#856404' }}>💰 Purchase Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>📅 Date Purchased</label>
                    <input
                      type="date"
                      value={formData.date_purchased}
                      onChange={(e) => setFormData({...formData, date_purchased: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Source</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="eBay">eBay</option>
                      <option value="Card Show">Card Show</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Seller Name</label>
                    <input
                      type="text"
                      value={formData.seller_name}
                      onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Seller username or name"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Listing Link</label>
                    <input
                      type="url"
                      value={formData.listing_link}
                      onChange={(e) => setFormData({...formData, listing_link: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="https://ebay.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Card Details Section */}
              <div style={{ backgroundColor: '#f8f9fa', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#495057' }}>📋 Card Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Player/Card Name *</label>
                    <input
                      type="text"
                      value={formData.player_card_name}
                      onChange={(e) => setFormData({...formData, player_card_name: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Card Type</label>
                    <select
                      value={formData.card_type}
                      onChange={(e) => setFormData({...formData, card_type: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="">Select Type</option>
                      <option value="Football">Football</option>
                      <option value="Basketball">Basketball</option>
                      <option value="Baseball">Baseball</option>
                      <option value="Pokemon">Pokemon</option>
                      <option value="Magic">Magic</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Year</label>
                    <input
                      type="text"
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: e.target.value})}
                      placeholder="e.g., 2024-25"
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Set</label>
                    <input
                      type="text"
                      value={formData.set_name}
                      onChange={(e) => setFormData({...formData, set_name: e.target.value})}
                      placeholder="e.g., Panini Prizm"
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Card Number</label>
                    <input
                      type="text"
                      value={formData.card_number}
                      onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="e.g., #23"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Serial Number/Parallel</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="e.g., /99, Gold Parallel"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Condition When Purchased</label>
                    <input
                      type="text"
                      value={formData.condition_purchased}
                      onChange={(e) => setFormData({...formData, condition_purchased: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="e.g., Near Mint, Raw"
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="Purchased">Purchased</option>
                      <option value="Grading">Grading</option>
                      <option value="Selling">Selling</option>
                      <option value="Sold">Sold</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Grading Information Section */}
              <div style={{ backgroundColor: '#d4edda', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#155724' }}>🏆 Grading Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Grading Company</label>
                    <select
                      value={formData.grading_company}
                      onChange={(e) => setFormData({...formData, grading_company: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="">Not Graded</option>
                      <option value="PSA">PSA</option>
                      <option value="BGS">BGS</option>
                      <option value="SGC">SGC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Grade (1-10)</label>
                    <select
                      value={formData.grade}
                      onChange={(e) => setFormData({...formData, grade: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
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
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Graded Date</label>
                    <input
                      type="date"
                      value={formData.graded_date}
                      onChange={(e) => setFormData({...formData, graded_date: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Grading Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.grading_cost}
                      onChange={(e) => setFormData({...formData, grading_cost: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Sale Information Section */}
              <div style={{ backgroundColor: '#f8d7da', padding: '20px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '15px', color: '#721c24' }}>💸 Sale Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Date Sold</label>
                    <input
                      type="date"
                      value={formData.date_sold}
                      onChange={(e) => setFormData({...formData, date_sold: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Sale Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Selling Platform</label>
                    <select
                      value={formData.selling_platform}
                      onChange={(e) => setFormData({...formData, selling_platform: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                    >
                      <option value="eBay">eBay</option>
                      <option value="Card Show">Card Show</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Photo Links</label>
                    <input
                      type="text"
                      value={formData.photo_links}
                      onChange={(e) => setFormData({...formData, photo_links: e.target.value})}
                      style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                      placeholder="Comma-separated URLs"
                    />
                  </div>
                </div>
              </div><label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Date Sold</label>
                  <input
                    type="date"
                    value={formData.date_sold}
                    onChange={(e) => setFormData({...formData, date_sold: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Sale Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  />
                </div>
              </div>
              
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '500', marginBottom: '5px' }}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="3"
                  style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                  placeholder="Any additional notes about this card..."
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#2563eb', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  {editingCard ? 'Update Card' : 'Add Card'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setCurrentView('inventory')}
                  style={{ 
                    padding: '10px 20px', 
                    backgroundColor: '#6b7280', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '6px', 
                    cursor: 'pointer' 
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardTrackingSystem;
