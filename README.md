# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Getting Started Locally

1. Run `npm install` in the project directory
2. Run `ganache-cli -a 50 -m "apple elevator enjoy audit little market slam siren rookie slide alone great"` to start a local blockchain server.
3. Open a new terminal and run `truffle migrate` to compile and deploy.

To use the dapp:

1. `npm run dapp`
2. Open `http://localhost:8000` in your browser.

To use the oracle server:

1. `npm run server`

## Testing

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Docs

- [Ethereum](https://www.ethereum.org/) - `solc v0.4.24` - Ethereum is a decentralized platform that runs smart contracts
- [Truffle Framework](http://truffleframework.com/) - `v5.0.2` - Truffle is the most popular development framework for Ethereum with a mission to make your life a whole lot easier.
- [web3](https://github.com/ethereum/web3.js/) - `v1.2.0` - a collection of libraries which allow you to interact with a local or remote ethereum node.
- [Node](https://nodejs.org/en/about/) - `v10.16.0` - a JavaScript runtime environment that executes JavaScript code outside of a web browser.
- [Express](https://expressjs.com/) - `v4.16.4` - a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
