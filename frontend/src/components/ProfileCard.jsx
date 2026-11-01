import React from 'react';
import AvatarPreview from './AvatarPreview';
import { BOT_CHAIN } from '../constants/network';
import { AVATAR_STYLES, SKIN_TONES, HAIRSTYLES, BACKGROUNDS } from '../constants/avatarPresets';

export default function ProfileCard({
  profile,
  address,
  isOwner = false,
  onEditClick,
}) {
  if (!profile) return null;

  const numStyle = Number(profile.avatarStyleId ?? 0);
  const numSkin = Number(profile.skinToneId ?? 0);
  const numHair = Number(profile.hairstyleId ?? 0);
  const numBg = Number(profile.backgroundId ?? 0);
  const numCreated = Number(profile.createdAt ?? 0);

  const formattedDate = numCreated
    ? new Date(numCreated * 1000).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Genesis";

  const styleName = AVATAR_STYLES[numStyle]?.name || `Style #${numStyle}`;
  const skinName = SKIN_TONES[numSkin]?.name || `Skin #${numSkin}`;
  const hairName = HAIRSTYLES[numHair]?.name || `Hair #${numHair}`;
  const bgName = BACKGROUNDS[numBg]?.name || `BG #${numBg}`;

  return (
    <div className="vart-card vart-profile-card">
      <div className="vart-profile-card-header">
        <div className="vart-profile-avatar-wrap">
          <AvatarPreview
            styleId={numStyle}
            skinToneId={numSkin}
            hairstyleId={numHair}
            backgroundId={numBg}
            size={140}
            rounded={true}
          />
        </div>

        <div className="vart-profile-main-info">
          <div className="vart-profile-badge-row">
            <span className="vart-badge vart-badge-identity">BOT Chain Identity</span>
            {isOwner && <span className="vart-badge vart-badge-owner">Your Profile</span>}
          </div>

          <h2 className="vart-profile-username">@{profile.username}</h2>

          <div className="vart-profile-address-row">
            <span className="vart-label-muted">Wallet:</span>
            <a
              href={`${BOT_CHAIN.explorerUrl}/address/${address}`}
              target="_blank"
              rel="noreferrer"
              className="vart-link-address"
              title={`View on ${BOT_CHAIN.chainName} Explorer`}
            >
              {address} ↗
            </a>
          </div>

          <div className="vart-profile-date-row">
            <span className="vart-label-muted">Created:</span>
            <span className="vart-text-light">{formattedDate}</span>
          </div>

          {isOwner && onEditClick && (
            <div className="vart-profile-actions">
              <button
                type="button"
                className="vart-btn vart-btn-secondary vart-btn-sm"
                onClick={onEditClick}
              >
                ✏️ Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Traits Breakdown */}
      <div className="vart-profile-traits-grid">
        <div className="vart-trait-pill">
          <span className="vart-trait-type">Avatar Style</span>
          <span className="vart-trait-val">{styleName}</span>
        </div>
        <div className="vart-trait-pill">
          <span className="vart-trait-type">Skin Tone</span>
          <span className="vart-trait-val">{skinName}</span>
        </div>
        <div className="vart-trait-pill">
          <span className="vart-trait-type">Hairstyle</span>
          <span className="vart-trait-val">{hairName}</span>
        </div>
        <div className="vart-trait-pill">
          <span className="vart-trait-type">Background</span>
          <span className="vart-trait-val">{bgName}</span>
        </div>
      </div>
    </div>
  );
}
