// ============================================================
// Mint Club V2 Bond ABI — read-only subset
// Contract: 0xc5a076cad94176c2996B32d8466Be1cE757FAa27 (Base)
// Source: https://github.com/Steemhunt/mint.club-v2-contract
// ============================================================

export const mcv2BondAbi = [
  // tokenBond(address) → (creator, mintRoyalty, burnRoyalty, createdAt, reserveToken, reserveBalance)
  {
    inputs: [{ name: "token", type: "address" }],
    name: "tokenBond",
    outputs: [
      { name: "creator", type: "address" },
      { name: "mintRoyalty", type: "uint16" },
      { name: "burnRoyalty", type: "uint16" },
      { name: "createdAt", type: "uint40" },
      { name: "reserveToken", type: "address" },
      { name: "reserveBalance", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  // exists(address) → bool
  {
    inputs: [{ name: "token", type: "address" }],
    name: "exists",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  // getSteps(address) → BondStep[] { rangeTo, price }
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getSteps",
    outputs: [
      {
        components: [
          { name: "rangeTo", type: "uint128" },
          { name: "price", type: "uint128" },
        ],
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  // tokens(uint256) → address
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "tokens",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  // tokenCount() → uint256
  {
    inputs: [],
    name: "tokenCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // creationFee() → uint256
  {
    inputs: [],
    name: "creationFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // getDetail(address) → returns full bond detail with current price info
  {
    inputs: [{ name: "token", type: "address" }],
    name: "getDetail",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "mintRoyalty", type: "uint16" },
          { name: "burnRoyalty", type: "uint16" },
          { name: "createdAt", type: "uint40" },
          { name: "reserveToken", type: "address" },
          { name: "reserveBalance", type: "uint256" },
        ],
        name: "bond",
        type: "tuple",
      },
      {
        components: [
          { name: "rangeTo", type: "uint128" },
          { name: "price", type: "uint128" },
        ],
        name: "steps",
        type: "tuple[]",
      },
      { name: "currentSupply", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;
