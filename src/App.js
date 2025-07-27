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
let supabaseOperations = null;

const createSupabaseClient = (url, key) => {
  return createClient(url, key);
};

// Helper function to clean data before sending to database
const cleanDataForDatabase = (data) => {
  const cleaned = { ...data };
  
  // Convert empty strings to null for date fields
  const dateFields = ['date_purchased', 'submission_date', 'date_sold'];
  dateFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  // Convert empty strings to null for numeric fields
  const numericFields = ['cost', 'grade', 'price', 'grading_cost', 'grading_time_days', 'inventory_time_days', 'profit_loss'];
  numericFields.forEach(field => {
    if (cleaned[field] === '') {
      cleaned[field] = null;
    }
  });
  
  return cleaned;
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
      ...cleanDataForDatabase(card),
      card_id: `CARD${String(nextNumber).padStart(7, '0')}`
    };
    
    const { data, error } = await client
      .from('cards')
      .insert([cardWithId])
      .select();
    return { data, error };
  },
  
  async update(id, updates) {
    const cleanedUpdates = cleanDataForDatabase(updates);
    const { data, error } = await client
      .from('cards')
      .update(cleanedUpdates)
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const [supabaseConfig, setSupabaseConfig] = useState({
    url: '',
    key: ''
  });

  const [formData, setFormData] = useState({
    date_purchased: '',
    source: 'eBay',
    listing_link: '',
    seller_name: '',
    player_card_name: '',
    year: '',
    set_name: '',
    cost: '',
    status: 'Purchased',
    submission_date: '',
    grade: '',
    grading_time_days: '',
    date_sold: '',
    selling_platform: 'eBay',
    price: '',
    inventory_time_days: '',
    card_type: '',
    sport: '',
    card_number: '',
    condition_purchased: '',
    grading_company: '',
    serial_number: '',
    grading_cost: '',
    notes: '',
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
    if (!supabaseOperations) return;
    
    const { data, error } = await supabaseOperations.select();
    if (!error) {
      setCards(data || []);
    } else {
      console.error('Error loading cards:', error);
    }
  };

  const calculateDerivedFields = (card) => {
    const updates = { ...card };
    
    if (card.submission_date && card.grade) {
      const submissionDate = new Date(card.submission_date);
      const today = new Date();
      updates.grading_time_days = Math.floor((today - submissionDate) / (1000 * 60 * 60 * 24));
    }
    
    if (card.date_purchased && card.date_sold) {
      const purchaseDate = new Date(card.date_purchased);
      const soldDate = new Date(card.date_sold);
      updates.inventory_time_days = Math.floor((soldDate - purchaseDate) / (1000 * 60 * 60 * 24));
    }
    
    if (card.price && card.cost) {
      const revenue = parseFloat(card.price) || 0;
      const totalCost = (parseFloat(card.cost) || 0) + (parseFloat(card.grading_cost) || 0);
      updates.profit_loss = revenue - totalCost;
    }
    
    return updates;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabaseOperations) return;
    
    const cardData = calculateDerivedFields(formData);
    
    try {
      if (editingCard) {
        const { error } = await supabaseOperations.update(editingCard.id, cardData);
        if (!error) {
          setEditingCard(null);
          await loadCards();
          setCurrentView('inventory');
        } else {
          console.error('Error updating card:', error);
          alert('Error updating card: ' + error.message);
        }
      } else {
        const { error } = await supabaseOperations.insert(cardData);
        if (!error) {
          setShowAddForm(false);
          await loadCards();
          setCurrentView('inventory');
          alert('Card added successfully!');
        } else {
          console.error('Error adding card:', error);
          alert('Error adding card: ' + error.message);
        }
      }
      
      // Reset form
      setFormData({
        date_purchased: '',
        source: 'eBay',
        listing_link: '',
        seller_name: '',
        player_card_name: '',
        year: '',
        set_name: '',
        cost: '',
        status: 'Purchased',
        submission_date: '',
        grade: '',
        grading_time_days: '',
        date_sold: '',
        selling_platform: 'eBay',
        price: '',
        inventory_time_days: '',
        card_type: '',
        sport: '',
        card_number: '',
        condition_purchased: '',
        grading_company: '',
        serial_number: '',
        grading_cost: '',
        notes: '',
        photo_links: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form: ' + error.message);
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    // Convert null values back to empty strings for the form
    const formattedCard = { ...card };
    Object.keys(formattedCard).forEach(key => {
      if (formattedCard[key] === null) {
        formattedCard[key] = '';
      }
    });
    setFormData(formattedCard);
    setCurrentView('add');
  };

  const handleDelete = async (id) => {
    if (!supabaseOperations) return;
    
    if (window.confirm('Are you sure you want to delete this card?')) {
      const { error } = await supabaseOperations.delete(id);
      if (!error) {
        await loadCards();
        alert('Card deleted successfully!');
      } else {
        console.error('Error deleting card:', error);
        alert('Error deleting card: ' + error.message);
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
    totalInvested: cards.reduce((sum, card) => sum + (parseFloat(card.cost) || 0) + (parseFloat(card.grading_cost) || 0), 0),
    totalRevenue: cards.filter(card => card.status === 'Sold').reduce((sum, card) => sum + (parseFloat(card.price) || 0), 0),
    totalProfit: cards.filter(card => card.status === 'Sold').reduce((sum, card) => {
      const revenue = parseFloat(card.price) || 0;
      const totalCost = (parseFloat(card.cost) || 0) + (parseFloat(card.grading_cost) || 0);
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
          <h3 className="text-sm font-medium text-blue-800 mb-2">How to find your credentials:</h3>
          <ol className="text-xs text-blue-700 space-y-1">
            <li>1. Go to your Supabase dashboard</li>
            <li>2. Select your project</li>
            <li>3. Go to Settings → API</li>
            <li>4. Copy the "Project URL" and "anon public" key</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Need to create the database table?</h3>
          <p className="text-xs text-gray-600 mb-2">Run this SQL in your Supabase SQL Editor:</p>
          <button
            onClick={() => setCurrentView('sql-setup')}
            className="text-blue-600 hover:text-blue-800 text-xs underline"
          >
            View SQL Setup Script
          </button>
        </div>
      </div>
    </div>
  );

  const renderSqlSetup = () => (
    <div className="max-w-4xl mx-auto mt-10">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Database Setup</h2>
          <button
            onClick={() => setCurrentView('setup')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Setup
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Copy and paste this SQL into your Supabase SQL Editor to create the cards table:
          </p>
        </div>

        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          <pre>
{`-- Create the cards table
CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT UNIQUE NOT NULL,
  date_purchased DATE,
  source TEXT,
  listing_link TEXT,
  seller_name TEXT,
  player_card_name TEXT NOT NULL,
  year TEXT,
  set_name TEXT,
  cost DECIMAL(10,2),
  status TEXT DEFAULT 'Purchased',
  submission_date DATE,
  grade INTEGER,
  grading_time_days INTEGER,
  date_sold DATE,
  selling_platform TEXT,
  price DECIMAL(10,2),
  inventory_time_days INTEGER,
  card_type TEXT,
  sport TEXT,
  card_number TEXT,
  condition_purchased TEXT,
  grading_company TEXT,
  serial_number TEXT,
  grading_cost DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  notes TEXT,
  photo_links TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON cards
    FOR ALL USING (auth.role() = 'authenticated');`}
          </pre>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              const sqlText = `-- Create the cards table
CREATE TABLE cards (
  id BIGSERIAL PRIMARY KEY,
  card_id TEXT UNIQUE NOT NULL,
  date_purchased DATE,
  source TEXT,
  listing_link TEXT,
  seller_name TEXT,
  player_card_name TEXT NOT NULL,
  year TEXT,
  set_name TEXT,
  cost DECIMAL(10,2),
  status TEXT DEFAULT 'Purchased',
  submission_date DATE,
  grade INTEGER,
  grading_time_days INTEGER,
  date_sold DATE,
  selling_platform TEXT,
  price DECIMAL(10,2),
  inventory_time_days INTEGER,
  card_type TEXT,
  sport TEXT,
  card_number TEXT,
  condition_purchased TEXT,
  grading_company TEXT,
  serial_number TEXT,
  grading_cost DECIMAL(10,2),
  profit_loss DECIMAL(10,2),
  notes TEXT,
  photo_links TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON cards
    FOR ALL USING (auth.role() = 'authenticated');`;
              navigator.clipboard.writeText(sqlText);
              alert('SQL copied to clipboard!');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Copy SQL
          </button>
          <button
            onClick={() => setCurrentView('setup')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
          >
            Done
          </button>
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
                <th className="text-left p-2">Current Value</th>
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
                  <td className="p-2">${card.status === 'Sold' ? parseFloat(card.price || 0).toFixed(2) : 'N/A'}</td>
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
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Date Purchased</label>
            <input
              type="date"
              value={formData.date_purchased}
              onChange={(e) => setFormData({...formData, date_purchased: e.target.value})}
              className="w-full p-2 border rounded-lg"
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
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Listing Link</label>
            <input
              type="url"
              value={formData.listing_link}
              onChange={(e) => setFormData({...formData, listing_link: e.target.value})}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Player/Card Name *</label>
            <input
              type="text"
              value={formData.player_card_name}
              onChange={(e) => setFormData({...formData, player_card_name: e.target.value})}
              className="w-full p-2 border rounded-lg"
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
            <label className="block text-sm font-medium mb-1">Card Type/Category</label>
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
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Serial Number/Parallel</label>
            <input
              type="text"
              value={formData.serial_number}
              onChange={(e) => setFormData({...formData, serial_number: e.target.value})}
              className="w-full p-2 border rounded-lg"
