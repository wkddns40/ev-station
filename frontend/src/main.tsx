import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Evstation from './Evstation';

const container = document.getElementById('root');
if (!container) throw new Error('root element not found');
ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <Evstation />
  </React.StrictMode>,
);
