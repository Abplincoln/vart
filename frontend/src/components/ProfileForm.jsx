import React, { useState } from 'react';
import AvatarPicker from './AvatarPicker';
import { getSignerContract, parseContractError } from '../utils/contract';
import { BOT_CHAIN } from '../constants/network';

export default function ProfileForm({
  mode = "create", // "create" or "edit"
  initialData = null,
  account,
  onSuccess,
  onCancel,
  overrideAddress = "",
}) {
  const [username, setUsername] = useState(initialData?.username || "");
  const [avatarStyleId, setAvatarStyleId] = useState(
    initialData ? Number(initialData.avatarStyleId) : 0
  );
  const [skinToneId, setSkinToneId] = useState(
    initialData ? Number(initialData.skinToneId) : 0
  );
  const [hairstyleId, setHairstyleId] = useState(
    initialData ? Number(initialData.hairstyleId) : 0
  );
  const [backgroundId, setBackgroundId] = useState(
    initialData ? Number(initialData.backgroundId) : 0
  );

  const [txState, setTxState] = useState({
    status: "idle", // "idle" | "preparing" | "pending" | "success" | "error"
    message: "",
    txHash: "",
  });

  // Client-side username validation
  const validateUsername = (name) => {
    if (!name) return "Username is required.";
    if (name.length < 3) return "Username must be at least 3 characters long.";
    if (name.length > 20) return "Username must not exceed 20 characters.";
    if (!/^[a-z0-9_]+$/.test(name)) {
      return "Only lowercase letters (a-z), numbers (0-9), and underscores (_) are allowed.";
    }
    return "";
  };

  const usernameError = validateUsername(username);

  const handleAvatarChange = (updates) => {
    if (updates.avatarStyleId !== undefined) setAvatarStyleId(updates.avatarStyleId);
    if (updates.skinToneId !== undefined) setSkinToneId(updates.skinToneId);
    if (updates.hairstyleId !== undefined) setHairstyleId(updates.hairstyleId);
    if (updates.backgroundId !== undefined) setBackgroundId(updates.backgroundId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errorMsg = validateUsername(username);
    if (errorMsg) {
      setTxState({ status: "error", message: errorMsg, txHash: "" });
      return;
    }

    try {
      setTxState({
        status: "preparing",
        message: "Requesting wallet signature in MetaMask...",
        txHash: "",
      });

      const contract = await getSignerContract(overrideAddress);

      let tx;
      if (mode === "create") {
        tx = await contract.createProfile(
          username,
          avatarStyleId,
          skinToneId,
          hairstyleId,
          backgroundId
        );
      } else {
        tx = await contract["updateProfile(string,uint8,uint8,uint8,uint8)"](
          username,
          avatarStyleId,
          skinToneId,
          hairstyleId,
          backgroundId
        );
      }

      setTxState({
        status: "pending",
        message: "Transaction submitted! Waiting for block confirmation on BOT Chain...",
        txHash: tx.hash,
      });

      const receipt = await tx.wait();

      setTxState({
        status: "success",
        message:
          mode === "create"
            ? "Identity profile successfully created on BOT Chain!"
            : "Identity profile successfully updated on BOT Chain!",
        txHash: receipt.hash || tx.hash,
      });

      if (onSuccess) {
        onSuccess({
          username,
          avatarStyleId,
          skinToneId,
          hairstyleId,
          backgroundId,
        });
      }
    } catch (err) {
      console.error("Profile transaction failed:", err);
      const friendlyError = parseContractError(err);
      setTxState({
        status: "error",
        message: friendlyError,
        txHash: "",
      });
    }
  };

  const isSubmitting = txState.status === "preparing" || txState.status === "pending";

  return (
    <div className="vart-card vart-form-card">
      <div className="vart-form-header">
        <h2 className="vart-card-title">
          {mode === "create" ? "Create On-Chain Identity" : "Edit Profile"}
        </h2>
        <p className="vart-card-subtitle">
          {mode === "create"
            ? "Claim your unique username and design your customized on-chain avatar on BOT Chain."
            : "Update your username or avatar presets. Releasing a username makes it available to others."}
        </p>
      </div>

      {/* Transaction Notifications */}
      {txState.status === "preparing" && (
        <div className="vart-alert vart-alert-info">
          <span className="vart-spinner"></span>
          <span>{txState.message}</span>
        </div>
      )}

      {txState.status === "pending" && (
        <div className="vart-alert vart-alert-warning">
          <span className="vart-spinner"></span>
          <div>
            <p className="vart-alert-title">{txState.message}</p>
            {txState.txHash && (
              <a
                href={`${BOT_CHAIN.explorerUrl}/tx/${txState.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="vart-link-underline"
              >
                View on Bohr Explorer ({txState.txHash.slice(0, 10)}...) ↗
              </a>
            )}
          </div>
        </div>
      )}

      {txState.status === "success" && (
        <div className="vart-alert vart-alert-success">
          <div>
            <p className="vart-alert-title">✅ {txState.message}</p>
            {txState.txHash && (
              <a
                href={`${BOT_CHAIN.explorerUrl}/tx/${txState.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="vart-link-underline"
              >
                View Confirmed Transaction ↗
              </a>
            )}
          </div>
        </div>
      )}

      {txState.status === "error" && (
        <div className="vart-alert vart-alert-error">
          <p className="vart-alert-title">⚠️ Transaction Failed</p>
          <p className="vart-alert-desc">{txState.message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="vart-form">
        {/* Username Field */}
        <div className="vart-field-group">
          <label htmlFor="username-input" className="vart-label">
            Username <span className="vart-required">*</span>
          </label>
          <div className="vart-input-prefix-wrap">
            <span className="vart-input-prefix">@</span>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().trim())}
              placeholder="e.g. satoshi_968"
              maxLength={20}
              className={`vart-input ${username && usernameError ? "vart-input-invalid" : ""}`}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>
          <div className="vart-field-hint-row">
            <span className="vart-field-hint">
              3–20 characters, lowercase letters (a-z), numbers (0-9), and underscores (_).
            </span>
            <span className="vart-char-counter">{username.length}/20</span>
          </div>
          {username && usernameError && (
            <p className="vart-field-error">{usernameError}</p>
          )}
        </div>

        {/* Avatar Customization */}
        <div className="vart-field-group">
          <label className="vart-label">Custom Avatar Presets</label>
          <AvatarPicker
            styleId={avatarStyleId}
            skinToneId={skinToneId}
            hairstyleId={hairstyleId}
            backgroundId={backgroundId}
            onChange={handleAvatarChange}
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="vart-form-actions">
          {mode === "edit" && onCancel && (
            <button
              type="button"
              className="vart-btn vart-btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="vart-btn vart-btn-primary"
            disabled={isSubmitting || Boolean(usernameError)}
          >
            {isSubmitting
              ? "Confirming on BOT Chain..."
              : mode === "create"
              ? "Create Identity Profile"
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
