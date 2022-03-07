import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import config from "./config.json";

const Sign = () => {
  const [getNonceButtonText, setGetNonceButtonText] = useState('getNonce');
  const [getHashButtonText, setGetHashButtonText] = useState('getHash');
  const [submitSignButtonText, setSubmitSignButtonText] = useState('getHash');
  const [nonce, setNonce] = useState('unknow');
  const [txHash, setTxHash] = useState('unknow');
  const [signed, setSigned] = useState('unknow');
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  const submitSignHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();

    const dataHash = document.getElementById("dataHash").value;
    const result = await signer.signMessage(dataHash);
    console.log(result);
    let sig = ethers.utils.splitSignature(result);
    console.log(sig);

  }
  const getHashHandler = async () => {
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
    const to = document.getElementById("to").value;
    const value = document.getElementById("value").value;
    const data = document.getElementById("data").value;
    const nonce = document.getElementById("nonce").value;
    const result = await contract.getTransactionHash(
      to,
      value,
      data,
      0, 0, 0, 0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      nonce
    );
    setTxHash(result);
  }
  const getNonceHandler = async () => {
    console.log('bridging');
    // get signer
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
    const result = await contract.nonce();
    setNonce(result["_hex"].toString(16));
    // call contract method
    // const result = await contract.transferAndCall(
    //   config.homeMediator,
    //   ethers.utils.parseEther(buyNGX),
    //   "0x"
    // );
    // console.log(result['hash']);
    // if(result){
    //   setBuyButtonText('bridged');
    // }
    // setMyOutput('done');
  }
  return(
    <div className='getNonce'>
    <h3> {"Get Nonce"} </h3>
    <button onClick={getNonceHandler}>{getNonceButtonText}</button>
    <div> <span className="nonceOutput">{nonce}</span> </div>

    <h3> {"Get Hash"} </h3>
    to: <input type="text" id="to" placeholder="address" defaultValue="0x7ACa9263555A4333F55c66d135705fEdE8fC8bF6"></input><br></br>
    value: <input type="text" id="value" placeholder="int" defaultValue="100000000000000000"></input><br></br>
    data: <input type="text" id="data" placeholder="address" defaultValue="0x"></input><br></br>
    nonce: <input type="text" id="nonce" defaultValue="4"></input><br></br>
    <button onClick={getHashHandler}>{getHashButtonText}</button>
    <div> <span className="hashOutput">{txHash}</span> </div>

    <h3> {"Submit Sign"} </h3>
    dataHash: <input type="text" id="dataHash" defaultValue="0x7994dd34c5b1024460095686ded3b5228dba88adcd1683eaeb83f47ef908e002"></input><br></br>
    <button onClick={submitSignHandler}>{submitSignButtonText}</button>
    <div> <span className="signedOutput">{signed}</span> </div>
    </div>
  )
}

export default Sign;
