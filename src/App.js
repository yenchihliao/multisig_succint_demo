import "./App.css";
import Mint from "./Mint";
import Transfer from "./Transfer";
import { useState } from "react";
import "./app.scss";

function App() {
  const [current, setCurrent] = useState(true);

  return (
    <div className="Multi-Signature Wallet">
      <div className="tabs">
        <div
          className={current ? "tab current" : "tab"}
          onClick={() => setCurrent(true)}
        >
          Mint
        </div>
        <div
          className={current ? "tab" : "tab current"}
          onClick={() => setCurrent(false)}
        >
          Transfer
        </div>
      </div>
      {current ? <Mint /> : <Transfer />}
    </div>
  );
}

export default App;
