const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const web3 = require("web3");

module.exports = async function (deployer, network, accounts) {
  // Add funding for airline and flights for the client dapp to function
  if (network === "development") {
    const app = await FlightSuretyApp.deployed();
    const data = await FlightSuretyData.deployed();
    await data.authorizeCaller(FlightSuretyApp.address);
    console.log("Funding first airline...");
    await app.fund(accounts[1], {
      from: accounts[1],
      value: web3.utils.toWei("10", "ether"),
    });

    await app.registerFlight("1332", "OAK -> HOU", 1587423057711, {
      from: accounts[1],
    });
    console.log("Registering flight #1...");

    await app.registerFlight("1334", "SFO -> MEL", 1587423397911, {
      from: accounts[1],
    });
    console.log("Registering flight #2...");

    await app.registerFlight("1334", "SFO -> LAX", 1587343397911, {
      from: accounts[1],
    });
    console.log("Registering flight #3...");
  }
};
