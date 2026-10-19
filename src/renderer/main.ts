import './style.css';
import { mountReader } from './reader';
import type { ReaderAPI } from '../shared/reader';
declare global { interface Window { reader: ReaderAPI } }
mountReader(document, window.reader);
