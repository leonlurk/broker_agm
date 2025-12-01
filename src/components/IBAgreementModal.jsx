import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, FileText, CheckCircle, AlertCircle, Download, Eraser, PenTool } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useTranslation } from 'react-i18next';

const IBAgreementModal = ({ isOpen, onClose, onAccept, agreementContent }) => {
  const { t } = useTranslation('affiliates');
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Signature canvas state
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setHasScrolled(false);
      setAgreedToTerms(false);
      setHasSignature(false);
      // Clear canvas when modal opens
      setTimeout(() => {
        clearSignature();
      }, 100);
    }
  }, [isOpen]);

  // Initialize canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Set canvas size to match display size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * 2; // For retina displays
      canvas.height = rect.height * 2;
      ctx.scale(2, 2);

      // Set drawing style
      ctx.strokeStyle = '#3b82f6'; // Blue color
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Fill with white background
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }
  }, [isOpen]);

  const getPosition = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const pos = getPosition(e);
    setLastPosition(pos);
    setIsDrawing(true);
  }, [getPosition]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastPosition.x, lastPosition.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    setLastPosition(pos);
    setHasSignature(true);
  }, [isDrawing, lastPosition, getPosition]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
  }, []);

  // Track scrolling to ensure user reads the agreement
  const handleScroll = (e) => {
    const element = e.target;
    const scrolledToBottom =
      element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (scrolledToBottom && !hasScrolled) {
      setHasScrolled(true);
    }
  };

  // Get signature as base64 image
  const getSignatureData = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }, []);

  const handleAccept = async () => {
    if (!agreedToTerms || !hasScrolled || !hasSignature) return;

    setIsAccepting(true);
    try {
      const signatureData = getSignatureData();
      await onAccept(signatureData);
    } catch (error) {
      console.error('Error accepting IB agreement:', error);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#333] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#333] bg-gradient-to-r from-[#232323] to-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <FileText className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {t('ib.agreement.title')}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {t('ib.agreement.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isAccepting}
            className="p-2 hover:bg-[#333] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Agreement Content - Scrollable */}
        <div
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a] custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#444 #1a1a1a'
          }}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-white mb-4 mt-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-bold text-blue-400 mb-3 mt-5" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-semibold text-gray-200 mb-2 mt-4" {...props} />,
                p: ({node, ...props}) => <p className="text-gray-300 mb-3 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside text-gray-300 mb-3 space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="ml-4" {...props} />,
                strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                hr: ({node, ...props}) => <hr className="border-[#333] my-6" {...props} />,
              }}
            >
              {agreementContent}
            </ReactMarkdown>
          </div>

          {/* Scroll Indicator */}
          {!hasScrolled && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a] to-transparent pt-8 pb-2 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">
                  {t('ib.agreement.scrollIndicator')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Actions */}
        <div className="border-t border-[#333] bg-[#232323] p-6 space-y-4">
          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center mt-0.5">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                disabled={!hasScrolled || isAccepting}
                className="w-5 h-5 rounded border-2 border-gray-600 bg-[#1a1a1a] checked:bg-blue-600 checked:border-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              />
              {agreedToTerms && (
                <CheckCircle className="absolute w-5 h-5 text-white pointer-events-none" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm ${agreedToTerms ? 'text-white' : 'text-gray-400'} group-hover:text-white transition-colors`}>
                {t('ib.agreement.checkbox')}
              </p>
              {!hasScrolled && (
                <p className="text-xs text-yellow-400 mt-1">
                  {t('ib.agreement.mustRead')}
                </p>
              )}
            </div>
          </label>

          {/* Digital Signature Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">
                  {t('ib.agreement.signature.title', 'Firma Digital')}
                </span>
                {hasSignature && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
              </div>
              <button
                onClick={clearSignature}
                disabled={isAccepting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2d2d2d] hover:bg-[#3a3a3a] text-gray-400 hover:text-white rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <Eraser className="w-4 h-4" />
                {t('ib.agreement.signature.clear', 'Limpiar')}
              </button>
            </div>

            <p className="text-xs text-gray-400">
              {t('ib.agreement.signature.instruction', 'Dibuja tu firma con el mouse o dedo en el recuadro de abajo')}
            </p>

            {/* Signature Canvas */}
            <div className={`relative border-2 rounded-xl overflow-hidden transition-colors ${
              hasSignature
                ? 'border-green-500/50'
                : 'border-dashed border-gray-600 hover:border-blue-500/50'
            }`}>
              <canvas
                ref={canvasRef}
                className="w-full h-24 cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasSignature && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-500 text-sm">
                    {t('ib.agreement.signature.placeholder', 'Firma aqui...')}
                  </span>
                </div>
              )}
            </div>

            {!hasSignature && agreedToTerms && (
              <p className="text-xs text-yellow-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {t('ib.agreement.signature.required', 'Debes firmar para continuar')}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isAccepting}
              className="flex-1 px-6 py-3 bg-[#2d2d2d] hover:bg-[#3a3a3a] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('ib.agreement.buttons.cancel')}
            </button>
            <button
              onClick={handleAccept}
              disabled={!agreedToTerms || !hasScrolled || !hasSignature || isAccepting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 flex items-center justify-center gap-2"
            >
              {isAccepting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('ib.agreement.buttons.processing')}
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {t('ib.agreement.buttons.accept')}
                </>
              )}
            </button>
          </div>

          {/* Legal Notice */}
          <div className="pt-3 border-t border-[#333]">
            <p className="text-xs text-gray-500 text-center">
              {t('ib.agreement.legal')}
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default IBAgreementModal;
