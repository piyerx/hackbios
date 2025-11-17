// Smart Contract Configuration
export const CONTRACT_ADDRESS = "0x39447A6EDc3A783B4C26a0fAa3B55eB74FD7EE19";

export const CONTRACT_ABI = [
  "event SpotListed(uint256 indexed spotId, address indexed host, string location, uint256 price)",
  "event SpotBooked(uint256 indexed spotId, address indexed driver, uint256 bookingEndTime)",
  "event PaymentClaimed(uint256 indexed spotId, address indexed host, uint256 amount)",
  "function listSpot(string calldata _location, uint256 _price) external",
  "function bookSpot(uint256 _spotId) external payable",
  "function claimPayment(uint256 _spotId) external",
  "function nextSpotId() public view returns (uint256)",
  "function getSpot(uint256 _spotId) public view returns (uint256 id, address host, string memory location, uint256 price, bool isBooked, address driver, uint256 bookingEndTime)"
];

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_NAME = "Sepolia Testnet";
