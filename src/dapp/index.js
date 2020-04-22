import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("purchase-insurance").addEventListener("click", () => {
      let flightAddress = DOM.elid("flight-airline-address").value;
      let flightName = DOM.elid("flight-name").value;
      let flightTimestamp = DOM.elid("flight-timestamp").value;
      let amount = DOM.elid("insurance-amount").value;

      // Write transaction
      contract.buyInsurance(
        flightAddress,
        flightName,
        flightTimestamp,
        amount,
        (error, result) => {
          display("Insurance", "Purchase insurance", [
            {
              label: "Bought",
              error: error,
              value: result.flight + result.flight + result.timestamp,
            },
          ]);
        }
      );
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flightAddress = DOM.elid("oracle-airline-address").value;
      let flightName = DOM.elid("oracle-airline-name").value;
      let flightTimestamp = DOM.elid("oracle-airline-timestamp").value;

      // Write transaction
      contract.fetchFlightStatus(
        flightAddress,
        flightName,
        flightTimestamp,
        (error, result) => {
          display("Oracles", "Trigger oracles", [
            {
              label: "Fetch Flight Status",
              error: error,
              value: result.flight + " " + result.timestamp,
            },
          ]);
        }
      );
    });

    // Withdraw
    DOM.elid("withdraw").addEventListener("click", () => {
      contract.withdraw((error, result) => {
        display("Balance transfer", "Withdraw Funds", [
          {
            label: "Passenger withdrew funds",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
