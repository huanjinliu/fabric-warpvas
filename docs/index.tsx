import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import Docs from './docs';

const root = createRoot(document.getElementById('docs'));
root.render(
  <HashRouter>
    <Docs />
  </HashRouter>
);
