/**
 * main.js — single entry point.
 *
 * Every page loads this one module. Page-specific controllers are initialised
 * only when their root element exists, so a missing container can never throw.
 */

import { initApp } from './app.js';
import { initEditor } from './editor.js';
import { initSaved } from './saved.js';

initApp();

const page = document.body.dataset.page;
if (page === 'editor') initEditor();
if (page === 'saved') initSaved();
