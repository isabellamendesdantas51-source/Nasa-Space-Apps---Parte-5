import React, { useEffect, useState } from 'react';
import { Check, Code2, Copy, Download, X } from 'lucide-react';

interface ShaderCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShaderCodeModal: React.FC<ShaderCodeModalProps> = ({ isOpen, onClose }) => {
  const [sourceCode, setSourceCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || sourceCode) return;
    fetch('/artemis-orion-3d-glsl.html')
      .then((res) => res.text())
      .then((txt) => setSourceCode(txt))
      .catch(() => setSourceCode('<!-- Erro ao carregar o código 3D standalone. -->'));
  }, [isOpen, sourceCode]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!sourceCode) return;
    try {
      await navigator.clipboard.writeText(sourceCode);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-[#090f1d] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Código 3D Standalone · HTML5 + CSS3 + JavaScript (Three.js + GLSL)
              </h2>
              <p className="text-xs text-slate-400">
                Os mesmos shaders GLSL (propulsão, plasma de reentrada e oceano) executam ao vivo no simulador e podem ser baixados em arquivo único.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-md hover:bg-slate-800 cursor-pointer"
            aria-label="Fechar janela de código 3D"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-slate-400 font-mono-tabular">
              Arquivo: artemis-orion-3d-glsl.html · WebGL + Three.js r170 + GLSL Shaders
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-cyan-400" />
                    Copiar Código
                  </>
                )}
              </button>
              <a
                href="/artemis-orion-3d-glsl.html"
                download="artemis-orion-3d-glsl.html"
                className="px-3 py-1.5 text-xs font-semibold bg-cyan-400 hover:bg-cyan-300 text-slate-950 rounded-md flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar HTML5 + GLSL
              </a>
            </div>
          </div>

          <pre className="flex-1 overflow-auto bg-[#050811] border border-slate-800 rounded-lg p-4 text-[11px] leading-relaxed font-mono-tabular text-cyan-100/90">
            <code>{sourceCode || 'Carregando código HTML5 + CSS3 + JavaScript (Three.js + GLSL)...'}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
