import React, { useState } from 'react';
import AvatarPreview from './AvatarPreview';
import { AVATAR_STYLES, SKIN_TONES, HAIRSTYLES, BACKGROUNDS } from '../constants/avatarPresets';

export default function AvatarPicker({
  styleId = 0,
  skinToneId = 0,
  hairstyleId = 0,
  backgroundId = 0,
  onChange,
  disabled = false,
}) {
  const [activeTab, setActiveTab] = useState("style");

  const numStyle = Number(styleId ?? 0);
  const numSkin = Number(skinToneId ?? 0);
  const numHair = Number(hairstyleId ?? 0);
  const numBg = Number(backgroundId ?? 0);

  const randomize = () => {
    if (disabled) return;
    const randomStyle = Math.floor(Math.random() * AVATAR_STYLES.length);
    const randomSkin = Math.floor(Math.random() * SKIN_TONES.length);
    const randomHair = Math.floor(Math.random() * HAIRSTYLES.length);
    const randomBg = Math.floor(Math.random() * BACKGROUNDS.length);
    onChange({
      avatarStyleId: randomStyle,
      skinToneId: randomSkin,
      hairstyleId: randomHair,
      backgroundId: randomBg,
    });
  };

  return (
    <div className="vart-picker-container">
      {/* Live Preview Column */}
      <div className="vart-picker-preview-col">
        <div className="vart-preview-card">
          <AvatarPreview
            styleId={numStyle}
            skinToneId={numSkin}
            hairstyleId={numHair}
            backgroundId={numBg}
            size={180}
            rounded={true}
          />
          <div className="vart-preview-meta">
            <span className="vart-preview-label">Live Preview</span>
            <button
              type="button"
              className="vart-btn-link"
              onClick={randomize}
              disabled={disabled}
            >
              🎲 Randomize
            </button>
          </div>
        </div>
      </div>

      {/* Selector Panels Column */}
      <div className="vart-picker-options-col">
        {/* Category Tabs */}
        <div className="vart-picker-tabs">
          <button
            type="button"
            className={`vart-tab-btn ${activeTab === "style" ? "active" : ""}`}
            onClick={() => setActiveTab("style")}
          >
            Style ({numStyle})
          </button>
          <button
            type="button"
            className={`vart-tab-btn ${activeTab === "skin" ? "active" : ""}`}
            onClick={() => setActiveTab("skin")}
          >
            Skin ({numSkin})
          </button>
          <button
            type="button"
            className={`vart-tab-btn ${activeTab === "hair" ? "active" : ""}`}
            onClick={() => setActiveTab("hair")}
          >
            Hair ({numHair})
          </button>
          <button
            type="button"
            className={`vart-tab-btn ${activeTab === "bg" ? "active" : ""}`}
            onClick={() => setActiveTab("bg")}
          >
            Background ({numBg})
          </button>
        </div>

        {/* Tab Content */}
        <div className="vart-tab-content">
          {/* Avatar Styles (0-5) */}
          {activeTab === "style" && (
            <div className="vart-grid-2">
              {AVATAR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`vart-option-card ${numStyle === style.id ? "selected" : ""}`}
                  onClick={() => !disabled && onChange({ avatarStyleId: style.id })}
                  disabled={disabled}
                >
                  <span className="vart-option-id">ID: {style.id}</span>
                  <span className="vart-option-name">{style.name}</span>
                  <span className="vart-option-desc">{style.description}</span>
                </button>
              ))}
            </div>
          )}

          {/* Skin Tones (0-5) */}
          {activeTab === "skin" && (
            <div className="vart-grid-3">
              {SKIN_TONES.map((skin) => (
                <button
                  key={skin.id}
                  type="button"
                  className={`vart-swatch-card ${numSkin === skin.id ? "selected" : ""}`}
                  onClick={() => !disabled && onChange({ skinToneId: skin.id })}
                  disabled={disabled}
                >
                  <span
                    className="vart-swatch-circle"
                    style={{ backgroundColor: skin.color }}
                  ></span>
                  <span className="vart-swatch-label">{skin.name}</span>
                  <span className="vart-swatch-id">ID: {skin.id}</span>
                </button>
              ))}
            </div>
          )}

          {/* Hairstyles (0-7) */}
          {activeTab === "hair" && (
            <div className="vart-grid-2">
              {HAIRSTYLES.map((hair) => (
                <button
                  key={hair.id}
                  type="button"
                  className={`vart-option-card ${numHair === hair.id ? "selected" : ""}`}
                  onClick={() => !disabled && onChange({ hairstyleId: hair.id })}
                  disabled={disabled}
                >
                  <div className="vart-option-row">
                    <span
                      className="vart-swatch-dot"
                      style={{ backgroundColor: hair.color }}
                    ></span>
                    <span className="vart-option-name">{hair.name}</span>
                  </div>
                  <span className="vart-option-id">ID: {hair.id}</span>
                </button>
              ))}
            </div>
          )}

          {/* Backgrounds (0-7) */}
          {activeTab === "bg" && (
            <div className="vart-grid-2">
              {BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  type="button"
                  className={`vart-bg-card ${numBg === bg.id ? "selected" : ""}`}
                  onClick={() => !disabled && onChange({ backgroundId: bg.id })}
                  disabled={disabled}
                >
                  <div
                    className="vart-bg-preview-box"
                    style={{ background: bg.gradient }}
                  ></div>
                  <div className="vart-bg-meta">
                    <span className="vart-option-name">{bg.name}</span>
                    <span className="vart-option-id">ID: {bg.id}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
