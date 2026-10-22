import './style.css';
import { mountReader } from './reader';
import type { ReaderAPI } from '../shared/reader';
import { createBrowserAPI } from './browser-api';
declare global { interface Window { reader?: ReaderAPI } }
// Browsers expose the element with id="reader" as window.reader too.
const api = typeof window.reader?.openTextFile === 'function' ? window.reader : createBrowserAPI(document);
mountReader(document, api);
