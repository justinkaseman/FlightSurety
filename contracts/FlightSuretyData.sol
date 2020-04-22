pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";


contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedCallers; // Sets authorized App contracts

    struct Airline {
        string name;
        bool exists;
        bool registered;
        bool funded;
    }
    mapping(address => Airline) private airlines;
    mapping(address => address[]) registrationVoting; // Multisig voting to register an airline once >4 registered
    uint256 private numRegisteredAirlines = 0; // Number of registered airlines
    uint256 private numFundedAirlines = 0; // Number of funded airlines

    struct Flight {
        bool exists;
        string flight;
        string description;
        uint8 statusCode;
        uint256 timestamp;
        address airline;
    }

    mapping(bytes32 => Flight) private flights; // Registered flights

    struct Insurance {
        address passenger;
        uint256 pricePaid;
    }
    mapping(bytes32 => Insurance[]) private insurances; // Purchased insurance for each flight

    mapping(address => uint256) private insureeFunds; // Credit paid out to insurees that is available to be withdrawn

    /********************************************************************************************/
    /*                                       CONTRUCTOR                                         */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address firstAirlineAddress, string firstAirlineName) public {
        airlines[firstAirlineAddress] = Airline(
            firstAirlineName,
            true,
            true,
            false
        );
        numRegisteredAirlines = numRegisteredAirlines.add(1);
        contractOwner = msg.sender;
    }

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    // TODO: finish
    event OperationalChange(bool status);
    event CallerAuthorized(address caller);
    event AirlineQueued(address airline);
    event AirlineRegistered(address airline, uint256 total);
    event AirlineFunded(address airline, uint256 total);
    event FlightRegistered(
        address airline,
        string flight,
        uint256 timestamp,
        string description
    );

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _;
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    /**
     * @dev Modifier that checks if the caller is authorized to use this data contract
     */
    modifier requireCallerAuthorized() {
        require(
            authorizedCallers[msg.sender] == true,
            "Caller is not authorized"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */

    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */

    function setOperatingStatus(bool mode) external requireContractOwner {
        require(mode != operational, "Status is already set on this mode");
        operational = mode;
        emit OperationalChange(mode);
    }

    function isCallerRegistered(address contractAddress)
        external
        view
        returns (bool)
    {
        return authorizedCallers[contractAddress];
    }

    function authorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        authorizedCallers[contractAddress] = true;
        emit CallerAuthorized(contractAddress);
    }

    function deauthorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedCallers[contractAddress];
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    /**
     * @dev Returns information on an airline
     *
     */
    function getAirline(address airlineAddress)
        external
        view
        requireIsOperational
        requireCallerAuthorized
        returns (string name, bool exists, bool registered, bool funded)
    {
        require(
            airlines[airlineAddress].exists == true,
            "Airline does not exist"
        );
        Airline memory airline = airlines[airlineAddress];
        name = airline.name;
        exists = airline.exists;
        registered = airline.registered;
        funded = airline.funded;
        return (name, exists, registered, funded);
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */

    function registerAirline(
        address airlineAddress,
        string airlineName,
        address sender
    ) external requireIsOperational requireCallerAuthorized {
        require(
            airlines[airlineAddress].exists == false,
            "Airline already exists"
        );
        if (numRegisteredAirlines < 4) {
            airlines[airlineAddress] = Airline(airlineName, true, true, false);
            numRegisteredAirlines = numRegisteredAirlines.add(1);
            emit AirlineQueued(airlineAddress);
            emit AirlineRegistered(airlineAddress, numRegisteredAirlines);
        } else {
            airlines[airlineAddress] = Airline(airlineName, true, false, false);
            registrationVoting[airlineAddress].push(sender);
            emit AirlineQueued(airlineAddress);
        }
    }

    /**
     * @dev Check is an address has already bought insurance for a given flight
     *
     */

    function hasVote(address sender, address airline)
        public
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool result)
    {
        address[] memory _votes = registrationVoting[airline];

        for (uint256 i = 0; i < _votes.length; i++) {
            if (_votes[i] == sender) {
                result = true;
                break;
            }
        }

        return result;
    }

    /**
     * @dev Add a vote to register an airline from a registered and funded airline
     *
     */

    function vote(address sender, address airlineAddress)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256 votes)
    {
        require(
            airlines[airlineAddress].registered == false,
            "Airline is already registered"
        );
        require(
            hasVote(sender, airlineAddress) == false,
            "This address has already voted for this airline to be registered"
        );

        registrationVoting[airlineAddress].push(sender);
        votes = registrationVoting[airlineAddress].length;

        if (votes > numRegisteredAirlines.div(2)) {
            airlines[airlineAddress].registered = true;
            numRegisteredAirlines = numRegisteredAirlines.add(1);
            emit AirlineRegistered(airlineAddress, numRegisteredAirlines);
        }

        return votes;
    }

    /**
     * @dev Check is an address has already bought insurance for a given flight
     *
     */

    function getInsurance(
        address airline,
        string memory flight,
        uint256 timestamp,
        address sender
    )
        public
        view
        requireIsOperational
        requireCallerAuthorized
        returns (bool result, uint256 amount)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        Insurance[] memory _flightInsurances = insurances[flightKey];

        for (uint256 i = 0; i < _flightInsurances.length; i++) {
            if (_flightInsurances[i].passenger == sender) {
                result = true;
                amount = _flightInsurances[i].pricePaid;
                break;
            }
        }

        return (result, amount);
    }

    /**
     * @dev Buy insurance for a flight
     *
     */

    function buy(
        address airline,
        string flight,
        uint256 timestamp,
        address sender,
        uint256 value
    ) external requireIsOperational requireCallerAuthorized {
        (bool status, ) = getInsurance(airline, flight, timestamp, sender);
        require(
            status == false,
            "This passenger has already bought insurance for this flight!"
        );

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        Insurance memory insurance = Insurance({
            passenger: sender,
            pricePaid: value
        });

        insurances[flightKey].push(insurance);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(
        address airline,
        string flight,
        uint256 timestamp,
        uint256 amount
    ) external requireIsOperational requireCallerAuthorized {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        Insurance[] memory _insurancesToCredit = insurances[flightKey];

        for (uint256 i = 0; i < _insurancesToCredit.length; i++) {
            address insuree = _insurancesToCredit[i].passenger;
            uint256 pricePaid = _insurancesToCredit[i].pricePaid;
            uint256 _payMultiplier = pricePaid.div(amount);
            uint256 _priceToPay = pricePaid.add(_payMultiplier);
            insureeFunds[insuree] = insureeFunds[insuree].add(_priceToPay);
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function withdrawAll(address insuree)
        external
        requireIsOperational
        requireCallerAuthorized
        returns (uint256)
    {
        require(
            insuree == tx.origin,
            "Only externally owned accounts may withdraw funds"
        );
        require(insureeFunds[insuree] > 0, "No funds available to withdraw");
        uint256 _amount = insureeFunds[insuree];
        insureeFunds[insuree] = insureeFunds[insuree].sub(_amount);
        return _amount;
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */

    function fund(address airlineAddress)
        external
        payable
        requireIsOperational
        requireCallerAuthorized
    {
        require(
            airlines[airlineAddress].exists == true,
            "Airline does not exist"
        );
        require(
            airlines[airlineAddress].registered == true,
            "Airline is not yet registered"
        );
        require(
            airlines[airlineAddress].funded == false,
            "Airline is already funded"
        );
        airlines[airlineAddress].funded = true;
        numFundedAirlines = numFundedAirlines.add(1);
        emit AirlineFunded(airlineAddress, numFundedAirlines);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */

    function registerFlight(
        address from,
        string flight,
        string description,
        uint256 timestamp
    ) external requireIsOperational requireCallerAuthorized {
        bytes32 flightKey = getFlightKey(from, flight, timestamp);
        require(flights[flightKey].exists == false, "Flight already exists");
        flights[flightKey] = Flight({
            exists: true,
            flight: flight,
            description: description,
            statusCode: 0,
            timestamp: timestamp,
            airline: from
        });
        emit FlightRegistered(from, flight, timestamp, description);
    }

    /**
     * @dev Update flight status from oracle response
     *
     */

    function updateFlight(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 statusCode
    )
        external
        requireIsOperational
        requireCallerAuthorized
        returns (bool complete)
    {
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        require(flights[flightKey].exists == true, "Flight does not exist");
        require(
            flights[flightKey].statusCode == 0,
            "Flight has already been processed"
        );
        flights[flightKey].statusCode = statusCode;
        complete = true;
        return complete;
    }

    /**
     * @dev Internal function for generating a flight's key
     *
     */

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    function() external payable {
        // fund();
    }
}
