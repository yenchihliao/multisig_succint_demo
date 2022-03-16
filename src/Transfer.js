import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import erc1363 from "./abi/erc1363Abi.json";
import config from "./config.json";
import PropTypes from "prop-types";
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

const padTo32Bytes = (str) => {
  let paddings = "";
  let num = 64 - str.length;
  for (let i = 0; i < num; i++) {
    paddings += "0";
  }
  return paddings + str;
};

const Transfer = ({ show }) => {
  const [submitSignButtonText, setSubmitSignButtonText] = useState("Create");
  const [count, setCount] = useState(0);
  const [sigNeeded, setSigNeeded] = useState(0);
  const [poolFound, setPoolFound] = useState(0);
  const [tokenInput, setTokenInput] = useState(config.erc1363);
  // default value for demo, coulde be change
  const [toInput, setToInput] = useState(
    "0xB7B286b5a4a9004Ef972864469A0C49E35B505E4"
  );
  const [amountInput, setAmountInput] = useState("1");
  const [complete, setComplete] = useState(false);
  const [record, setRecord] = useState([]);
  const [hash2Count, setHash2Count] = useState({});
  const [hash2Signs, setHash2Signs] = useState([]);

  // get initial Pool fund
  useEffect(() => {
    fetchPoolHandler();
    initial(setSigNeeded);
  }, []);

  const fetchPoolHandler = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.erc1363,
      erc1363["abi"],
      signer
    );

    setPoolFound(
      parseInt((await contract.balanceOf(config.tokenPool))["_hex"], 16) /
        10 ** 18
    );
  };

  const submitSignHandler = async () => {
    // temp hash2Count, hash2Signs
    let currentCount = 0;
    let currentSigns = [];

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

    // input
    const token = padTo32Bytes(tokenInput.slice(2));
    const to = padTo32Bytes(toInput.slice(2));
    const amount = padTo32Bytes(
      (parseInt(amountInput) * 10 ** 18).toString(16)
    );

    const nonce = await contract.nonce();
    const data = "0xbeabacc8" + token + to + amount;

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      config.tokenPool,
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
      currentSigns = [...hash2Signs];
    } else {
      currentCount += 1;
    }

    // check if enough signs to execute
    if (currentCount >= sigNeeded) {
      // console.log(
      //   currentSigns +
      //     padTo32Bytes((await signer.getAddress()).substr(2)) +
      //     padTo32Bytes("") +
      //     "01"
      // );

      currentSigns.push(
        (await signer.getAddress()).toLowerCase() +
          padTo32Bytes((await signer.getAddress()).toLowerCase().substr(2)) +
          padTo32Bytes("") +
          "01"
      );
      currentSigns.sort();
      let signatures = "0x";
      for (let i = 0; i < sigNeeded; i++) {
        signatures += currentSigns[i].substr(42);
      }

      // execTransaction
      const tx = await contract.execTransaction(
        config.tokenPool,
        0,
        data,
        0,
        0,
        0,
        0,
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        signatures
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
      fetchPoolHandler();
    } else {
      // sign
      const dataHashBytes = ethers.utils.arrayify(dataHash);
      let flatSig = await signer.signMessage(dataHashBytes);

      if (flatSig[131] === "b") {
        flatSig = flatSig.slice(0, 130);
        flatSig += "1f";
      } else {
        flatSig = flatSig.slice(0, 130);
        flatSig += "20";
      }

      currentSigns.push(
        (await signer.getAddress()).toLowerCase() + flatSig.substr(2)
      );

      // 如果成功才更動資訊
      if (flatSig) {
        setHash2Count((old) => ({
          ...old,
          [dataHash]: currentCount,
        }));

        setHash2Signs([...currentSigns]);

        setCount(currentCount);
        let newSign = { address: await signer.getAddress(), msg: dataHash };
        setRecord((oldArray) => [...oldArray, newSign]);
      }
      setSubmitSignButtonText("Confirm");
    }
  };

  return (
    <div className={show ? "transfer hide" : "transfer"}>
      <div className="mint_section">
        <h3>Transfer</h3>
        <div className="mint_section_data">
          <span className="mint_section_data_title">Pool found:</span>
          <span className="mint_section_data_content">{poolFound}</span>
          <button className="mint_section_data_btn" onClick={fetchPoolHandler}>
            renew
          </button>
        </div>
        <div className="mint_section_data">
          <span className="mint_section_data_title">token:</span>
          <input
            type="text"
            id="token_transfer"
            placeholder="address without '0x'"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="mint_section_data_content"
          ></input>
        </div>
        <div className="mint_section_data">
          <span className="mint_section_data_title">to:</span>
          <input
            type="text"
            id="to_tranfer"
            placeholder="address"
            value={toInput}
            onChange={(e) => setToInput(e.target.value)}
            className="mint_section_data_content"
          ></input>
        </div>
        <div className="mint_section_data">
          <span className="mint_section_data_title">amount:</span>
          <input
            type="text"
            id="amount_tranfer"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="mint_section_data_content"
          ></input>
        </div>
        <button onClick={submitSignHandler}>{submitSignButtonText}</button>
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

Transfer.propTypes = {
  show: PropTypes.bool,
};

export default Transfer;
