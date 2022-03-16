import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
// import config from "./config.json";
import config from "./config.json";
import FirstPanel from "./FirstPanel";
import LastPanel from "./LastPanel";
import InfoPanel from "./InfoPanel";

const initial = async (setSigNeeded) => {
  const web3Modal = new Web3Modal();
  const connection = await web3Modal.connect();
  const provider = new ethers.providers.Web3Provider(connection);
  const signer = await provider.getSigner();
  // init contract
  const contract = new ethers.Contract(
    config.proxy,
    GnosisSafeL2Abi["abi"],
    signer
  );
  const threshold = parseInt((await contract.getThreshold())["_hex"], 16);
  setSigNeeded(threshold);
};

window.hash2Count = {};
window.hash2Signs = {};
const Mint = () => {
  const [submitSignButtonText, setSubmitSignButtonText] = useState("Creat");
  const [count, setCount] = useState("0");
  const [sigNeeded, setSigNeeded] = useState(0);
  const [toInput, setToInput] = useState(
    "0xC4c541a43D07245FbB933aE256D65BD9e9708143"
  );
  const [amountInput, setAmountInput] = useState("1");
  const [complete, setComplete] = useState(false);
  const [record, setRecord] = useState([]);

  // first get threshold
  useEffect(() => {
    initial(setSigNeeded);
  }, []);

  function padTo32Bytes(str) {
    var paddings = "";
    var num = 64 - str.length;
    for (var i = 0; i < num; i++) {
      paddings += "0";
    }
    return paddings + str;
  }

  const submitSignHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.proxy,
      GnosisSafeL2Abi["abi"],
      signer
    );
    const threshold = parseInt((await contract.getThreshold())["_hex"], 16);
    setSigNeeded(threshold);

    // input
    const to = padTo32Bytes(toInput.slice(2));
    const amount = padTo32Bytes(
      (parseInt(amountInput) * 10 ** 18).toString(16)
    );

    const nonce = await contract.nonce();
    const data = "0x40c10f19" + to + amount;

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      config.erc1363,
      0,
      data,
      0,
      0,
      0,
      0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      nonce
    );

    if (!(dataHash in window.hash2Count)) {
      window.hash2Count[dataHash] = 0;
      window.hash2Signs[dataHash] = "";
    }
    window.hash2Count[dataHash] += 1;

    // check if enough signs to execute
    if (window.hash2Count[dataHash] >= threshold) {
      console.log(
        window.hash2Signs[dataHash] +
          padTo32Bytes((await signer.getAddress()).substr(2)) +
          padTo32Bytes("") +
          "01"
      );
      // execTransaction
      const tx = await contract.execTransaction(
        config.erc1363,
        0,
        data,
        0,
        0,
        0,
        0,
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        window.hash2Signs[dataHash] +
          padTo32Bytes((await signer.getAddress()).substr(2)) +
          padTo32Bytes("") +
          "01"
      );

      await tx.wait();

      let newSign = { address: await signer.getAddress(), msg: dataHash };
      setRecord((oldArray) => [...oldArray, newSign]);
      setSubmitSignButtonText("Executed");
      setComplete(true);
    } else {
      // sign
      const dataHashBytes = ethers.utils.arrayify(dataHash);
      var flatSig = await signer.signMessage(dataHashBytes);

      if (flatSig[131] === "b") {
        flatSig = flatSig.slice(0, 130);
        flatSig += "1f";
      } else {
        flatSig = flatSig.slice(0, 130);
        flatSig += "20";
      }
      window.hash2Signs[dataHash] += flatSig;
      const recovered = ethers.utils.verifyMessage(dataHashBytes, flatSig);
      console.log(recovered);

      // 如果成功才更動資訊
      if (flatSig) {
        setCount(window.hash2Count[dataHash]);
        let newSign = { address: await signer.getAddress(), msg: dataHash };
        setRecord((oldArray) => [...oldArray, newSign]);
      }

      setSubmitSignButtonText("Confirm");
    }
  };

  return (
    <div className="mint">
      <div className="mint_section">
        <h3>Mint to TokenPool</h3>
        to:{" "}
        <input
          type="text"
          id="to_mint"
          placeholder="TokenPool的地址"
          size="40"
          value={toInput}
          onChange={(e) => setToInput(e.target.value)}
        ></input>
        <br></br>
        amount:{" "}
        <input
          type="text"
          id="amount_mint"
          placeholder="Mint的數量"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
        ></input>
        <br></br>
        <button onClick={submitSignHandler} disabled={complete}>
          {submitSignButtonText}
        </button>
      </div>
      <div className="mint_section">
        <p>
          簽署進度( {count} out of {sigNeeded})
        </p>
        <div>
          <FirstPanel created={record.length > 0 ? true : false} />
          <InfoPanel data={record} />
        </div>
      </div>
    </div>
  );
};

export default Mint;
