import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface ShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="shortcuts-dialog-overlay" onClick={onClose}>
      <div className="shortcuts-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>
        
        <div className="dialog-content">
          <div className="shortcuts-section">
            <h4>Navigation Shortcuts</h4>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Left</span>
              </div>
              <div className="shortcut-description">Previous frame</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Right</span>
              </div>
              <div className="shortcut-description">Next frame</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Space</span>
              </div>
              <div className="shortcut-description">Play/pause</div>
            </div>
          </div>
          
          <div className="shortcuts-section">
            <h4>Tool Shortcuts</h4>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">1</span>
              </div>
              <div className="shortcut-description">Select mode</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">2</span>
              </div>
              <div className="shortcut-description">Draw mode</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">3</span>
              </div>
              <div className="shortcut-description">Vertex edit mode</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">4</span>
              </div>
              <div className="shortcut-description">Edge edit mode</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Esc</span>
              </div>
              <div className="shortcut-description">Cancel drawing</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Del</span>
              </div>
              <div className="shortcut-description">Delete selected mask</div>
            </div>
          </div>
          
          <div className="shortcuts-section">
            <h4>Editing Shortcuts</h4>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Ctrl</span>
                <span className="shortcut-key">Z</span>
              </div>
              <div className="shortcut-description">Undo</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Ctrl</span>
                <span className="shortcut-key">Y</span>
              </div>
              <div className="shortcut-description">Redo</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                <span className="shortcut-key">Alt</span> + Click
              </div>
              <div className="shortcut-description">Delete vertex (in vertex mode)</div>
            </div>
            <div className="shortcut-item">
              <div className="shortcut-keys">
                Double-click
              </div>
              <div className="shortcut-description">Complete mask (in drawing mode)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShortcutsDialog;