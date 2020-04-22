var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");
var web3 = require("web3");

const Web3 = new web3("http://127.0.0.1:8545/");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    let status = await config.flightSuretyData.isOperational.call();
    if (status) {
      await config.flightSuretyData.setOperatingStatus(false);
    }

    let reverted = false;
    try {
      await config.flightSuretyData.getAirline(config.firstAirline);
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) First airline is registered when contract is deployed.", async () => {
    const airline = await config.flightSuretyApp.getAirline.call(
      config.firstAirline
    );
    assert.equal(
      airline.registered,
      true,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    let reverted = false;
    // ACT
    try {
      await config.flightSuretyApp.registerAirline(
        newAirline,
        "Test Airline 2",
        {
          from: config.firstAirline,
        }
      );
    } catch (e) {
      reverted = true;
    }

    // ASSERT
    assert.equal(
      reverted,
      true,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) can register an airline using registerAirline() if it has been funded", async () => {
    let reverted = false;

    await config.flightSuretyApp.fund(config.firstAirline, {
      value: web3.utils.toWei("10", "ether"),
    });

    let newAirline = accounts[2];

    try {
      await config.flightSuretyApp.registerAirline(
        newAirline,
        "Test Airline 2",
        {
          from: config.firstAirline,
          nonce: await Web3.eth.getTransactionCount(config.firstAirline),
        }
      );
    } catch (e) {
      console.log(e);
      reverted = true;
    }

    assert.equal(
      reverted,
      false,
      "Airline should be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines", async () => {
    await config.flightSuretyApp.registerAirline(
      accounts[3],
      "Test Airline 3",
      {
        from: config.firstAirline,
      }
    );
    await config.flightSuretyApp.registerAirline(
      accounts[4],
      "Test Airline 4",
      {
        from: config.firstAirline,
      }
    );
    await config.flightSuretyApp.registerAirline(
      accounts[5],
      "Test Airline 5",
      {
        from: config.firstAirline,
      }
    );
    const fifthAirline = await config.flightSuretyApp.getAirline.call(
      accounts[5]
    );

    assert.equal(
      fifthAirline.registered,
      false,
      "The 5th airline registered should require multi-party consensus"
    );

    // Fund and vote
    await config.flightSuretyApp.fund(accounts[2], {
      from: accounts[2],
      value: web3.utils.toWei("10", "ether"),
      nonce: await Web3.eth.getTransactionCount(accounts[2]),
    });
    await config.flightSuretyApp.vote(accounts[5], {
      from: accounts[2],
      nonce: await Web3.eth.getTransactionCount(accounts[2]),
    });
    await config.flightSuretyApp.fund(accounts[3], {
      from: accounts[3],
      value: web3.utils.toWei("10", "ether"),
      nonce: await Web3.eth.getTransactionCount(accounts[3]),
    });
    await config.flightSuretyApp.vote(accounts[5], {
      from: accounts[3],
      nonce: await Web3.eth.getTransactionCount(accounts[3]),
    });

    const fifthAirlineOnceVoted = await config.flightSuretyApp.getAirline.call(
      accounts[5]
    );

    assert.equal(
      fifthAirlineOnceVoted.registered,
      true,
      "The 5th airline registered should require multi-party consensus"
    );
  });

  it("(airline) Airline can be registered, but does not participate in contract until it submits funding of 10 ether", async () => {
    let reverted = false;
    // The previous test registered this airline, but it has not been funded
    try {
      await config.flightSuretyApp.registerFlight(
        "1332",
        "OAK -> HOU",
        1587423057711,
        {
          from: accounts[4],
        }
      );
    } catch (e) {
      reverted = true;
    }
    assert.equal(
      reverted,
      true,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });
});
