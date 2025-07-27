import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

let supabase = null;

const CardTrackingSystem = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [supabaseConfig, setSupabaseConfig] = useState({ url: '', key: '' });

  const handleConnect = async (e) => {
    e.preventDefault();
    try {
      supabase = createClient(supabaseConfig.url, supabaseConfig.key);
      const { data, error } = await supabase.from('cards').select('*').limit(1);
      if (error) throw error;
      setIsConnected(true);
    } catch (error) {
      alert('Connection failed: ' + error.message);
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <h1>Card Tracking System</h1>
        <form onSubmit={handleConnect}>
          <div style={{ marginBottom: '10px' }}>
            <label>Supabase URL:</label>
            <input
              type="url"
              value={supabaseConfig.url}
              onChange={(e) => setSupabaseConfig({...supabaseConfig, url: e.target.value})}
              style={{ width: '100%', padding: '5px' }}
              required
            />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>API Key:</label>
            <input
              type="password"
              value={supabaseConfig.key}
              onChange={(e) => setSupabaseConfig({...supabaseConfig, key: e.target.value})}
              style={{ width: '100%', padding: '5px' }}
              required
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white' }}>
            Connect
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>🎉 App is Working!</h1>
      <p>Connection successful. Ready to add fields back gradually.</p>
    </div>
  );
};

export default CardTrackingSystem;
