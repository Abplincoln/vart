import React, { useState } from 'react';
import { ethers } from 'ethers';
import ProfileCard from './ProfileCard';
import { getReadOnlyContract, parseContractError } from '../utils/contract';

export default function ProfileLookup({ overrideAddress = "" }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const contract = getReadOnlyContract(overrideAddress);
      if (!contract) {
        throw new Error("Contract address is not configured yet.");
      }

      let resolvedAddress = "";

      if (ethers.isAddress(cleanQuery)) {
        resolvedAddress = cleanQuery;
      } else {
        // Query by username (lowercase)
        const usernameClean = cleanQuery.startsWith("@")
          ? cleanQuery.slice(1).toLowerCase()
          : cleanQuery.toLowerCase();

        const owner = await contract.getUsernameOwner(usernameClean);
        if (!owner || owner === ethers.ZeroAddress) {
          setError(`No profile found with username "@${usernameClean}".`);
          setLoading(false);
          return;
        }
        resolvedAddress = owner;
      }

      // Check existence
      const exists = await contract.profileExists(resolvedAddress);
      if (!exists) {
        setError(`No identity profile has been created for ${resolvedAddress}.`);
        setLoading(false);
        return;
      }

      const profile = await contract.getProfile(resolvedAddress);
      setResult({
        address: resolvedAddress,
        profile,
      });
    } catch (err) {
      console.error("Lookup error:", err);
      setError(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vart-lookup-section">
      <div className="vart-card vart-lookup-card">
        <h3 className="vart-card-title">Explore On-Chain Identities</h3>
        <p className="vart-card-subtitle">
          Search for any registered profile on BOT Chain Bohr Testnet by wallet address or username.
        </p>

        <form onSubmit={handleSearch} className="vart-lookup-form">
          <div className="vart-lookup-input-wrap">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by 0x address or username (e.g. @satoshi)"
              className="vart-input vart-lookup-input"
            />
            <button
              type="submit"
              className="vart-btn vart-btn-primary"
              disabled={loading || !query.trim()}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {loading && (
          <div className="vart-loading-state">
            <span className="vart-spinner"></span>
            <span>Querying BOT Chain RPC...</span>
          </div>
        )}

        {error && (
          <div className="vart-alert vart-alert-info">
            <span>ℹ️ {error}</span>
          </div>
        )}

        {result && (
          <div className="vart-lookup-result">
            <ProfileCard
              profile={result.profile}
              address={result.address}
              isOwner={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
