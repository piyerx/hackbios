// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ParkingMarketplace {
    struct ParkingSpot {
        uint256 id;
        address payable host;
        string location;
        uint256 pricePerHour;
        bool isBooked;
        address driver;
        uint256 bookingEndTime;
    }

    mapping(uint256 => ParkingSpot) public spots;
    uint256 public nextSpotId;

    event SpotListed(uint256 indexed spotId, address indexed host, string location, uint256 price);
    event SpotBooked(uint256 indexed spotId, address indexed driver, uint256 bookingEndTime);
    event PaymentClaimed(uint256 indexed spotId, address indexed host, uint256 amount);

    function listSpot(string calldata _location, uint256 _pricePerHour) external {
        require(bytes(_location).length > 0, "Location required");
        require(_pricePerHour > 0, "Price must be greater than 0");

        spots[nextSpotId] = ParkingSpot({
            id: nextSpotId,
            host: payable(msg.sender),
            location: _location,
            pricePerHour: _pricePerHour,
            isBooked: false,
            driver: address(0),
            bookingEndTime: 0
        });

        emit SpotListed(nextSpotId, msg.sender, _location, _pricePerHour);
        nextSpotId++;
    }

    function bookSpot(uint256 _spotId, uint256 _hours) external payable {
        require(_spotId < nextSpotId, "Invalid spot ID");
        ParkingSpot storage spot = spots[_spotId];
        require(!spot.isBooked, "Spot already booked");
        require(_hours > 0, "Hours must be greater than 0");
        require(msg.value >= spot.pricePerHour * _hours, "Insufficient payment");

        spot.isBooked = true;
        spot.driver = msg.sender;
        spot.bookingEndTime = block.timestamp + (_hours * 1 hours);

        emit SpotBooked(_spotId, msg.sender, spot.bookingEndTime);
    }

    function claimPayment(uint256 _spotId) external {
        require(_spotId < nextSpotId, "Invalid spot ID");
        ParkingSpot storage spot = spots[_spotId];
        require(spot.host == msg.sender, "Only host can claim");
        require(spot.isBooked, "Spot not booked");
        require(block.timestamp >= spot.bookingEndTime, "Booking not ended");

        uint256 amount = spot.pricePerHour;
        spot.isBooked = false;
        spot.driver = address(0);
        spot.bookingEndTime = 0;

        spot.host.transfer(amount);
        emit PaymentClaimed(_spotId, msg.sender, amount);
    }

    function getSpot(uint256 _spotId) external view returns (
        uint256 id,
        address host,
        string memory location,
        uint256 price,
        bool isBooked,
        address driver,
        uint256 bookingEndTime
    ) {
        require(_spotId < nextSpotId, "Invalid spot ID");
        ParkingSpot memory spot = spots[_spotId];
        return (
            spot.id,
            spot.host,
            spot.location,
            spot.pricePerHour,
            spot.isBooked,
            spot.driver,
            spot.bookingEndTime
        );
    }
}
