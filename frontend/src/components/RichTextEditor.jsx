import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  FiBold, FiItalic, FiUnderline,
  FiAlignLeft, FiAlignCenter, FiAlignRight, FiAlignJustify,
  FiList
} from 'react-icons/fi';

/* ── tiny icons not in react-icons ── */
const IconOrderedList= () => <span className="text-xs leading-none font-semibold">1.</span>;
const IconBullet1    = () => <span className="text-base leading-none">•</span>;
const IconBullet2    = () => <span className="text-base leading-none">◦</span>;
const IconBullet3    = () => <span className="text-base leading-none">▪</span>;
const IconBullet4    = () => <span className="text-sm leading-none">➤</span>;
const IconBullet5    = () => <span className="text-sm leading-none">★</span>;
const IconStrike     = () => <span className="text-xs font-semibold line-through leading-none">S</span>;

/* ────────────────────────────────────────────────
   Convert editor HTML ↔ stored plain-ish format
   We store raw HTML in the DB for fidelity
   ──────────────────────────────────────────────── */
export const htmlToText = (html) => html || '';
export const textToHtml = (text) => text || '';

/* ────────────────────────────────────────────────
   Toolbar Button
   ──────────────────────────────────────────────── */
const Btn = ({ onClick, title, active, children, danger }) => (
  <button
    type="button"
    onMouseDown={(e) => { e.preventDefault(); onClick(); }}
    title={title}
    className={`
      flex items-center justify-center w-8 h-8 rounded text-sm transition-all duration-100
      ${active
        ? 'bg-green-600 text-white shadow-inner'
        : danger
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-700 hover:bg-green-100'
      }
    `}
  >
    {children}
  </button>
);

const Sep = () => <div className="w-px h-6 bg-green-200 mx-0.5 self-center" />;

/* ────────────────────────────────────────────────
   Main Component
   ──────────────────────────────────────────────── */
