1. 🚀 The MVP Idea (The "What & Why")
Project Name: ETHPark
The Pitch: ETHPark is a decentralized, peer-to-peer parking marketplace. Think of it like "Airbnb for parking spots," but without a central company.
The Problem It Solves:
For Drivers: Finding parking in busy areas is difficult, expensive, and stressful.
For Hosts: People have empty driveways, private spots, or garage spaces that sit unused, generating no value.
Our Solution (The MVP):
A simple web app that connects "Hosts" (people with spots) directly to "Drivers" (people who need spots).
Hosts can list their spot's location and price (in ETH).
Drivers can see available spots on a simple list or map and book them.
The "ETH Track" Secret Weapon (This is how we win):
We are not a company. We are a protocol.
The most important part is the Smart Contract Escrow.
In a normal app (like ParkWhiz), you pay the company, and the company pays the Host. You have to trust them to handle the money correctly.
In ETHPark, the Driver pays the money directly to our Smart Contract. The contract is a piece of code that acts like a robot-lawyer. It holds the money safely in escrow and will only release it to the Host after the booking time is over.
This is "trustless." Neither the Driver nor the Host has to trust each other or us. They only have to trust the code, which is public on the blockchain.
Hackathon Tracks Hit:
Traffic: We are directly addressing urban traffic congestion by making parking more efficient.
ETH-Based Track: We are using an Ethereum smart contract to create a decentralized, trustless, peer-to-peer payment system.

2. 🛠️ The Working (The "How" - Tech View)
We have two main parts to build.
A) The Smart Contract (The "Backend / Brain")
Language: Solidity
Network: Ethereum Testnet (like Sepolia). We'll use free test ETH for the demo.
What it does: This contract is our public database and payment logic. It needs to store a list of all parking spots and manage the money.
Key Data:
struct ParkingSpot: A "template" for a parking spot. It must hold:
host_address (the wallet of the spot owner)
location_string (e.g., "123 Main St")
price (how much it costs in ETH)
isBooked (a true/false flag)
driver_address (the wallet of the person who booked it)
bookingEndTime (the timestamp when the booking is over)
Key Functions (The things we can "call"):
listSpot(location, price): A function for the Host. When they call this, it creates a new ParkingSpot in the contract and lists it for rent.
bookSpot(spot_id): A payable function for the Driver. They call this and send ETH with it. The function checks if the ETH amount is correct, then marks the spot as isBooked, stores the Driver's wallet, and sets the bookingEndTime.
claimPayment(spot_id): A function for the Host. They can only call this after the bookingEndTime has passed. The function checks the time, and if it's valid, it transfers the ETH from the contract's escrow to the Host's wallet.
B) The Frontend (The "Frontend / Face")
Technology: A simple web app (React/Next.js is perfect for this).
Key Tool: We will use a library like ethers.js to connect the website to the blockchain and a tool like Scaffold-ETH 2 or Thirdweb to get started fast.
What it does: A simple website that lets people use our smart contract without knowing code.
Key Views (Pages):
Main/Driver View:
Shows a "Connect Wallet" (MetaMask) button.
Reads all the available (isBooked == false) spots from our smart contract and displays them in a simple list.
Each spot has a "BOOK" button. Clicking this calls the bookSpot() function and pops up MetaMask for payment.
Host View (a separate page/tab):
A simple form: "Location" and "Price."
A button: "List My Spot." Clicking this calls the listSpot() function.
A dashboard that shows the Host's own spots and a "CLAIM PAYMENT" button for any that are ready.

3. 🌊 The Workflow (The "User Journey" / Demo Script)
This is the step-by-step story we will tell the judges.
Actor 1: Alice (The Host - she has an empty driveway).
Actor 2: Bob (The Driver - he is looking for parking).
Here is the flow:
Alice (Host): Alice goes to our ETHPark website. She connects her MetaMask wallet. She goes to the "Host" page, types "123 Main St" and "0.01 ETH" into the form, and clicks "List Spot." She confirms a small transaction in her wallet. Her spot is now live on the blockchain.
Bob (Driver): Bob is driving around. He opens our website on his phone. He connects his wallet. He instantly sees "123 Main St - 0.01 ETH" on the list of available spots.
Bob (Driver): He clicks "BOOK." His MetaMask pops up, asking him to confirm a payment of 0.01 ETH.
The "Magic" (Escrow): Bob confirms. The 0.01 ETH is sent to our Smart Contract, not to Alice. The app now shows the spot as "BOOKED." Alice sees this on her dashboard too.
Parking: Bob parks his car. (For the demo, we will set the bookingEndTime to be just 2 minutes after booking).
The Payoff: 2 minutes pass. Bob leaves.
Alice (Host): Alice opens her dashboard. The "CLAIM PAYMENT" button for her spot is now active. She clicks it.
The End: The Smart Contract checks the time, sees the booking is over, and instantly transfers the 0.01 ETH from its escrow to Alice's wallet. The demo is complete.
This plan is simple, powerful, and directly targets two of the hackathon's tracks.