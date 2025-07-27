import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Simple icon components
const PlusIcon = () => <span className="text-lg">+</span>;
const SearchIcon = () => <span className="text-lg">🔍</span>;
const EditIcon = () => <span className="text-sm">✏️</span>;
const DeleteIcon = () => <span className="text-sm">🗑️</span>;
const DatabaseIcon = () => <span className="text-2xl">💾</span>;
const PackageIcon = () => <span className="text-2xl">📦</span>;
const DollarIcon = () => <span className="text-2xl">💰</span>;
const TrendingIcon = () => <span className="text-2xl">📈</span>;
const ChartIcon = () => <span className="text-2xl">📊</span>;
const EyeIcon = () => <span className="text-lg">👁️</span>;
const EyeOffIcon = () => <span className="text-lg">🙈</span>;

let supabase = null;

const CardTrackingSystem = () => {
  const [cards, setCards] = useState([]);
  const [currentView, setCurrentView] = useState('setup');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    key: ''
  });

  // Super minimal form - NO date fields for now
  const [formData, setFormData] = useState({
    player_card_name: '',
    cost: '',
    source: 'eBay',
    year: '',
    set_name: '',
    status: 'Purchased',
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
      supabase = createClient(url, key);
      
      // Test connection
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      setIsConnected(true);
      setConnectionError('');
      setCurrentView('dashboard');
      await loadCards();
    } catch (error) {
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
      console.error('Supabase connection error:', error);
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
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setCards(data || []);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const generateCardId = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('card_id')
        .order('id', { ascending: false })
        .limit(1);
      
      if (error) {
        throw error;
      }
      
      const lastCard = data && data.length > 0 ? data[0] : null;
      const nextNumber = lastCard 
        ? parseInt(lastCard.card_id.replace('CARD', '')) + 1 
        : 1;
      
      return `CARD${String(nextNumber).padStart(7, '0')}`;
    } catch (error) {
      console.error('Error generating card ID:', error);
      return `CARD${String(Date.now()).slice(-7)}`;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    
    setIsLoading(true);
    
    try {
      if (!formData.player_card_name.trim()) {
        alert('Player/Card Name is required');
        setIsLoading(false);
        return;
      }

      // Create a clean data object with NO date fields
      const cardData = {
        player_card_name: formData.player_card_name.trim(),
        source: formData.source,
        year: formData.year || null,
        set_name: formData.set_name || null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        status: formData.status,
        notes: formData.notes || null
      };
      
      if (editingCard) {
        // Update existing card
        const { data, error } = await supabase
          .from('cards')
          .update(cardData)
          .eq('id', editingCard.id)
          .select();
        
        if (error) {
          throw error;
        }
        
        alert('Card updated successfully!');
        setEditingCard(null);
      } else {
        // Insert new card
        const cardId = await generateCardId();
        const newCardData = {
          ...cardData,
          card_id: cardId
        };
        
        console.log('Inserting card data:', newCardData); // Debug log
        
        const { data, error } = await supabase
          .from('cards')
          .insert([newCardData])
          .select();
        
        if (error) {
          throw error;
        }
        
        alert('Card added successfully!');
      }
      
      // Reset form and reload
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
      console.error('Error saving card:', error);
      alert(`Error saving card: ${error.message}`);
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
      notes: card.notes || ''
    });
    setCurrentView('add');
  };

  const handleDelete = async (id) => {
    if (!supabase) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        const { error } = await supabase
          .from('cards')
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        alert('Card deleted successfully!');
        await loadCards();
      } catch (error) {
        console.error('Error deleting card:', error);
        alert(`Error deleting card: ${error.message}`);
      }
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
    totalRevenue: cards.filter(card => card.status === 'Sold').reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0),
    totalProfit: cards.filter(card => card.status === 'Sold').reduce((sum, card) => {
      const revenue = parseFloat(card.price) || 0;
      const totalCost = parseFloat(card.cost) || 0;
      return sum + (revenue - totalCost);
    }, 0)
  };

  const renderSetupScreen = () => (
    <div className="max-w-md mx-auto mt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4"><DatabaseIcon /></div>
          <h2 className="text-2xl font-bold text-gray-900">Connect to Supabase</h2>
          <p className="text-gray-600 mt-2">Enter your Supabase credentials to get started</p>
        </div>

        {connectionError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {connectionError}
          </div>
        )}

        <form onSubmit={handleSupabaseConnect} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Supabase Project URL
            </label>
            <input
              type="url"
              value={supabaseConfig.url}
              onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
              placeholder="https://your-project.supabase.co"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anon/Public API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={supabaseConfig.key}
                onChange={(e) => setSupabaseConfig({...supabaseConfig, key: e.target.value})}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium"
          >
            Connect to Supabase
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Quick Setup:</h3>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Go to supabase.com → Create account</li>
            <li>2. Create new project</li>
            <li>3. Go to Settings → API</li>
            <li>4. Copy URL and anon key</li>
            <li>5. Run the SQL script (see README)</li>
          </ol>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Cards</p>
              <p className="text-2xl font-bold text-blue-800">{dashboardStats.totalCards}</p>
            </div>
            <PackageIcon />
          </div>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-600 text-sm font-medium">Total Invested</p>
              <p className="text-2xl font-bold text-red-800">${dashboardStats.totalInvested.toFixed(2)}</p>
            </div>
            <DollarIcon />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-green-800">${dashboardStats.totalRevenue.toFixed(2)}</p>
            </div>
            <TrendingIcon />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg border ${dashboardStats.totalProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${dashboardStats.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>Total Profit</p>
              <p className={`text-2xl font-bold ${dashboardStats.totalProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                ${dashboardStats.totalProfit.toFixed(2)}
              </p>
            </div>
            <ChartIcon />
          </div>
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
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Cost</th>
              </tr>
            </thead>
            <tbody>
              {cards.slice(0, 5).map(card => (
                <tr key={card.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-mono text-xs">{card.card_id}</td>
                  <td className="p-2">{card.player_card_name}</td>
                  <td className="p-2">{card.set_name}</td>
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
                  <td className="p-2">${parseFloat(card.cost || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {cards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="mx-auto mb-4"><PackageIcon /></div>
            <p className="text-lg font-medium">No cards yet</p>
            <p className="text-sm">Add your first card to get started!</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCardForm = () => (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">
        {editingCard ? 'Edit Card' : 'Add New Card'}
      </h2>
      
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-sm text-yellow-800">
          📝 <strong>Simplified Version:</strong> Date fields temporarily removed to ensure reliability. 
          We'll add them back once basic functionality is working!
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
              <option value="Other">Other</option>
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
            placeholder="Any special notes about this card..."
          />
        </div>
        
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : (editingCard ? 'Update Card' : 'Add Card')}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingCard(null);
              setCurrentView('inventory');
              setFormData({
                player_card_name: '',
                cost: '',
                source: 'eBay',
                year: '',
                set_name: '',
                status: 'Purchased',
                notes: ''
              });
            }}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Card Inventory</h2>
        <button
          onClick={() => setCurrentView('add')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <PlusIcon />
          Add Card
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <SearchIcon />
        <input
          type="text"
          placeholder="Search by player, set, or card ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 border rounded-lg"
        />
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Card ID</th>
                <th className="text-left p-3">Player/Card</th>
                <th className="text-left p-3">Year</th>
                <th className="text-left p-3">Set</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Cost</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(card => (
                <tr key={card.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{card.card_id}</td>
                  <td className="p-3">{card.player_card_name}</td>
                  <td className="p-3">{card.year}</td>
                  <td className="p-3">{card.set_name}</td>
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
                  <td className="p-3">${parseFloat(card.cost || 0).toFixed(2)}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(card)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
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
        
        {filteredCards.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {cards.length === 0 ? (
              <div>
                <div className="mx-auto mb-4"><PackageIcon /></div>
                <p className="text-lg font-medium">No cards yet</p>
                <p className="text-sm">Add your first card to get started!</p>
              </div>
            ) : (
              <p>No cards match your search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Card Tracking System</h1>
            {isConnected && (
              <div className="flex items-center space-x-4">
                <nav className="flex space-x-4">
                  <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'dashboard' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('inventory')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'inventory' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Inventory
                  </button>
                </nav>
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                >
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected && currentView === 'setup' && renderSetupScreen()}
        {isConnected && currentView === 'dashboard' && renderDashboard()}
        {isConnected && currentView === 'inventory' && renderInventory()}
        {isConnected && currentView === 'add' && renderCardForm()}
      </div>
    </div>
  );
};

export default CardTrackingSystem;
