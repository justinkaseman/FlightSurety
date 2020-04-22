const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require("fs");

module.exports = function (deployer, network, accounts) {
  let firstAirlineAddress = "0xf17f52151EbEF6C7334FAD080c5704D77216b732";
  let firstAirlineName = "JK Air";

  if (network === "development") {
    firstAirlineAddress = accounts[1];
    firstAirlineName = "Test Airline";
  }

  deployer
    .deploy(FlightSuretyData, firstAirlineAddress, firstAirlineName)
    .then(() => {
      return deployer
        .deploy(FlightSuretyApp, FlightSuretyData.address)
        .then(() => {
          let config = {
            localhost: {
              url: "http://localhost:8545",
              dataAddress: FlightSuretyData.address,
              appAddress: FlightSuretyApp.address,
            },
          };
          fs.writeFileSync(
            __dirname + "/../src/dapp/config.json",
            JSON.stringify(config, null, "\t"),
            "utf-8"
          );
          fs.writeFileSync(
            __dirname + "/../src/server/config.json",
            JSON.stringify(config, null, "\t"),
            "utf-8"
          );
        });
    });
};
