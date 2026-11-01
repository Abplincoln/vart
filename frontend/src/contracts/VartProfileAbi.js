/**
 * Exact ABI entries for VartProfile compiled artifact on BOT Chain Mainnet / Bohr Testnet.
 * Sourced directly from artifacts/contracts/VartProfile.sol/VartProfile.json.
 */
export const VART_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "avatarStyleId",
        "type": "uint8"
      }
    ],
    "name": "InvalidAvatarStyle",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "backgroundId",
        "type": "uint8"
      }
    ],
    "name": "InvalidBackground",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "hairstyleId",
        "type": "uint8"
      }
    ],
    "name": "InvalidHairstyle",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint8",
        "name": "skinToneId",
        "type": "uint8"
      }
    ],
    "name": "InvalidSkinTone",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "bytes1",
        "name": "character",
        "type": "bytes1"
      }
    ],
    "name": "InvalidUsernameCharacter",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "length",
        "type": "uint256"
      }
    ],
    "name": "InvalidUsernameLength",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "ProfileAlreadyExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "ProfileDoesNotExist",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "caller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      }
    ],
    "name": "Unauthorized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      }
    ],
    "name": "UsernameAlreadyTaken",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "avatarStyleId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "skinToneId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "hairstyleId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "backgroundId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "name": "ProfileCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "avatarStyleId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "skinToneId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "hairstyleId",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "backgroundId",
        "type": "uint8"
      }
    ],
    "name": "ProfileUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "avatarStyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "skinToneId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "hairstyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "backgroundId",
        "type": "uint8"
      }
    ],
    "name": "createProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getProfile",
    "outputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "username",
            "type": "string"
          },
          {
            "internalType": "uint8",
            "name": "avatarStyleId",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "skinToneId",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "hairstyleId",
            "type": "uint8"
          },
          {
            "internalType": "uint8",
            "name": "backgroundId",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "createdAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct VartProfile.Profile",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "username",
        "type": "string"
      }
    ],
    "name": "getUsernameOwner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "profileExists",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "newUsername",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "newAvatarStyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newSkinToneId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newHairstyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newBackgroundId",
        "type": "uint8"
      }
    ],
    "name": "updateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "newUsername",
        "type": "string"
      },
      {
        "internalType": "uint8",
        "name": "newAvatarStyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newSkinToneId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newHairstyleId",
        "type": "uint8"
      },
      {
        "internalType": "uint8",
        "name": "newBackgroundId",
        "type": "uint8"
      }
    ],
    "name": "updateProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default VART_ABI;
