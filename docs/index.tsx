import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AliveScope } from 'react-activation';
import Docs from './docs';

const root = createRoot(document.getElementById('docs'));
root.render(
  <AliveScope>
    <BrowserRouter>
      <Docs />
    </BrowserRouter>
  </AliveScope>,
);
