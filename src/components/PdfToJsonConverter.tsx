import React, { useState, useRef, useEffect } from 'react';
import {
  UploadIcon,
  DownloadIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  RefreshCwIcon,
  FileIcon,
  Sparkles,
  Cpu,
  Key,
  Copy,
  Settings,
  XIcon
} from 'lucide-react';

interface PdfToJsonConverterProps {
  isDarkMode: boolean;
}

export default function PdfToJsonConverter({ isDarkMode }: PdfToJsonConverterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [parserMode, setParserMode] = useState<'sentence' | 'metadata' | 'gemini'>('sentence');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('VITE_GEMINI_API_KEY') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [jsonResult, setJsonResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save API key to localStorage when updated
  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('VITE_GEMINI_API_KEY', apiKey);
    } else {
      localStorage.removeItem('VITE_GEMINI_API_KEY');
    }
  }, [apiKey]);

  const loadPdfJs = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      setProgressText('Loading PDF engine...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve((window as any).pdfjsLib);
      };
      script.onerror = (err) => reject(new Error('Failed to load PDF engine. Check internet connection.'));
      document.head.appendChild(script);
    });
  };

  const loadMammoth = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).mammoth) {
        resolve((window as any).mammoth);
        return;
      }
      setProgressText('Loading Word Document parser...');
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = () => {
        resolve((window as any).mammoth);
      };
      script.onerror = (err) => reject(new Error('Failed to load Word Document engine. Check internet connection.'));
      document.head.appendChild(script);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const isPdf = droppedFile.type === "application/pdf" || droppedFile.name.endsWith('.pdf');
      const isDocx = droppedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || droppedFile.name.endsWith('.docx');
      if (isPdf || isDocx) {
        setFile(droppedFile);
        setError(null);
        setJsonResult(null);
      } else {
        setError("Only PDF and Word Document (.docx) files are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isPdf = selectedFile.type === "application/pdf" || selectedFile.name.endsWith('.pdf');
      const isDocx = selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || selectedFile.name.endsWith('.docx');
      if (isPdf || isDocx) {
        setFile(selectedFile);
        setError(null);
        setJsonResult(null);
      } else {
        setError("Only PDF and Word Document (.docx) files are supported.");
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const copyToClipboard = () => {
    if (!jsonResult) return;
    navigator.clipboard.writeText(JSON.stringify(jsonResult, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    if (!jsonResult || !file) return;
    const blob = new Blob([JSON.stringify(jsonResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    let originalName = file.name;
    if (file.name.endsWith('.pdf')) {
      originalName = file.name.substring(0, file.name.length - 4);
    } else if (file.name.endsWith('.docx')) {
      originalName = file.name.substring(0, file.name.length - 5);
    }
    a.download = `${originalName}_extracted.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setJsonResult(null);
    setError(null);
    setProgress(0);
    setProgressText('');
    setIsProcessing(false);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    setProgress(10);
    setProgressText('Preparing file...');

    try {
      const isWord = file.name.endsWith('.docx');
      let fullText = '';

      if (isWord) {
        setProgress(25);
        setProgressText('Loading Word Document engine...');
        const mammoth = await loadMammoth();

        setProgress(45);
        setProgressText('Extracting Word document text...');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        fullText = result.value;

        setProgress(75);
      } else {
        // 1. Load PDF.js
        const pdfjs = await loadPdfJs();
        setProgress(25);
        setProgressText('Reading PDF metadata...');

        // 2. Read File as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        setProgress(40);
        setProgressText('Parsing PDF layout...');

        // 3. Extract text content
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const numPages = pdf.numPages;
        
        for (let i = 1; i <= numPages; i++) {
          setProgress(Math.round(40 + (i / numPages) * 35));
          setProgressText(`Extracting page ${i} of ${numPages}...`);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
      }

      setProgress(80);
      setProgressText('Structuring JSON data...');

      if (parserMode === 'gemini') {
        if (!apiKey.trim()) {
          throw new Error('Gemini API key is required for AI extraction mode.');
        }
        setProgressText('Sending to Gemini AI for structural mapping...');
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { 
                    text: `Analyze the following document text extracted from a file. 
Identify the document type (e.g., Invoice, Purchase Order, Receipt, Log Sheet, Report, Table, Resume, Academic Paper, Vendor details).
Extract all key fields, entities, tables, dates, numbers, names, contact details, amounts, and metadata.
Extract every single line and structural data exactly as it appears.
Provide the output strictly as a structured JSON object matching the details found. Do not include markdown code fence wrappers, just the raw JSON.

DOCUMENT TEXT:
${fullText}` 
                  }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json",
            }
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini API returned status ${response.status}`);
        }

        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!jsonText) {
          throw new Error('Gemini did not return structured JSON. Please check key validity or try local mode.');
        }

        try {
          const parsed = JSON.parse(jsonText.trim());
          setJsonResult(parsed);
        } catch (jsonErr) {
          // If not strict JSON, try clean up
          const cleanText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
          setJsonResult(JSON.parse(cleanText));
        }
      } else if (parserMode === 'metadata') {
        // Local heuristic mode
        const result = parseTextToStructuredJson(fullText, file.name, file.size);
        setJsonResult(result);
      } else {
        // Sentence Segmenter (Python script logic)
        let output: Array<{ text: string; page: number; indication: string }> = [];
        
        if (isWord) {
          const paragraphs = fullText.split(/\r?\n/);
          paragraphs.forEach((p) => {
            const processed = parseTextToPythonSpec(p, 1);
            output = [...output, ...processed];
          });
        } else {
          // PDF file parsing: we parse page by page, sort coordinates, and process
          const pdfjs = await loadPdfJs();
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          const numPages = pdf.numPages;
          
          for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Sort elements by Y coordinate descending, then X coordinate ascending
            const items = textContent.items.map((item: any) => ({
              str: item.str || '',
              x: item.transform?.[4] || 0,
              y: item.transform?.[5] || 0
            })).filter((item: any) => item.str.trim());
            
            items.sort((a: any, b: any) => {
              if (Math.abs(a.y - b.y) > 5) {
                return b.y - a.y;
              }
              return a.x - b.x;
            });
            
            const pageText = items.map((item: any) => item.str).join(' ');
            const processed = parseTextToPythonSpec(pageText, i);
            output = [...output, ...processed];
          }
        }
        
        setJsonResult(output);
      }

      setProgress(100);
      setProgressText('Conversion successful!');
      setTimeout(() => {
        setIsProcessing(false);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during conversion.');
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const removeTrailingNumber = (text: string): string => {
    return text.replace(/\s*\d+\s*$/, "");
  };

  const parseTextToPythonSpec = (text: string, pageNumber: number) => {
    let cleaned = removeTrailingNumber(text);
    cleaned = cleaned.replace(/\r\n/g, " ").replace(/\r/g, " ").replace(/\n/g, " ");
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    // Split on sentence-ending dots (not decimals) or bullets
    const parts = cleaned.split(/(?<!\d)(?<=\.)\s+|(?=\s*•)/);
    
    const output: Array<{ text: string; page: number; indication: string }> = [];
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) {
        output.push({
          text: trimmed,
          page: pageNumber,
          indication: "all"
        });
      }
    }
    return output;
  };

  const parseTextToStructuredJson = (text: string, fileName: string, fileSize: number) => {
    const lines = text.split('\n');
    
    // Extract emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = Array.from(new Set(text.match(emailRegex) || []));
    
    // Extract phone numbers
    const phoneRegex = /\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phoneNumbers = Array.from(new Set(text.match(phoneRegex) || []));
    
    // Extract dates
    const dateRegex = /\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b|\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4}\b/gi;
    const dates = Array.from(new Set(text.match(dateRegex) || []));
    
    // Extract currency amounts
    const currencyRegex = /(?:\$|€|£|¥)\s?\d{1,9}(?:,\d{3})*(?:\.\d{2})?/g;
    const currencyAmounts = Array.from(new Set(text.match(currencyRegex) || []));

    // Try to find key-value labels
    const keyValues: Record<string, string> = {};
    const kvRegex = /(?:invoice\s*num(?:ber)?|invoice\s*id|po\s*num(?:ber)?|order\s*num(?:ber)?|reference|ref\s*num(?:ber)?|date|total|due\s*date|amount\s*due|vendor|client|customer)\s*[:=-]\s*([^\n]+)/gi;
    let match;
    while ((match = kvRegex.exec(text)) !== null) {
      const matchedText = match[0];
      const parts = matchedText.split(/[:=-]/);
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      if (key && val && val.length < 100) {
        keyValues[key] = val;
      }
    }

    // Detect simple tabular blocks
    const tables: Array<{ header: string[]; rows: Record<string, string>[] }> = [];
    let currentTableRows: string[][] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip page delimiters
      if (trimmed.startsWith('--- Page')) continue;
      
      const columns = trimmed.split(/\s{2,}|\t/).map(c => c.trim()).filter(Boolean);
      if (columns.length >= 3) {
        currentTableRows.push(columns);
      } else {
        if (currentTableRows.length >= 2) {
          const header = currentTableRows[0];
          const rows = currentTableRows.slice(1).map(row => {
            const rowObj: Record<string, string> = {};
            header.forEach((h, idx) => {
              rowObj[h] = row[idx] || '';
            });
            return rowObj;
          });
          tables.push({ header, rows });
        }
        currentTableRows = [];
      }
    }
    
    if (currentTableRows.length >= 2) {
      const header = currentTableRows[0];
      const rows = currentTableRows.slice(1).map(row => {
        const rowObj: Record<string, string> = {};
        header.forEach((h, idx) => {
          rowObj[h] = row[idx] || '';
        });
        return rowObj;
      });
      tables.push({ header, rows });
    }

    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const characterCount = text.length;

    // Detect document type heuristics
    let docType = 'General Document';
    const lowerText = text.toLowerCase();
    if (lowerText.includes('invoice') || lowerText.includes('bill to') || lowerText.includes('amount due')) {
      docType = 'Invoice / Billing Document';
    } else if (lowerText.includes('purchase order') || lowerText.includes('po number')) {
      docType = 'Purchase Order';
    } else if (lowerText.includes('resume') || lowerText.includes('curriculum vitae') || lowerText.includes('education') && lowerText.includes('experience')) {
      docType = 'Resume / CV';
    } else if (tables.length > 0) {
      docType = 'Tabular Report';
    }

    const nonEmptyLines = lines.map(line => line.trim()).filter(Boolean);

    return {
      documentType: docType,
      metadata: {
        fileName,
        fileSizeBytes: fileSize,
        fileSizeFormatted: (fileSize / 1024).toFixed(1) + ' KB',
        extractedAt: new Date().toISOString(),
        wordCount,
        characterCount,
      },
      documentStructure: {
        totalLinesCount: lines.length,
        nonEmptyLinesCount: nonEmptyLines.length,
        lines: lines.map((line, idx) => ({
          lineIndex: idx + 1,
          content: line
        }))
      },
      entities: {
        emails,
        phoneNumbers,
        dates,
        currencyAmounts,
      },
      extractedFields: keyValues,
      detectedTables: tables,
      rawTextSummary: text.length > 500 ? text.substring(0, 500) + '...' : text
    };
  };

  return (
    <div className="space-y-10">
      {/* Header Banner */}
      <div className={`p-8 lg:p-10 rounded-[2rem] shadow-sm border relative overflow-hidden transition-all duration-300 ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-6 lg:gap-8">
            <div className={`p-6 rounded-3xl shadow-2xl shrink-0 transition-all ${
              isDarkMode ? 'bg-[#005CB9] shadow-blue-900/10' : 'bg-[#005CB9] shadow-blue-100'
            }`}>
              <Cpu className="w-10 h-10 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                  isDarkMode ? 'bg-blue-950/40 text-blue-400' : 'bg-blue-50 text-[#005CB9]'
                }`}>Utility tool</span>
              </div>
              <h1 className={`text-3xl lg:text-4xl font-bold tracking-tight uppercase ${isDarkMode ? 'text-slate-100' : 'text-[#0D1E4C]'}`}>PDF & Word to JSON</h1>
              <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">
                Convert raw PDF sheets, Word documents (.docx), and invoices into structured API-ready JSON
              </p>
            </div>
          </div>

          {/* Quick toggle settings */}
          <button
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer select-none ${
              showApiKeyInput || apiKey
                ? 'bg-[#005CB9] text-white border-[#005CB9] shadow-lg shadow-blue-100'
                : (isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50')
            }`}
          >
            <Settings size={14} />
            {apiKey ? 'AI API Configured' : 'Configure AI Key'}
          </button>
        </div>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
          isDarkMode ? 'bg-slate-800/40' : 'bg-slate-50'
        }`} />
      </div>

      {/* API Key configuration input */}
      {showApiKeyInput && (
        <div className={`p-6 rounded-[2rem] border shadow-sm transition-all duration-300 ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={`text-sm font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-205' : 'text-[#0D1E4C]'}`}>
              AI Engine API Settings
            </h3>
            <button onClick={() => setShowApiKeyInput(false)} className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
              <XIcon size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-450 mb-4">
            Input a **Gemini API Key** to unlock deep semantic parsing. If configured, we'll run files through the `gemini-2.5-flash` model to build perfectly mapped layouts. Your key remains local to your browser session.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="Enter Gemini API Key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`w-full pl-12 pr-6 py-3.5 border rounded-2xl text-xs font-bold focus:outline-none transition-all ${
                  isDarkMode 
                    ? 'bg-slate-850 border-slate-700 text-slate-100 focus:ring-4 focus:ring-slate-800 placeholder:text-slate-500' 
                    : 'bg-white border-slate-200 text-slate-800 focus:ring-4 focus:ring-blue-50 placeholder:text-slate-400'
                }`}
              />
            </div>
            {apiKey && (
              <button
                onClick={() => { setApiKey(''); localStorage.removeItem('VITE_GEMINI_API_KEY'); }}
                className="px-6 py-3.5 border border-red-200 text-red-500 hover:bg-red-50 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
              >
                Clear Key
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Conversion Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Drag & Drop + Options */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <h2 className={`text-md font-bold uppercase tracking-wider mb-6 ${isDarkMode ? 'text-slate-200' : 'text-[#0D1E4C]'}`}>
              1. Source Document
            </h2>

            {/* Drag & Drop Container */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] select-none ${
                dragActive
                  ? (isDarkMode ? 'border-blue-500 bg-blue-950/20' : 'border-[#005CB9] bg-blue-50/30')
                  : (isDarkMode ? 'border-slate-800 bg-slate-850/50 hover:bg-slate-850/80 hover:border-slate-700' : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300')
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
              />
              
              {file ? (
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                    isDarkMode ? 'bg-blue-950 text-blue-400' : 'bg-blue-50 text-[#005CB9]'
                  }`}>
                    <FileIcon size={32} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold truncate max-w-[240px] mx-auto ${isDarkMode ? 'text-slate-100' : 'text-[#0D1E4C]'}`}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto ${
                    isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <UploadIcon size={28} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      Drag & Drop PDF / DOCX
                    </p>
                    <p className="text-[10px] text-slate-455 mt-1 uppercase tracking-widest font-mono">
                      or click to browse local files
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold uppercase tracking-wide">
                <AlertCircleIcon size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Method Select */}
            <div className="mt-8 space-y-4">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block font-mono">
                Extraction Engine Mode
              </label>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setParserMode('sentence')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    parserMode === 'sentence'
                      ? 'border-[#005CB9] bg-blue-50/20 text-[#005CB9] shadow-inner shadow-blue-50'
                      : (isDarkMode ? 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#005CB9]')
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${parserMode === 'sentence' ? 'bg-[#005CB9] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Cpu size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Sentence Segmenter (Python Spec)</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Splits on dots/bullets, keeps bullet symbols, removes page footers</span>
                  </div>
                </button>

                <button
                  onClick={() => setParserMode('metadata')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    parserMode === 'metadata'
                      ? 'border-[#005CB9] bg-blue-50/20 text-[#005CB9] shadow-inner shadow-blue-50'
                      : (isDarkMode ? 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#005CB9]')
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${parserMode === 'metadata' ? 'bg-[#005CB9] text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FileIcon size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">Metadata & Tables Mapper</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Extracts emails, phones, numbers, and structured tables</span>
                  </div>
                </button>

                <button
                  onClick={() => setParserMode('gemini')}
                  className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    parserMode === 'gemini'
                      ? 'border-[#005CB9] bg-blue-50/20 text-[#005CB9] shadow-inner shadow-blue-50'
                      : (isDarkMode ? 'bg-slate-850 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-[#005CB9]')
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${parserMode === 'gemini' ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider block">AI Semantic Extractor</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Deep contextual AI translation mapping using Gemini API</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Run Button */}
            <div className="mt-8">
              <button
                onClick={processFile}
                disabled={!file || isProcessing}
                className={`w-full py-4 rounded-[1.25rem] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer ${
                  !file || isProcessing
                    ? (isDarkMode ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed')
                    : 'bg-[#005CB9] text-white hover:bg-[#004A99] hover:scale-[1.02] shadow-2xl shadow-blue-200'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCwIcon size={16} className="animate-spin" />
                    Converting...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Extract and Convert
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code viewer & downloads */}
        <div className="lg:col-span-7">
          <div className={`p-8 rounded-[2.5rem] border shadow-sm h-full flex flex-col transition-all duration-300 ${
            isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h2 className={`text-md font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-200' : 'text-[#0D1E4C]'}`}>
                2. Structured JSON Output
              </h2>
              
              {jsonResult && (
                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      copied 
                        ? 'bg-teal-50 border-teal-200 text-teal-600'
                        : (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-755 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100')
                    }`}
                  >
                    <Copy size={12} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  
                  <button
                    onClick={downloadJson}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#005CB9] border border-[#005CB9] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[#004A99] cursor-pointer shadow-lg shadow-blue-100"
                  >
                    <DownloadIcon size={12} />
                    Download JSON
                  </button>

                  <button
                    onClick={handleReset}
                    className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-350 hover:bg-slate-755 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-550 hover:bg-slate-100'
                    }`}
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>

            {/* Output code workspace */}
            <div className="flex-1 min-h-[380px] relative rounded-3xl overflow-hidden border border-slate-700/10 font-mono text-xs flex">
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-md ${
                  isDarkMode ? 'bg-slate-950/80' : 'bg-white/80'
                }`}>
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-[#005CB9] rounded-full animate-spin mb-4" />
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-slate-200' : 'text-[#0D1E4C]'}`}>
                    {progressText}
                  </p>
                  <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-[#005CB9] rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              {jsonResult ? (
                <pre className={`w-full h-full p-6 overflow-y-auto max-h-[500px] text-[11px] font-mono leading-relaxed select-text ${
                  isDarkMode ? 'bg-slate-950 text-emerald-400' : 'bg-slate-900 text-teal-400'
                }`}>
                  <code>
                    {JSON.stringify(jsonResult, null, 2)}
                  </code>
                </pre>
              ) : (
                <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center select-none ${
                  isDarkMode ? 'bg-slate-950/20' : 'bg-slate-50/30'
                }`}>
                  <FileIcon size={40} className="text-slate-300 mb-3" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Output JSON Schema
                  </p>
                  <p className="text-[10px] text-slate-450 mt-1 max-w-[280px]">
                    Configure your source PDF on the left and click convert to generate API payload models.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
