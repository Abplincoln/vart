import React from 'react';
import AvatarPreview from './AvatarPreview';
import { BOT_CHAIN } from '../constants/network';

export default function Header({
  account,
  chainId,
  isCorrectNetwork,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  isContractReady,
  userProfile,
}) {
  const truncate = (addr) =>
    addr ? `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}` : "";

  return (
    <header className="vart-header">
      <div className="vart-header-inner">
        {/* Brand */}
        <div className="vart-brand">
          <div className="vart-logo-icon">V</div>
          <div className="vart-brand-text">
            <span className="vart-brand-title">Vart</span>
            <span className="vart-brand-badge">{BOT_CHAIN.chainName}</span>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="vart-header-actions">
          {/* Contract configuration pill */}
          {!isContractReady && (
            <span className="vart-pill vart-pill-warning" title="Contract address not configured in environment">
              Contract Setup Needed
            </span>
          )}

          {/* Network Switcher / Status */}
          {account && (
            isCorrectNetwork ? (
              <span className="vart-pill vart-pill-success">
                <span className="vart-dot vart-dot-success"></span>
                {BOT_CHAIN.chainName} ({BOT_CHAIN.chainId})
              </span>
            ) : (
              <button
                type="button"
                className="vart-btn vart-btn-sm vart-btn-warning"
                onClick={onSwitchNetwork}
              >
                Switch to {BOT_CHAIN.chainName} ({BOT_CHAIN.chainId})
              </button>
            )
          )}

          {/* Wallet Connect / Account */}
          {account ? (
            <div className="vart-account-pill">
              {userProfile ? (
                <AvatarPreview
                  styleId={userProfile.avatarStyleId}
                  skinToneId={userProfile.skinToneId}
                  hairstyleId={userProfile.hairstyleId}
                  backgroundId={userProfile.backgroundId}
                  size={28}
                  rounded={true}
                />
              ) : (
                <div className="vart-account-avatar-placeholder"></div>
              )}
              <span className="vart-account-address">{truncate(account)}</span>
              <button
                type="button"
                className="vart-account-disconnect"
                onClick={onDisconnect}
                title="Disconnect wallet"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="vart-btn vart-btn-primary"
              onClick={onConnect}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
