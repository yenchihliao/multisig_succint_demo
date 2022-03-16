import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import config from "./config.json";
import FirstPanel from "./FirstPanel";
import LastPanel from "./LastPanel";
import InfoPanel from "./InfoPanel";
import PropTypes from "prop-types";

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

const padTo32Bytes = (str) => {
  var paddings = "";
  var num = 64 - str.length;
  for (var i = 0; i < num; i++) {
    paddings += "0";
  }
  return paddings + str;
};

const Mint = ({ show }) => {
  const [submitSignButtonText, setSubmitSignButtonText] = useState("Creat");
  const [count, setCount] = useState(0);
  const [sigNeeded, setSigNeeded] = useState(0);
  const [toInput, setToInput] = useState(config.tokenPool);
  const [amountInput, setAmountInput] = useState("1");
  const [complete, setComplete] = useState(false);
  const [record, setRecord] = useState([]);
  const [hash2Count, setHash2Count] = useState({});
  const [hash2Signs, setHash2Signs] = useState({});

  // initial get threshold
  useEffect(() => {
    initial(setSigNeeded);
  }, []);

  const submitSignHandler = async () => {
    // temp hash2Count, hash2Signs
    let currentCount = 0;
    let currentSigns = "";

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
    // const threshold = parseInt((await contract.getThreshold())["_hex"], 16);
    // setSigNeeded(threshold);

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

    if (dataHash in hash2Count) {
      currentCount = hash2Count[dataHash] + 1;
      currentSigns = hash2Signs[dataHash];
    } else {
      currentCount += 1;
    }

    if (currentCount >= sigNeeded) {
      // console.log(
      //   currentSigns +
      //     padTo32Bytes((await signer.getAddress()).substr(2)) +
      //     padTo32Bytes("") +
      //     "01"
      // );
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
        currentSigns +
          padTo32Bytes((await signer.getAddress()).substr(2)) +
          padTo32Bytes("") +
          "01"
      );

      await tx.wait();

      setHash2Count((old) => ({
        ...old,
        [dataHash]: currentCount,
      }));

      let newSign = { address: await signer.getAddress(), msg: dataHash };
      setRecord((oldArray) => [...oldArray, newSign]);

      setCount(currentCount);
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

      setHash2Signs({
        ...hash2Signs,
        [dataHash]: (currentSigns += flatSig),
      });

      // 如果成功才更動資訊
      if (flatSig) {
        setHash2Count((old) => ({
          ...old,
          [dataHash]: currentCount,
        }));

        setCount(currentCount);
        let newSign = { address: await signer.getAddress(), msg: dataHash };
        setRecord((oldArray) => [...oldArray, newSign]);
      }

      setSubmitSignButtonText("Confirm");
    }
  };

  return (
    <div className={show ? "mint" : "mint hide"}>
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
        {/* <div>
        {" "}
        <span className="outputs"> Account: {account}</span>{" "}
      </div> */}
        {/* <div>
        <span className="outputs">
          目前已有的授權: {count} out of {sigNeeded}
        </span>
      </div> */}
        {/* <div>
        {" "}
        <span className="outputs"> Digest: {txHash} </span>{" "}
      </div> */}
      </div>
      <div className="mint_section">
        <p>
          簽署進度( {count} out of {sigNeeded})
        </p>
        <div>
          <FirstPanel created={record.length > 0 ? true : false} />
          <InfoPanel data={record} completed={complete} />
          {complete ? <LastPanel /> : <></>}
        </div>
      </div>
    </div>
  );
};

Mint.propTypes = {
  show: PropTypes.bool,
};
export default Mint;
