const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VartProfile", function () {
  let vartProfile;
  let owner;
  let alice;
  let bob;
  let charlie;

  beforeEach(async function () {
    [owner, alice, bob, charlie] = await ethers.getSigners();
    const VartProfileFactory = await ethers.getContractFactory("VartProfile");
    vartProfile = await VartProfileFactory.deploy();
  });

  describe("1. Profile Creation", function () {
    it("should successfully create a profile and emit ProfileCreated event", async function () {
      const tx = await vartProfile
        .connect(alice)
        .createProfile("alice_01", 1, 2, 3, 4);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      await expect(tx)
        .to.emit(vartProfile, "ProfileCreated")
        .withArgs(alice.address, "alice_01", 1, 2, 3, 4, block.timestamp);

      expect(await vartProfile.profileExists(alice.address)).to.equal(true);

      const profile = await vartProfile.getProfile(alice.address);
      expect(profile.username).to.equal("alice_01");
      expect(profile.avatarStyleId).to.equal(1);
      expect(profile.skinToneId).to.equal(2);
      expect(profile.hairstyleId).to.equal(3);
      expect(profile.backgroundId).to.equal(4);
      expect(profile.createdAt).to.equal(block.timestamp);

      expect(await vartProfile.getUsernameOwner("alice_01")).to.equal(alice.address);
    });

    it("should allow attribute IDs at the boundary limits (0 and max)", async function () {
      // Boundaries: style 0-5, skin 0-5, hair 0-7, bg 0-7
      await expect(
        vartProfile.connect(alice).createProfile("boundary_min", 0, 0, 0, 0)
      ).to.not.be.reverted;

      await expect(
        vartProfile.connect(bob).createProfile("boundary_max", 5, 5, 7, 7)
      ).to.not.be.reverted;
    });

    it("should reject a second profile from the same wallet", async function () {
      await vartProfile.connect(alice).createProfile("alice_01", 1, 1, 1, 1);

      await expect(
        vartProfile.connect(alice).createProfile("alice_02", 2, 2, 2, 2)
      )
        .to.be.revertedWithCustomError(vartProfile, "ProfileAlreadyExists")
        .withArgs(alice.address);
    });
  });

  describe("2. Username Validation & Uniqueness", function () {
    it("should reject usernames shorter than 3 characters", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("ab", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameLength").withArgs(2);
    });

    it("should reject usernames longer than 20 characters", async function () {
      const longName = "a".repeat(21);
      await expect(
        vartProfile.connect(alice).createProfile(longName, 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameLength").withArgs(21);
    });

    it("should accept valid 3-character and 20-character usernames", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("abc", 1, 1, 1, 1)
      ).to.not.be.reverted;

      const exact20 = "a".repeat(20);
      await expect(
        vartProfile.connect(bob).createProfile(exact20, 1, 1, 1, 1)
      ).to.not.be.reverted;
    });

    it("should reject usernames with uppercase letters", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("Alice", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");
    });

    it("should reject usernames with invalid characters (hyphens, spaces, punctuation)", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("user-name", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");

      await expect(
        vartProfile.connect(alice).createProfile("user name", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");

      await expect(
        vartProfile.connect(alice).createProfile("user.name", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");

      await expect(
        vartProfile.connect(alice).createProfile("user@name", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");
    });

    it("should accept valid combinations of lowercase letters, numbers, and underscores", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("user_123_ok", 1, 1, 1, 1)
      ).to.not.be.reverted;
    });

    it("should reject duplicate usernames across different wallets", async function () {
      await vartProfile.connect(alice).createProfile("shared_name", 1, 1, 1, 1);

      await expect(
        vartProfile.connect(bob).createProfile("shared_name", 2, 2, 2, 2)
      )
        .to.be.revertedWithCustomError(vartProfile, "UsernameAlreadyTaken")
        .withArgs("shared_name");
    });
  });

  describe("3. Attribute Boundary Validation", function () {
    it("should reject invalid avatar style ID (> 5)", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("alice_01", 6, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidAvatarStyle").withArgs(6);
    });

    it("should reject invalid skin tone ID (> 5)", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("alice_01", 1, 6, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidSkinTone").withArgs(6);
    });

    it("should reject invalid hairstyle ID (> 7)", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("alice_01", 1, 1, 8, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidHairstyle").withArgs(8);
    });

    it("should reject invalid background ID (> 7)", async function () {
      await expect(
        vartProfile.connect(alice).createProfile("alice_01", 1, 1, 1, 8)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidBackground").withArgs(8);
    });
  });

  describe("4. Profile Updates & Ownership", function () {
    beforeEach(async function () {
      await vartProfile.connect(alice).createProfile("alice_01", 1, 2, 3, 4);
    });

    it("should allow owner to update avatar attributes while keeping username", async function () {
      const tx = await vartProfile
        .connect(alice)
        ["updateProfile(string,uint8,uint8,uint8,uint8)"]("alice_01", 5, 4, 3, 2);

      await expect(tx)
        .to.emit(vartProfile, "ProfileUpdated")
        .withArgs(alice.address, "alice_01", 5, 4, 3, 2);

      const profile = await vartProfile.getProfile(alice.address);
      expect(profile.username).to.equal("alice_01");
      expect(profile.avatarStyleId).to.equal(5);
      expect(profile.skinToneId).to.equal(4);
      expect(profile.hairstyleId).to.equal(3);
      expect(profile.backgroundId).to.equal(2);
    });

    it("should allow owner to update username and avatar attributes", async function () {
      await vartProfile
        .connect(alice)
        ["updateProfile(string,uint8,uint8,uint8,uint8)"]("alice_new", 0, 1, 2, 3);

      const profile = await vartProfile.getProfile(alice.address);
      expect(profile.username).to.equal("alice_new");
      expect(await vartProfile.getUsernameOwner("alice_new")).to.equal(alice.address);
      expect(await vartProfile.getUsernameOwner("alice_01")).to.equal(ethers.ZeroAddress);
    });

    it("should preserve the original createdAt timestamp after update", async function () {
      const originalProfile = await vartProfile.getProfile(alice.address);
      const originalCreatedAt = originalProfile.createdAt;

      // Advance blockchain time by 1 hour
      await time.increase(3600);

      await vartProfile
        .connect(alice)
        ["updateProfile(string,uint8,uint8,uint8,uint8)"]("alice_01", 3, 3, 3, 3);

      const updatedProfile = await vartProfile.getProfile(alice.address);
      expect(updatedProfile.createdAt).to.equal(originalCreatedAt);
    });

    it("should reject updates from another wallet targeting someone else's profile", async function () {
      await expect(
        vartProfile
          .connect(bob)
          ["updateProfile(address,string,uint8,uint8,uint8,uint8)"](
            alice.address,
            "hacked",
            1,
            1,
            1,
            1
          )
      )
        .to.be.revertedWithCustomError(vartProfile, "Unauthorized")
        .withArgs(bob.address, alice.address);
    });

    it("should reject update attempts by a wallet that has not created a profile", async function () {
      await expect(
        vartProfile
          .connect(bob)
          ["updateProfile(string,uint8,uint8,uint8,uint8)"]("bob_01", 1, 1, 1, 1)
      )
        .to.be.revertedWithCustomError(vartProfile, "ProfileDoesNotExist")
        .withArgs(bob.address);
    });

    it("should reject update to an already taken username", async function () {
      await vartProfile.connect(bob).createProfile("bob_01", 1, 1, 1, 1);

      await expect(
        vartProfile
          .connect(alice)
          ["updateProfile(string,uint8,uint8,uint8,uint8)"]("bob_01", 1, 1, 1, 1)
      )
        .to.be.revertedWithCustomError(vartProfile, "UsernameAlreadyTaken")
        .withArgs("bob_01");
    });

    it("should validate attributes and username during update", async function () {
      // Invalid style > 5
      await expect(
        vartProfile
          .connect(alice)
          ["updateProfile(string,uint8,uint8,uint8,uint8)"]("alice_01", 6, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidAvatarStyle").withArgs(6);

      // Invalid username format
      await expect(
        vartProfile
          .connect(alice)
          ["updateProfile(string,uint8,uint8,uint8,uint8)"]("ALICE", 1, 1, 1, 1)
      ).to.be.revertedWithCustomError(vartProfile, "InvalidUsernameCharacter");
    });
  });

  describe("5. Username Release & Reuse", function () {
    it("should release old username on update and allow another wallet to claim it", async function () {
      await vartProfile.connect(alice).createProfile("shared_name", 1, 1, 1, 1);

      // Bob cannot register shared_name
      await expect(
        vartProfile.connect(bob).createProfile("shared_name", 2, 2, 2, 2)
      )
        .to.be.revertedWithCustomError(vartProfile, "UsernameAlreadyTaken")
        .withArgs("shared_name");

      // Alice changes username from shared_name to alice_brand
      await vartProfile
        .connect(alice)
        ["updateProfile(string,uint8,uint8,uint8,uint8)"]("alice_brand", 1, 1, 1, 1);

      // Old username is now released; Bob can register it
      await expect(
        vartProfile.connect(bob).createProfile("shared_name", 2, 2, 2, 2)
      ).to.not.be.reverted;

      expect(await vartProfile.getUsernameOwner("shared_name")).to.equal(bob.address);
      const bobProfile = await vartProfile.getProfile(bob.address);
      expect(bobProfile.username).to.equal("shared_name");
    });
  });

  describe("6. Queries (getProfile & profileExists)", function () {
    it("should return false for profileExists if wallet has no profile", async function () {
      expect(await vartProfile.profileExists(charlie.address)).to.equal(false);
    });

    it("should revert getProfile with ProfileDoesNotExist if wallet has no profile", async function () {
      await expect(
        vartProfile.getProfile(charlie.address)
      )
        .to.be.revertedWithCustomError(vartProfile, "ProfileDoesNotExist")
        .withArgs(charlie.address);
    });

    it("should return correct data for profileExists and getProfile once created", async function () {
      await vartProfile.connect(charlie).createProfile("charlie_x", 4, 3, 2, 1);

      expect(await vartProfile.profileExists(charlie.address)).to.equal(true);

      const profile = await vartProfile.getProfile(charlie.address);
      expect(profile.username).to.equal("charlie_x");
      expect(profile.avatarStyleId).to.equal(4);
      expect(profile.skinToneId).to.equal(3);
      expect(profile.hairstyleId).to.equal(2);
      expect(profile.backgroundId).to.equal(1);
      expect(profile.createdAt).to.be.greaterThan(0);
    });
  });
});
