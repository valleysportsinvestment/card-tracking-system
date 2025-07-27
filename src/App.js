import React from 'react';

function App() {
  return React.createElement('div', { style: { padding: '20px' } }, 
    React.createElement('h1', null, 'CLEAN BUILD WORKING'),
    React.createElement('p', null, 'If you see this, the app is fixed!')
  );
}

export default App;
