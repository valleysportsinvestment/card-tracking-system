import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// PHASE 1 - ADDING SAFE TEXT FIELDS BACK
let supabase = null;

const CardTrackingSystem = () => {
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '' });
  
  // EXPANDED FORM DATA - Phase 1: Adding safe text/number fields
  const [formData, setFormData] = useState({
    player_card_name: '',
    cost: '',
    source: 'eBay',
    year: '',
    set_name: '',
    status: 'Purchased',
    notes: '',
    // NEW SAFE FIELDS - Phase 1
    seller_name: '',
    listing_link: '',
    card_type: '',
    sport: '',
    card_number: '',
    condition_purchased: '',
    grading_company: '',
    serial_number: '',
    grading_cost: '',
    selling_platform: 'eBay',
    price: '',
    photo_links: ''
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
      supabase = createClient(url, key);
      const { data, error } = await supabase.from('cards').select('*').limit(1);
      if (error) throw error;
      
      setIsConnected(true);
      setConnectionError('');
      setCurrentView('dashboard');
      await loadCards();
    } catch (error) {
      setConnectionError(`Connection failed: ${error.message}`);
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
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('cards').select('*').order('created_at', { ascending: false });
      if (!error) setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const generateCardId = async () => {
    try {
      const { data, error } = await supabase.from('cards').select('card_id').order('id', { ascending: false }).limit(1);
      if (error) throw error;
      
      const lastCard = data && data.length > 0 ? data[0] : null;
      const nextNumber = lastCard ? parseInt(lastCard.card_id.replace('CARD', '')) + 1 : 1;
      return `CARD${String(nextNumber).padStart(7, '0')}`;
    } catch (error) {
      return `CARD${String(Date.now()).slice(-7)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !formData.player_card_name.trim()) {
      alert('Player/Card Name is required');
      return;
    }
    
    setIsLoading(true);
    try {
      const cardData = {
        player_card_name: formData.player_card_name.trim(),
        cost: formData.cost ? parseFloat(formData.cost) : null,
        source: formData.source,
        year: formData.year || null,
        set_name: formData.set_name || null,
        status: formData.status,
        notes: formData.notes || null,
        // NEW FIELDS - Phase 1
        seller_name: formData.seller_name || null,
        listing_link: formData.listing_link || null,
        card_type: formData.card_type || null,
        sport: formData.sport || null,
        card_number: formData.card_number || null,
        condition_purchased: formData.condition_purchased || null,
        grading_company: formData.grading_company || null,
        serial_number: formData.serial_number || null,
        grading_cost: formData.grading_cost ? parseFloat(formData.grading_cost) : null,
        selling_platform: formData.selling_platform,
        price: formData.price ? parseFloat(formData.price) : null,
        photo_links: formData.photo_links || null
      };
      
      if (editingCard) {
        const { error } = await supabase.from('cards').update(cardData).eq('id', editingCard.id);
        if (error) throw error;
        alert('Card updated successfully!');
        setEditingCard(null);
      } else {
        const cardId = await generateCardId();
        const newCardData = { ...cardData, card_id: cardId };
        const { error } = await supabase.from('cards').insert([newCardData]);
        if (error) throw error;
        alert('Card added successfully!');
      }
      
      // Reset form
      setFormData({
        player_card_name: '',
        cost: '',
        source: 'eBay',
        year: '',
        set_name: '',
        status: 'Purchased',
        notes: '',
        seller_name: '',
        listing_link: '',
        card_type: '',
        sport: '',
        card_number: '',
        condition_purchased: '',
        grading_company: '',
        serial_number: '',
        grading_cost: '',
        selling_platform: 'eBay',
        price: '',
        photo_links: ''
      });
      
      await loadCards();
      setCurrentView('inventory');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setFormData({
      player_card_name: card.player_card_name || '',
      cost: card.cost || '',
      source: card.source || 'eBay',
      year: card.year || '',
      set_name: card.set_name || '',
      status: card.status || 'Purchased',
      notes: card.notes || '',
      seller_name: card.seller_name || '',
      listing_link: card.listing_link || '',
      card_type: card.card_type || '',
      sport: card.sport || '',
      card_number: card.card_number || '',
      condition_purchased: card.condition_purchased || '',
      grading_company: card.grading_company || '',
      serial_number: card.serial_number || '',
      grading_cost: card.grading_cost || '',
      selling_platform: card.selling_platform || 'eBay',
      price: card.price || '',
      photo_links: card.photo_links || ''
    });
    setCurrentView('add');
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const { error } = await supabase.from('cards').delete().eq('id', id);
        if (error) throw error;
        alert('Card deleted successfully!');
        await loadCards();
      } catch (error) {
        alert(`Error deleting card: ${error.message}`);
      }
    }
  };

  const filteredCards = cards.filter(card => 
    card.player_card_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.set_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.card_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
          <h1 className="text-2xl font-bold mb-6">Connect to Supabase</h1>
          
          {connectionError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {connectionError}
            </div>
          )}

          <form onSubmit={handleSupabaseConnect} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supabase URL</label>
              <input
                type="url"
                value={supabaseConfig.url}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
                placeholder="https://your-project.supabase.co"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">API Key</label>
              <input
                type="password"
                value={supabaseConfig.key}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, key: e.target.value})}
                placeholder="Your anon key"
                className="w-full p-2 border rounded"
                required
              />
            </div>
            
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Card Tracking System</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-2 rounded ${currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('inventory')}
              className={`px-3 py-2 rounded ${currentView === 'inventory' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              Inventory
            </button>
            <button
              onClick={() => setCurrentView('add')}
              className={`px-3 py-2 rounded ${currentView === 'add' ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
            >
              Add Card
            </button>
            <button onClick={handleDisconnect} className="text-red-600">Disconnect</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-blue-600 text-sm font-medium">Total Cards</h3>
                <p className="text-2xl font-bold">{cards.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-red-600 text-sm font-medium">Total Invested</h3>
                <p className="text-2xl font-bold">
                  ${cards.reduce((sum, card) => sum + (parseFloat(card.cost) || 0) + (parseFloat(card.grading_cost) || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-green-600 text-sm font-medium">Total Revenue</h3>
                <p className="text-2xl font-bold">
                  ${cards.filter(card => card.status === 'Sold').reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Cards</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Card ID</th>
                      <th className="text-left p-2">Player/Card</th>
                      <th className="text-left p-2">Set</th>
                      <th className="text-left p-2">Cost</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cards.slice(0, 5).map(card => (
                      <tr key={card.id} className="border-b">
                        <td className="p-2 font-mono text-xs">{card.card_id}</td>
                        <td className="p-2">{card.player_card_name}</td>
                        <td className="p-2">{card.set_name}</td>
                        <td className="p-2">${parseFloat(card.cost || 0).toFixed(2)}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            card.status === 'Sold' ? 'bg-green-100 text-green-800' :
                            card.status === 'Selling' ? 'bg-yellow-100 text-yellow-800' :
                            card.status === 'Grading' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {card.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {currentView === 'inventory' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Card Inventory</h2>
              <button
                onClick={() => setCurrentView('add')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Card
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by player, set, or card ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Card ID</th>
                      <th className="text-left p-3">Player/Card</th>
                      <th className="text-left p-3">Set</th>
                      <th className="text-left p-3">Sport</th>
                      <th className="text-left p-3">Cost</th>
                      <th className="text-left p-3">Price</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCards.map(card => (
                      <tr key={card.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-mono text-xs">{card.card_id}</td>
                        <td className="p-3">{card.player_card_name}</td>
                        <td className="p-3">{card.set_name}</td>
                        <td className="p-3">{card.sport}</td>
                        <td className="p-3">${parseFloat(card.cost || 0).toFixed(2)}</td>
                        <td className="p-3">{card.price ? `$${parseFloat(card.price).toFixed(2)}` : 'N/A'}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            card.status === 'Sold' ? 'bg-green-100 text-green-800' :
                            card.status === 'Selling' ? 'bg-yellow-100 text-yellow-800' :
                            card.status === 'Grading' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {card.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(card)}
                              className="px-2 py-1 text-blue-600 hover:bg-blue-100 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(card.id)}
                              className="px-2 py-1 text-red-600 hover:bg-red-100 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredCards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No cards found. {cards.length === 0 ? 'Add your first card!' : 'Try a different search.'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'add' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">{editingCard ? 'Edit Card' : 'Add New Card'}</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  🚀 <strong>Phase 1 Expansion:</strong> Added seller info, grading details, and sale tracking - NO DATE FIELDS yet!
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Card Info */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">Basic Card Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Player/Card Name *</label>
                      <input
                        type="text"
                        value={formData.player_card_name}
                        onChange={(e) => setFormData({...formData, player_card_name: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Michael Jordan"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., 2024-25"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Set</label>
                      <input
                        type="text"
                        value={formData.set_name}
                        onChange={(e) => setFormData({...formData, set_name: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Panini Prizm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Type</label>
                      <input
                        type="text"
                        value={formData.card_type}
                        onChange={(e) => setFormData({...formData, card_type: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Sports, Pokemon, Magic"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Sport</label>
                      <input
                        type="text"
                        value={formData.sport}
                        onChange={(e) => setFormData({...formData, sport: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Football, Basketball"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input
                        type="text"
                        value={formData.card_number}
                        onChange={(e) => setFormData({...formData, card_number: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., #23"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Serial Number/Parallel</label>
                      <input
                        type="text"
                        value={formData.serial_number}
                        onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., /99, Gold Parallel"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Condition When Purchased</label>
                      <input
                        type="text"
                        value={formData.condition_purchased}
                        onChange={(e) => setFormData({...formData, condition_purchased: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="e.g., Near Mint, Raw"
                      />
                    </div>
                  </div>
                </div>

                {/* Purchase Info */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">Purchase Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cost}
                        onChange={(e) => setFormData({...formData, cost: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Source</label>
                      <select
                        value={formData.source}
                        onChange={(e) => setFormData({...formData, source: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="eBay">eBay</option>
                        <option value="Card Show">Card Show</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Seller Name</label>
                      <input
                        type="text"
                        value={formData.seller_name}
                        onChange={(e) => setFormData({...formData, seller_name: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="Seller username or name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Listing Link</label>
                      <input
                        type="url"
                        value={formData.listing_link}
                        onChange={(e) => setFormData({...formData, listing_link: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="https://ebay.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Grading Info */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">Grading Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Grading Company</label>
                      <select
                        value={formData.grading_company}
                        onChange={(e) => setFormData({...formData, grading_company: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="">Not Graded</option>
                        <option value="PSA">PSA</option>
                        <option value="BGS">BGS</option>
                        <option value="SGC">SGC</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Grading Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.grading_cost}
                        onChange={(e) => setFormData({...formData, grading_cost: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Sale Info */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium mb-3">Sale Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="Purchased">Purchased</option>
                        <option value="Grading">Grading</option>
                        <option value="Selling">Selling</option>
                        <option value="Sold">Sold</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Sale Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Selling Platform</label>
                      <select
                        value={formData.selling_platform}
                        onChange={(e) => setFormData({...formData, selling_platform: e.target.value})}
                        className="w-full p-2 border rounded-lg"
                      >
                        <option value="eBay">eBay</option>
                        <option value="Card Show">Card Show</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Photo Links</label>
                      <input
                        type="text"
                        value={formData.photo_links}
                        onChange={(e) => setFormData({...formData, photo_links: e.target.value})}
