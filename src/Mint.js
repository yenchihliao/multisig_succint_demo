import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
// import config from "./config.json";
import config from "./config.json";

window.hash2Count = {};
window.hash2Signs = {};
const Mint = () => {
  // const [getNonceButtonText, setGetNonceButtonText] = useState('getNonce');
  // const [getHashButtonText, setGetHashButtonText] = useState('getHash');
  const [submitSignButtonText, setSubmitSignButtonText] = useState('authorize');
  const [txHash, setTxHash] = useState('unknow');
  const [account, setAccount] = useState('unknow');
  const [count, setCount] = useState('0');
  const [sigNeeded, setSigNeeded] = useState('threshold');

  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  function padTo32Bytes(str){
    var paddings = '';
    var num = 64 - str.length;
    for(var i = 0;i < num;i++){
      paddings += '0';
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
      GnosisSafeL2Abi['abi'],
      signer
    );
    const threshold = parseInt((await contract.getThreshold())['_hex'], 16);
    setAccount(await signer.getAddress());
    setSigNeeded(threshold);

    // input

    const to = padTo32Bytes(document.getElementById("to_mint").value);
    const amount = padTo32Bytes(parseInt(document.getElementById("amount_mint").value).toString(16));
    const nonce = await contract.nonce();
    // setNonce(nonce["_hex"].toString(16));
    const data = "0x40c10f19" + to + amount;

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      config.erc1363,
      0,
      data,
      0, 0, 0, 0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      nonce
    );
    console.log(data);

    if(! (dataHash in window.hash2Count)){
      window.hash2Count[dataHash] = 0;
      window.hash2Signs[dataHash] = '';
    }
    window.hash2Count[dataHash] += 1;
    setTxHash(dataHash);
    setCount(window.hash2Count[dataHash]);

    // check if enough signs to execute
    if(window.hash2Count[dataHash] >= threshold ){
      console.log(window.hash2Signs[dataHash] +
        padTo32Bytes((await signer.getAddress()).substr(2)) +
        padTo32Bytes("") +
        "01"
      );
      // execTransaction
      await contract.execTransaction(
        config.erc1363,
        0,
        data,
        0, 0, 0, 0,
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        window.hash2Signs[dataHash] +
          padTo32Bytes((await signer.getAddress()).substr(2)) +
          padTo32Bytes("") +
          "01"
      )
      setSubmitSignButtonText("executed");
    }else{
      // sign
      const dataHashBytes = ethers.utils.arrayify(dataHash);
      var flatSig = await signer.signMessage(dataHashBytes);
      if(flatSig[131] === 'b'){
         flatSig = flatSig.slice(0, 130);
         flatSig += '1f';
      }else{
         flatSig = flatSig.slice(0, 130);
         flatSig += '20';
      }
      window.hash2Signs[dataHash] += flatSig;
      console.log(window.hash2Signs[dataHash]);
      const recovered = ethers.utils.verifyMessage(dataHashBytes, flatSig);
      // setSigned(flatSig);
      console.log(recovered);
      // let sig = ethers.utils.splitSignature(result);
      // console.log(sig);
      setSubmitSignButtonText('signed');
    }
  }


  return(
    <div className='mint'>
    <h3> {"Mint"} </h3>

    to: <input type="text" id="to_mint" placeholder="address without '0x'" size="40" defaultValue="8127a3ea18b299971ec5b60ddeedd23a60ad462b"></input><br></br>
    amount: <input type="text" id="amount_mint" defaultValue="1000000000"></input><br></br>

    <button onClick={submitSignHandler}>{submitSignButtonText}</button>

    <div> <span className="outputs"> Account: {account}</span> </div>
    <div> <span className="outputs"> Signatures: {count} out of {sigNeeded} </span> </div>
    <div> <span className="outputs"> Digest: {txHash} </span> </div>
    </div>
  )
}

export default Mint;
