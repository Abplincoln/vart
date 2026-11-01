import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import Header from './components/Header';
import ProfileCard from './components/ProfileCard';
import ProfileForm from './components/ProfileForm';
import ProfileLookup from './components/ProfileLookup';
import AvatarPicker from './components/AvatarPicker';
import { BOT_CHAIN } from './constants/network';
import {
  getContractAddress,
  isContractConfigured,
  getReadOnlyContract,
  switchOrAddBotChain,
  parseContractError,
} from './utils/contract';

export default function App() {
  const [account, setAccount] = useState("");
  const [chainId, setChainId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" | "explore" | "studio"
  const [isEditing, setIsEditing] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Sandbox avatar state for visitors who want to test the customizer
  const [sandboxAvatar, setSandboxAvatar] = useState({
    avatarStyleId: 1,
    skinToneId: 2,
    hairstyleId: 3,
    backgroundId: 1,
  });

  // Local override for testing contract address without rebuilding
  const [customContractAddress, setCustomContractAddress] = useState("");
  const effectiveContractAddress = getContractAddress(customContractAddress, chainId);
  const isContractReady = Boolean(effectiveContractAddress);

  const isCorrectNetwork = Number(chainId) === BOT_CHAIN.chainId;

  // Load user profile from smart contract
  const loadUserProfile = useCallback(
    async (userAddress) => {
      if (!userAddress || !isContractReady) {
        setUserProfile(null);
        setHasProfile(false);
        return;
      }

      setProfileLoading(true);
      setGlobalError("");

      try {
        const contract = getReadOnlyContract(effectiveContractAddress, chainId);
        if (!contract) return;

        const exists = await contract.profileExists(userAddress);
        setHasProfile(exists);

        if (exists) {
          const profile = await contract.getProfile(userAddress);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
        setGlobalError(parseContractError(err));
      } finally {
        setProfileLoading(false);
      }
    },
    [isContractReady, effectiveContractAddress, chainId]
  );

  // Initialize wallet connection listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        const selected = accounts[0].toLowerCase();
        setAccount(selected);
        loadUserProfile(selected);
      } else {
        setAccount("");
        setUserProfile(null);
        setHasProfile(false);
      }
    };

    const handleChainChanged = (hexChainId) => {
      const parsed = parseInt(hexChainId, 16);
      setChainId(parsed);
      if (account) {
        loadUserProfile(account);
      }
    };

    // Check already connected accounts
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          const selected = accounts[0].toLowerCase();
          setAccount(selected);
          loadUserProfile(selected);
        }
      })
      .catch(console.error);

    // Check current chain ID
    window.ethereum
      .request({ method: "eth_chainId" })
      .then((hexChainId) => {
        setChainId(parseInt(hexChainId, 16));
      })
      .catch(console.error);

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [loadUserProfile, account]);

  // Re-fetch profile when effective contract address changes
  useEffect(() => {
    if (account && isContractReady) {
      loadUserProfile(account);
    }
  }, [account, isContractReady, loadUserProfile]);

  const handleConnect = async () => {
    if (!window.ethereum) {
      setGlobalError("MetaMask not detected. Please install the MetaMask extension to use Vart.");
      return;
    }
    try {
      setGlobalError("");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts.length > 0) {
        const selected = accounts[0].toLowerCase();
        setAccount(selected);
        loadUserProfile(selected);
      }
      const hexChainId = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(hexChainId, 16));
    } catch (err) {
      console.error("Connect error:", err);
      setGlobalError(parseContractError(err));
    }
  };

  const handleDisconnect = () => {
    setAccount("");
    setUserProfile(null);
    setHasProfile(false);
    setIsEditing(false);
  };

  const handleSwitchNetwork = async () => {
    try {
      setGlobalError("");
      await switchOrAddBotChain();
      const hexChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(parseInt(hexChain, 16));
    } catch (err) {
      console.error("Network switch error:", err);
      setGlobalError(parseContractError(err));
    }
  };

  const handleProfileSuccess = (newProfileData) => {
    setIsEditing(false);
    loadUserProfile(account);
  };

  return (
    <div className="vart-app">
      <Header
        account={account}
        chainId={chainId}
        isCorrectNetwork={isCorrectNetwork}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        onSwitchNetwork={handleSwitchNetwork}
        isContractReady={isContractReady}
        userProfile={userProfile}
      />

      <main className="vart-main">
        {/* Global Errors */}
        {globalError && (
          <div className="vart-container">
            <div className="vart-alert vart-alert-error">
              <span>⚠️ {globalError}</span>
              <button
                type="button"
                className="vart-alert-close"
                onClick={() => setGlobalError("")}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Contract Setup Notice if address is missing */}
        {!isContractReady && (
          <div className="vart-container">
            <div className="vart-setup-banner">
              <div className="vart-setup-banner-icon">⚙️</div>
              <div className="vart-setup-banner-content">
                <h3 className="vart-setup-title">Smart Contract Address Not Configured</h3>
                <p className="vart-setup-text">
                  To interact with the on-chain registry, provide the deployed{" "}
                  <code>VartProfile</code> contract address via the frontend environment variable:
                </p>
                <div className="vart-code-block">
                  <code>VITE_VART_CONTRACT_ADDRESS=0xYourDeployedContractAddress</code>
                </div>
                <div className="vart-setup-override-row">
                  <label htmlFor="override-addr-input" className="vart-setup-override-label">
                    Or paste contract address for live preview:
                  </label>
                  <input
                    id="override-addr-input"
                    type="text"
                    value={customContractAddress}
                    onChange={(e) => setCustomContractAddress(e.target.value.trim())}
                    placeholder="0x..."
                    className="vart-input vart-input-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Warning Banner */}
        {account && !isCorrectNetwork && (
          <div className="vart-container">
            <div className="vart-alert vart-alert-warning">
              <div>
                <strong>Incorrect Network Detected:</strong> You are connected to chain ID{" "}
                {chainId}. Vart operates on {BOT_CHAIN.chainName} (Chain ID {BOT_CHAIN.chainId}).
              </div>
              <button
                type="button"
                className="vart-btn vart-btn-sm vart-btn-warning"
                onClick={handleSwitchNetwork}
              >
                Switch to {BOT_CHAIN.chainName} ({BOT_CHAIN.chainId})
              </button>
            </div>
          </div>
        )}

        {/* Landing Page View (When Wallet is Not Connected) */}
        {!account && (
          <div className="vart-container">
            <section className="vart-hero">
              <div className="vart-hero-content">
                <span className="vart-hero-tag">On-Chain Identity Standard</span>
                <h1 className="vart-hero-title">
                  Customizable Digital Identity on <span className="vart-gradient-text">BOT Chain</span>
                </h1>
                <p className="vart-hero-description">
                  Vart is a self-sovereign identity protocol for {BOT_CHAIN.chainName}.
                  Claim your unique on-chain username and design your customizable vector
                  avatar stored and verified completely on-chain.
                </p>
                <div className="vart-hero-buttons">
                  <button
                    type="button"
                    className="vart-btn vart-btn-primary vart-btn-lg"
                    onClick={handleConnect}
                  >
                    Connect Wallet to Begin
                  </button>
                  <a
                    href="https://dev-docs.botchain.ai/docs/Developers/quick-guide/"
                    target="_blank"
                    rel="noreferrer"
                    className="vart-btn vart-btn-secondary vart-btn-lg"
                  >
                    BOT Chain Docs ↗
                  </a>
                </div>

                <div className="vart-hero-network-info">
                  <span className="vart-info-item">
                    <strong>Network:</strong> {BOT_CHAIN.chainName}
                  </span>
                  <span className="vart-info-item">
                    <strong>Chain ID:</strong> {BOT_CHAIN.chainId}
                  </span>
                  <span className="vart-info-item">
                    <strong>Gas Token:</strong> {BOT_CHAIN.nativeCurrency.symbol}
                  </span>
                </div>
              </div>

              {/* Interactive Live Studio Preview */}
              <div className="vart-hero-preview-wrap">
                <div className="vart-studio-card">
                  <h3 className="vart-studio-card-title">Live Avatar Customizer</h3>
                  <p className="vart-studio-card-subtitle">
                    Explore on-chain traits before deploying your profile.
                  </p>
                  <AvatarPicker
                    styleId={sandboxAvatar.avatarStyleId}
                    skinToneId={sandboxAvatar.skinToneId}
                    hairstyleId={sandboxAvatar.hairstyleId}
                    backgroundId={sandboxAvatar.backgroundId}
                    onChange={(updates) =>
                      setSandboxAvatar((prev) => ({ ...prev, ...updates }))
                    }
                  />
                </div>
              </div>
            </section>

            {/* Public Identity Explorer */}
            <section className="vart-section">
              <ProfileLookup overrideAddress={effectiveContractAddress} />
            </section>
          </div>
        )}

        {/* Connected Wallet Experience */}
        {account && (
          <div className="vart-container">
            {/* Top Navigation Bar */}
            <div className="vart-nav-tabs">
              <button
                type="button"
                className={`vart-nav-tab ${activeTab === "profile" ? "active" : ""}`}
                onClick={() => {
                  setActiveTab("profile");
                  setIsEditing(false);
                }}
              >
                👤 My Identity
              </button>
              <button
                type="button"
                className={`vart-nav-tab ${activeTab === "explore" ? "active" : ""}`}
                onClick={() => setActiveTab("explore")}
              >
                🔍 Explore Identities
              </button>
              <button
                type="button"
                className={`vart-nav-tab ${activeTab === "studio" ? "active" : ""}`}
                onClick={() => setActiveTab("studio")}
              >
                🎨 Avatar Studio
              </button>
            </div>

            {/* Tab: My Profile */}
            {activeTab === "profile" && (
              <div className="vart-tab-view">
                {profileLoading ? (
                  <div className="vart-loading-card">
                    <span className="vart-spinner vart-spinner-lg"></span>
                    <p>Loading identity profile from BOT Chain...</p>
                  </div>
                ) : hasProfile && !isEditing ? (
                  // Existing Profile View
                  <ProfileCard
                    profile={userProfile}
                    address={account}
                    isOwner={true}
                    onEditClick={() => setIsEditing(true)}
                  />
                ) : hasProfile && isEditing ? (
                  // Edit Existing Profile View
                  <ProfileForm
                    mode="edit"
                    initialData={userProfile}
                    account={account}
                    onSuccess={handleProfileSuccess}
                    onCancel={() => setIsEditing(false)}
                    overrideAddress={effectiveContractAddress}
                  />
                ) : (
                  // Profile Creation View (Wallet has no profile yet)
                  <ProfileForm
                    mode="create"
                    account={account}
                    onSuccess={handleProfileSuccess}
                    overrideAddress={effectiveContractAddress}
                  />
                )}
              </div>
            )}

            {/* Tab: Explore / Lookup */}
            {activeTab === "explore" && (
              <div className="vart-tab-view">
                <ProfileLookup overrideAddress={effectiveContractAddress} />
              </div>
            )}

            {/* Tab: Avatar Studio / Sandbox */}
            {activeTab === "studio" && (
              <div className="vart-tab-view">
                <div className="vart-card">
                  <h3 className="vart-card-title">Avatar Trait Studio</h3>
                  <p className="vart-card-subtitle">
                    Preview all combinations of avatar styles (0–5), skin tones (0–5),
                    hairstyles (0–7), and backgrounds (0–7) before updating your profile.
                  </p>
                  <AvatarPicker
                    styleId={sandboxAvatar.avatarStyleId}
                    skinToneId={sandboxAvatar.skinToneId}
                    hairstyleId={sandboxAvatar.hairstyleId}
                    backgroundId={sandboxAvatar.backgroundId}
                    onChange={(updates) =>
                      setSandboxAvatar((prev) => ({ ...prev, ...updates }))
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="vart-footer">
        <div className="vart-container vart-footer-inner">
          <div className="vart-footer-col">
            <span className="vart-brand-title">Vart</span>
            <p className="vart-footer-tagline">
              Customizable On-Chain Identity Protocol on BOT Chain.
            </p>
          </div>
          <div className="vart-footer-links">
            <a
              href={BOT_CHAIN.explorerUrl}
              target="_blank"
              rel="noreferrer"
              className="vart-footer-link"
            >
              {BOT_CHAIN.chainName} Explorer ↗
            </a>
            <a
              href={BOT_CHAIN.rpcUrl}
              target="_blank"
              rel="noreferrer"
              className="vart-footer-link"
            >
              RPC Endpoint ↗
            </a>
            <a
              href="https://dev-docs.botchain.ai"
              target="_blank"
              rel="noreferrer"
              className="vart-footer-link"
            >
              Developer Docs ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
