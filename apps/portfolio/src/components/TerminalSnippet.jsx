import React, { useState } from 'react';
import { Terminal, Copy, Check, Layers, Play } from 'lucide-react';
import { terminalSnippets } from '../data/portfolioData';

export default function TerminalSnippet() {
  const [activeTab, setActiveTab] = useState('terraform');
  const [copied, setCopied] = useState(false);

  const snippet = terminalSnippets[activeTab];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignora erro
    }
  };

  return (
    <div className="terminal-wrapper">
      <div className="terminal-box">
        {/* Terminal Header */}
        <div className="terminal-header">
          <div className="terminal-controls">
            <span className="control-dot close"></span>
            <span className="control-dot minimize"></span>
            <span className="control-dot maximize"></span>
          </div>

          <div className="terminal-user-badge">
            <Terminal size={14} />
            <span>guilherme@cloud-primary:~</span>
          </div>

          {/* Command Tabs */}
          <div className="terminal-tabs">
            <button
              type="button"
              className={`terminal-tab ${activeTab === 'terraform' ? 'active' : ''}`}
              onClick={() => setActiveTab('terraform')}
            >
              Terraform IaC
            </button>
            <button
              type="button"
              className={`terminal-tab ${activeTab === 'docker' ? 'active' : ''}`}
              onClick={() => setActiveTab('docker')}
            >
              Docker Compose
            </button>
            <button
              type="button"
              className={`terminal-tab ${activeTab === 'cicd' ? 'active' : ''}`}
              onClick={() => setActiveTab('cicd')}
            >
              GitHub Actions
            </button>
          </div>

          <button
            type="button"
            className="terminal-copy-btn"
            onClick={handleCopy}
            title="Copiar comando"
            aria-label="Copiar comando"
          >
            {copied ? <Check size={14} className="copied-icon" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Terminal Body */}
        <div className="terminal-body">
          <div className="terminal-prompt-line">
            <span className="prompt-symbol">$</span>
            <span className="prompt-command">{snippet.command}</span>
          </div>
          <pre className="terminal-output">{snippet.output}</pre>
        </div>
      </div>
    </div>
  );
}
