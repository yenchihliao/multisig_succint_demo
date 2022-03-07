import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import config from "./config.json";

const Sign = () => {
  // const [getNonceButtonText, setGetNonceButtonText] = useState('getNonce');
  // const [getHashButtonText, setGetHashButtonText] = useState('getHash');
  const [submitSignButtonText, setSubmitSignButtonText] = useState('getHash');
  const [execTransactionButtonText, setExecTransactionButtonText] = useState('execute');
  const [nonce, setNonce] = useState('unknow');
  const [txHash, setTxHash] = useState('unknow');
  const [signed, setSigned] = useState('unknow');
  const [account, setAccount] = useState('unknow');
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  const submitSignHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.multisigWallet,
      GnosisSafeL2Abi['abi'],
      signer
    );

    // input
    const to = document.getElementById("to").value;
    const value = document.getElementById("value").value;
    const data = document.getElementById("data").value;
    var nonce = document.getElementById("nonce").value;

    // fetch nonce if needed
    if(nonce == "latest"){
      nonce = await contract.nonce();
      setNonce(nonce["_hex"].toString(16));
    }else{
      setNonce(nonce);
    }

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      to,
      value,
      data,
      0, 0, 0, 0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      nonce
    );
    setTxHash(dataHash);


    // sign
    const dataHashBytes = ethers.utils.arrayify(dataHash);
    var flatSig = await signer.signMessage(dataHashBytes);
    console.log(flatSig.length);
    if(flatSig[131] == 'b'){
       flatSig = flatSig.slice(0, 130);
       flatSig += '1f';
    }else{
       flatSig = flatSig.slice(0, 130);
       flatSig += '20';
    }
    const recovered = ethers.utils.verifyMessage(dataHashBytes, flatSig);
    setSigned(flatSig);
    setAccount(recovered);
    // let sig = ethers.utils.splitSignature(result);
    // console.log(sig);
    setSubmitSignButtonText('Signed');
  }

  const execTransactionHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.multisigWallet,
      GnosisSafeL2Abi['abi'],
      signer
    );
    //contract call
    const to = document.getElementById("to").value;
    const value = document.getElementById("value").value;
    const data = document.getElementById("data").value;
    const signatures = document.getElementById("signatures").value;
    console.log(signatures);
    const result = await contract.execTransaction(
      to,
      value,
      data,
      0, 0, 0, 0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      signatures
    )
    setExecTransactionButtonText("executed");
  }

  return(
    <div className='Multisig Wallet'>

    <h3> {"Sign"} </h3>

    to: <input type="text" id="to" placeholder="address" defaultValue="0x7ACa9263555A4333F55c66d135705fEdE8fC8bF6"></input><br></br>
    value: <input type="text" id="value" placeholder="int" defaultValue="100000000000000000"></input><br></br>
    data: <input type="text" id="data" placeholder="address" defaultValue="0x"></input><br></br>
    nonce: <input type="text" id="nonce" defaultValue="latest"></input><br></br>

    <button onClick={submitSignHandler}>{submitSignButtonText}</button>

    <div> <span className="outputs"> account: {account}</span> </div>
    <div> <span className="outputs"> signed: {txHash}</span> </div>
    <div> <span className="outputs"> nonce: {nonce}</span> </div>
    <div> <span className="signedOutput">{signed}</span> </div>

    <h3>{"Execute"} </h3>
    <textarea rows="7" cols="64" id="signatures"></textarea>
    <button onClick={execTransactionHandler}>{execTransactionButtonText}</button>

    </div>
  )
}

export default Sign;
