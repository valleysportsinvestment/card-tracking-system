// UPDATED VERSION - NO DATE FIELDS
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const CardTrackingSystem = () => {
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '' });
  const [formData, setFormData] = useState({
    player_card_name: '',
    cost: '',
    source: 'eBay',
    year: '',
    set_name: '',
    status: 'Purchased',
    notes: ''
  });

  const handleSupabaseConnect = async (e) => {
    e.preventDefault();
    try {
      supabase = createClient(supabaseConfig.url, supabaseConfig.key);
      const { data, error } = await supabase.from('cards').select('*').limit(1);
      if (error) throw error;
      
      setIsConnected(true);
      setConnectionError('');
      setCurrentView('dashboard');
      loadCards();
    } catch (error) {
      setConnectionError(`Connection failed: ${error.message}`);
    }
  };

  const loadCards = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('cards').select('*');
      if (!error) setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase || !formData.player_card_name.trim()) return;
    
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
        card_id: `CARD${String(Date.now()).slice(-7)}`
      };
      
      const { error } = await supabase.from('cards').insert([cardData]);
      if (error) throw error;
      
      alert('Card added successfully!');
      setFormData({
        player_card_name: '',
        cost: '',
        source: 'eBay',
        year: '',
        set_name: '',
        status: 'Purchased',
        notes: ''
      });
      
      await loadCards();
      setCurrentView('inventory');
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <p>Total Cards: {cards.length}</p>
              <p>Total Cost: ${cards.reduce((sum, card) => sum + (parseFloat(card.cost) || 0), 0).toFixed(2)}</p>
            </div>
          </div>
        )}

        {currentView === 'inventory' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Inventory</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Card ID</th>
                    <th className="text-left p-3">Player/Card</th>
                    <th className="text-left p-3">Set</th>
                    <th className="text-left p-3">Cost</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cards.map(card => (
                    <tr key={card.id} className="border-b">
                      <td className="p-3 font-mono text-xs">{card.card_id}</td>
                      <td className="p-3">{card.player_card_name}</td>
                      <td className="p-3">{card.set_name}</td>
                      <td className="p-3">${parseFloat(card.cost || 0).toFixed(2)}</td>
                      <td className="p-3">{card.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {cards.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No cards yet. Add your first card!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'add' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Add New Card</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                <p className="text-sm text-green-800">
                  ✅ <strong>No Date Fields!</strong> This version should work without any errors.
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows="3"
                    placeholder="Any notes about this card..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Add Card'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CardTrackingSystem;
