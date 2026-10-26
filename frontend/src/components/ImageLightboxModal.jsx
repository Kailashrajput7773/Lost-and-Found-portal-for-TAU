import React, { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

const ImageLightboxModal = ({ imageUrl, altText, onClose }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!imageUrl) return null;

  const zoomIn = () => setScale((s) => Math.min(s + 0.3, 3));
  const zoomOut = () => setScale((s) => Math.max(s - 0.3, 0.6));
  const rotate = () => setRotation((r) => (r + 90) % 360);

  return (
    <div className="lightbox-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Photo View Zoom">
      <div className="lightbox-controls" onClick={(e) => e.stopPropagation()}>
        <span className="lightbox-title">{altText || 'Item Photo'}</span>
        <div className="lightbox-buttons">
          <button type="button" className="lightbox-btn" onClick={zoomIn} title="Zoom In" aria-label="Zoom in">
            <ZoomIn size={18} />
          </button>
          <button type="button" className="lightbox-btn" onClick={zoomOut} title="Zoom Out" aria-label="Zoom out">
            <ZoomOut size={18} />
          </button>
          <button type="button" className="lightbox-btn" onClick={rotate} title="Rotate" aria-label="Rotate image">
            <RotateCw size={18} />
          </button>
          <button type="button" className="lightbox-btn lightbox-close" onClick={onClose} title="Close" aria-label="Close photo view">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="lightbox-image-container" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt={altText || 'Zoomed item view'}
          className="lightbox-image"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.2s ease'
          }}
        />
      </div>
    </div>
  );
};

export default ImageLightboxModal;
