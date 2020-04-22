var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require("bignumber.js");

var Config = async function (accounts) {
  // These test addresses are useful when you need to add
  // multiple users in test scripts
  let testAddresses = [
    "0x8a5435b1c9cb485a657c44d399b916f392dc2409",
    "0xfa54dde08bb652e73a43a507ee224c8af6ed4dbd",
    "0x882b09296159657531b4350fbac6fbe548a51d2e",
    "0x1f0b6d9b6c92fbc733c05cfb5c7369f845d0e8b0",
    "0xcbff135922559d7519c9455d9c706921b4ec2f45",
    "0x6bb1ab31fb092bf2d8f6bb000df7e744222155ab",
    "0x35c7dcbf8e9ef277b8220ce63aa081829dbe20a7",
    "0x71967004472dbbc1ab0dd6f066d97d74f721515e",
    "0x1f5d10a039179f19cbe08d49c8ebcbf743be7929",
    "0x3ee9fce6eeb154300a2d9daa7a52fd586b0cf46f",
  ];

  let owner = accounts[0];
  let firstAirline = accounts[1];

  let flightSuretyData = await FlightSuretyData.new(
    firstAirline,
    "Test Airline"
  );
  let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

  return {
    owner: owner,
    firstAirline: firstAirline,
    weiMultiple: new BigNumber(10).pow(18),
    testAddresses: testAddresses,
    flightSuretyData: flightSuretyData,
    flightSuretyApp: flightSuretyApp,
  };
};

module.exports = {
  Config: Config,
};