const RichTextEditor = ({ value, onChange, placeholder = 'Enter text…', minHeight = 220 }) => {
  const editorRef = useRef(null);
  const lastHtml  = useRef(value || '');
  const [activeFormats, setActiveFormats] = useState({});
  const [bulletMenuOpen, setBulletMenuOpen] = useState(false);

  /* Sync value → DOM only when it changes externally */
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (el.innerHTML !== (value || '')) {
      el.innerHTML = value || '';
      lastHtml.current = value || '';
    }
  }, [value]);

  /* Emit changes upward */
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html !== lastHtml.current) {
      lastHtml.current = html;
      onChange(html);
    }
  }, [onChange]);

  /* Track which formats are active at cursor */
  const updateActiveFormats = useCallback(() => {
    setActiveFormats({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikeThrough'),
      justifyLeft:   document.queryCommandState('justifyLeft'),
      justifyCenter: document.queryCommandState('justifyCenter'),
      justifyRight:  document.queryCommandState('justifyRight'),
      justifyFull:   document.queryCommandState('justifyFull'),
    });
  }, []);

  /* execCommand helpers */
  const cmd = useCallback((command, value = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
    updateActiveFormats();
  }, [handleInput, updateActiveFormats]);

  const insertBulletList = useCallback((style) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const bullets = { disc: '• ', circle: '◦ ', square: '▪ ', arrow: '➤ ', star: '★ ' };
    const prefix  = bullets[style] || '• ';

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // If multiline selection, prefix each line
    const selectedText = range.toString();
    if (selectedText.includes('\n')) {
      const lines = selectedText.split('\n').map(l => prefix + l);
      const node  = document.createTextNode(lines.join('\n'));
      range.deleteContents();
      range.insertNode(node);
    } else {
      // Insert at start of current line
      const textNode = document.createTextNode(prefix);
      range.collapse(true);
      // Move to start of line
      const blockNode = range.startContainer;
      const newRange  = document.createRange();
      newRange.setStart(blockNode, 0);
      newRange.collapse(true);
      newRange.insertNode(textNode);
      // Move cursor after prefix
      newRange.setStartAfter(textNode);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    handleInput();
    setBulletMenuOpen(false);
  }, [handleInput]);

  const insertOrderedList = useCallback(() => {
    cmd('insertOrderedList');
  }, [cmd]);

  const setFontSize = useCallback((size) => {
    cmd('fontSize', size);
  }, [cmd]);

  /* Paste as plain text to avoid external styling */
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const isEmptyHtml = (html) => !html || html === '<br>' || html.replace(/<[^>]+>/g, '').trim() === '';

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #B8D8C8' }}>

      {/* ── Toolbar ── */}
      <div
        className="flex flex-wrap items-center gap-0.5 px-2 py-1.5"
        style={{ background: 'rgba(220,248,228,0.7)', borderBottom: '1px solid #B8D8C8' }}
      >
        {/* Text style */}
        <Btn onClick={() => cmd('bold')}         title="Bold"          active={activeFormats.bold}>        <FiBold />      </Btn>
        <Btn onClick={() => cmd('italic')}       title="Italic"        active={activeFormats.italic}>      <FiItalic />    </Btn>
        <Btn onClick={() => cmd('underline')}    title="Underline"     active={activeFormats.underline}>   <FiUnderline /> </Btn>
        <Btn onClick={() => cmd('strikeThrough')}title="Strikethrough" active={activeFormats.strikethrough}><IconStrike />  </Btn>

        <Sep />

        {/* Font size */}
        <select
          onMouseDown={e => e.stopPropagation()}
          onChange={e => { editorRef.current?.focus(); cmd('fontSize', e.target.value); e.target.value = ''; }}
          defaultValue=""
          className="h-8 text-xs border border-green-200 rounded bg-white text-gray-700 px-1 focus:outline-none focus:ring-1 focus:ring-green-400"
          title="Font size"
        >
          <option value="" disabled>Size</option>
          <option value="1">8pt</option>
          <option value="2">10pt</option>
          <option value="3">12pt</option>
          <option value="4">14pt</option>
          <option value="5">18pt</option>
          <option value="6">24pt</option>
          <option value="7">36pt</option>
        </select>

        <Sep />

        {/* Alignment */}
        <Btn onClick={() => cmd('justifyLeft')}    title="Align Left"    active={activeFormats.justifyLeft}>   <FiAlignLeft />    </Btn>
        <Btn onClick={() => cmd('justifyCenter')}  title="Align Center"  active={activeFormats.justifyCenter}> <FiAlignCenter />  </Btn>
        <Btn onClick={() => cmd('justifyRight')}   title="Align Right"   active={activeFormats.justifyRight}>  <FiAlignRight />   </Btn>
        <Btn onClick={() => cmd('justifyFull')}    title="Justify"       active={activeFormats.justifyFull}>   <FiAlignJustify /> </Btn>

        <Sep />

        {/* Lists */}
        <Btn onClick={insertOrderedList} title="Numbered List"><IconOrderedList /></Btn>

        {/* Bullet dropdown */}
        <div className="relative">
          <Btn onClick={() => setBulletMenuOpen(v => !v)} title="Bullet List style">
            <FiList />
          </Btn>
          {bulletMenuOpen && (
            <div
              className="absolute top-9 left-0 z-50 rounded-lg shadow-lg py-1 min-w-[140px]"
              style={{ background: 'white', border: '1px solid #B8D8C8' }}
            >
              {[
                { style: 'disc',   icon: '•', label: 'Bullet (•)'    },
                { style: 'circle', icon: '◦', label: 'Circle (◦)'    },
                { style: 'square', icon: '▪', label: 'Square (▪)'    },
                { style: 'arrow',  icon: '➤', label: 'Arrow (➤)'     },
                { style: 'star',   icon: '★', label: 'Star (★)'      },
              ].map(({ style, icon, label }) => (
                <button
                  key={style}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); insertBulletList(style); }}
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-700 hover:bg-green-50 transition-colors"
                >
                  <span className="text-base w-4 text-center">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Sep />

        {/* Indent / Outdent */}
        <Btn onClick={() => cmd('indent')}   title="Increase Indent"><span className="text-xs font-mono">→</span></Btn>
        <Btn onClick={() => cmd('outdent')}  title="Decrease Indent"><span className="text-xs font-mono">←</span></Btn>

        <Sep />

        {/* Clear formatting */}
        <Btn onClick={() => cmd('removeFormat')} title="Clear Formatting" danger>
          <span className="text-xs font-semibold">Tx</span>
        </Btn>
      </div>

      {/* ── Editor area ── */}
      <div className="relative">
        {isEmptyHtml(value) && (
          <div
            className="absolute top-3 left-4 text-gray-400 text-sm pointer-events-none select-none"
            style={{ zIndex: 1 }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={updateActiveFormats}
          onMouseUp={updateActiveFormats}
          onSelect={updateActiveFormats}
          onPaste={handlePaste}
          onClick={() => setBulletMenuOpen(false)}
          style={{
            minHeight,
            padding: '12px 16px',
            outline: 'none',
            background: 'rgba(255,255,255,0.85)',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#1a1a1a',
          }}
          className="rich-editor"
        />
      </div>

      {/* ── Editor global styles ── */}
      <style>{`
        .rich-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 0.5em 0; color: inherit; }
        .rich-editor h2 { font-size: 1.2rem; font-weight: 700; margin: 0.4em 0; color: inherit; }
        .rich-editor h3 { font-size: 1rem;   font-weight: 700; margin: 0.3em 0; color: inherit; }
        .rich-editor p  { margin: 0.25em 0; }
        .rich-editor ul { list-style: disc;    padding-left: 1.5em; margin: 0.3em 0; }
        .rich-editor ol { list-style: decimal; padding-left: 1.5em; margin: 0.3em 0; }
        .rich-editor li { margin: 0.15em 0; }
        .rich-editor b, .rich-editor strong { font-weight: 700; }
        .rich-editor i, .rich-editor em     { font-style: italic; }
        .rich-editor u  { text-decoration: underline; }
        .rich-editor s  { text-decoration: line-through; }
        .rich-editor:focus { background: rgba(255,255,255,0.98) !important; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;