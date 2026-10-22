// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title VartProfile
 * @notice Customizable on-chain identity platform on BOT Chain.
 * @dev Enforces 1 profile per wallet, unique usernames, and bounds for avatar attributes.
 */
contract VartProfile {
    struct Profile {
        string username;
        uint8 avatarStyleId;
        uint8 skinToneId;
        uint8 hairstyleId;
        uint8 backgroundId;
        uint256 createdAt;
    }

    // Mapping from user address to their profile
    mapping(address => Profile) private _profiles;

    // Mapping from user address to profile existence
    mapping(address => bool) private _hasProfile;

    // Mapping from hashed username to current owner address
    mapping(bytes32 => address) private _usernameOwner;

    // Events
    event ProfileCreated(
        address indexed user,
        string username,
        uint8 avatarStyleId,
        uint8 skinToneId,
        uint8 hairstyleId,
        uint8 backgroundId,
        uint256 createdAt
    );

    event ProfileUpdated(
        address indexed user,
        string username,
        uint8 avatarStyleId,
        uint8 skinToneId,
        uint8 hairstyleId,
        uint8 backgroundId
    );

    // Custom errors
    error ProfileAlreadyExists(address user);
    error ProfileDoesNotExist(address user);
    error Unauthorized(address caller, address owner);
    error InvalidUsernameLength(uint256 length);
    error InvalidUsernameCharacter(bytes1 character);
    error UsernameAlreadyTaken(string username);
    error InvalidAvatarStyle(uint8 avatarStyleId);
    error InvalidSkinTone(uint8 skinToneId);
    error InvalidHairstyle(uint8 hairstyleId);
    error InvalidBackground(uint8 backgroundId);

    /**
     * @notice Create a new identity profile for the caller.
     * @param username The chosen unique username (3-20 lowercase alphanumeric characters and underscores).
     * @param avatarStyleId Avatar style ID (0-5).
     * @param skinToneId Skin tone ID (0-5).
     * @param hairstyleId Hairstyle ID (0-7).
     * @param backgroundId Background ID (0-7).
     */
    function createProfile(
        string calldata username,
        uint8 avatarStyleId,
        uint8 skinToneId,
        uint8 hairstyleId,
        uint8 backgroundId
    ) external {
        if (_hasProfile[msg.sender]) {
            revert ProfileAlreadyExists(msg.sender);
        }

        _validateUsername(username);
        _validateAttributes(avatarStyleId, skinToneId, hairstyleId, backgroundId);

        bytes32 usernameHash = keccak256(bytes(username));
        if (_usernameOwner[usernameHash] != address(0)) {
            revert UsernameAlreadyTaken(username);
        }

        _hasProfile[msg.sender] = true;
        _usernameOwner[usernameHash] = msg.sender;

        uint256 timestamp = block.timestamp;
        _profiles[msg.sender] = Profile({
            username: username,
            avatarStyleId: avatarStyleId,
            skinToneId: skinToneId,
            hairstyleId: hairstyleId,
            backgroundId: backgroundId,
            createdAt: timestamp
        });

        emit ProfileCreated(
            msg.sender,
            username,
            avatarStyleId,
            skinToneId,
            hairstyleId,
            backgroundId,
            timestamp
        );
    }

    /**
     * @notice Update the caller's profile.
     * @param newUsername The new or existing username.
     * @param newAvatarStyleId Avatar style ID (0-5).
     * @param newSkinToneId Skin tone ID (0-5).
     * @param newHairstyleId Hairstyle ID (0-7).
     * @param newBackgroundId Background ID (0-7).
     */
    function updateProfile(
        string calldata newUsername,
        uint8 newAvatarStyleId,
        uint8 newSkinToneId,
        uint8 newHairstyleId,
        uint8 newBackgroundId
    ) external {
        updateProfile(
            msg.sender,
            newUsername,
            newAvatarStyleId,
            newSkinToneId,
            newHairstyleId,
            newBackgroundId
        );
    }

    /**
     * @notice Update a profile with explicit target owner check.
     * @param user The address of the profile to update.
     * @param newUsername The new or existing username.
     * @param newAvatarStyleId Avatar style ID (0-5).
     * @param newSkinToneId Skin tone ID (0-5).
     * @param newHairstyleId Hairstyle ID (0-7).
     * @param newBackgroundId Background ID (0-7).
     */
    function updateProfile(
        address user,
        string calldata newUsername,
        uint8 newAvatarStyleId,
        uint8 newSkinToneId,
        uint8 newHairstyleId,
        uint8 newBackgroundId
    ) public {
        if (msg.sender != user) {
            revert Unauthorized(msg.sender, user);
        }
        if (!_hasProfile[user]) {
            revert ProfileDoesNotExist(user);
        }

        _validateAttributes(newAvatarStyleId, newSkinToneId, newHairstyleId, newBackgroundId);

        Profile storage profile = _profiles[user];
        bytes32 oldUsernameHash = keccak256(bytes(profile.username));
        bytes32 newUsernameHash = keccak256(bytes(newUsername));

        if (newUsernameHash != oldUsernameHash) {
            _validateUsername(newUsername);
            if (_usernameOwner[newUsernameHash] != address(0)) {
                revert UsernameAlreadyTaken(newUsername);
            }

            delete _usernameOwner[oldUsernameHash];
            _usernameOwner[newUsernameHash] = user;
            profile.username = newUsername;
        }

        profile.avatarStyleId = newAvatarStyleId;
        profile.skinToneId = newSkinToneId;
        profile.hairstyleId = newHairstyleId;
        profile.backgroundId = newBackgroundId;
        // profile.createdAt is strictly preserved

        emit ProfileUpdated(
            user,
            newUsername,
            newAvatarStyleId,
            newSkinToneId,
            newHairstyleId,
            newBackgroundId
        );
    }

    /**
     * @notice Fetch the profile of a given address.
     * @param user The address whose profile is queried.
     * @return The Profile struct.
     */
    function getProfile(address user) external view returns (Profile memory) {
        if (!_hasProfile[user]) {
            revert ProfileDoesNotExist(user);
        }
        return _profiles[user];
    }

    /**
     * @notice Check whether a profile exists for a given address.
     * @param user The address to check.
     * @return True if a profile exists, false otherwise.
     */
    function profileExists(address user) external view returns (bool) {
        return _hasProfile[user];
    }

    /**
     * @notice Check the current owner of a given username.
     * @param username The username to check.
     * @return Address of the owner, or address(0) if unregistered.
     */
    function getUsernameOwner(string calldata username) external view returns (address) {
        return _usernameOwner[keccak256(bytes(username))];
    }

    /**
     * @dev Validates username length and character set [a-z0-9_].
     */
    function _validateUsername(string calldata username) internal pure {
        bytes calldata b = bytes(username);
        uint256 len = b.length;
        if (len < 3 || len > 20) {
            revert InvalidUsernameLength(len);
        }
        for (uint256 i = 0; i < len; ) {
            bytes1 char = b[i];
            bool isLower = (char >= 0x61 && char <= 0x7a);
            bool isNumber = (char >= 0x30 && char <= 0x39);
            bool isUnderscore = (char == 0x5f);
            if (!isLower && !isNumber && !isUnderscore) {
                revert InvalidUsernameCharacter(char);
            }
            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Validates that attribute IDs are within allowed ranges.
     */
    function _validateAttributes(
        uint8 avatarStyleId,
        uint8 skinToneId,
        uint8 hairstyleId,
        uint8 backgroundId
    ) internal pure {
        if (avatarStyleId > 5) revert InvalidAvatarStyle(avatarStyleId);
        if (skinToneId > 5) revert InvalidSkinTone(skinToneId);
        if (hairstyleId > 7) revert InvalidHairstyle(hairstyleId);
        if (backgroundId > 7) revert InvalidBackground(backgroundId);
    }
}
