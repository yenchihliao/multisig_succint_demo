import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import erc1363 from "./abi/erc1363Abi.json";
import config from "./config.json";
// import config from "./config.json";

const Transfer = () => {
  // const [getNonceButtonText, setGetNonceButtonText] = useState('getNonce');
  // const [getHashButtonText, setGetHashButtonText] = useState('getHash');
  const [submitSignButtonText, setSubmitSignButtonText] = useState('authorize');
  const [txHash, setTxHash] = useState('N/A');
  const [account, setAccount] = useState('unknown');
  const [count, setCount] = useState('0');
  const [sigNeeded, setSigNeeded] = useState('threshold');
  const [poolFound, setPoolFound] = useState('N/A');

  const fetchPoolHandler = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.erc1363,
      erc1363['abi'],
      signer
    );
    // console.log();
    setPoolFound(parseInt((await contract.balanceOf(config.tokenPool))["_hex"], 16));
  }
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
    setSigNeeded(threshold);
    setAccount(await signer.getAddress());

    // input
    const token = padTo32Bytes(document.getElementById("token_transfer").value);
    const to = padTo32Bytes(document.getElementById("to_tranfer").value);
    const amount = padTo32Bytes(parseInt(document.getElementById("amount_tranfer").value).toString(16));
    const nonce = await contract.nonce();
    // setNonce(nonce["_hex"].toString(16));
    const data = "0xbeabacc8" + token +  to + amount; // keccak256("transfer(address,address,uint256)")

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      config.tokenPool,
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
        config.tokenPool,
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
      setAccount(recovered);
      // let sig = ethers.utils.splitSignature(result);
      // console.log(sig);
      setSubmitSignButtonText('signed');
    }
  }


  return(
    <div className='transfer'>
    <h3> {"Transfer"} </h3>
    <div> <span className="outputs"> Pool found: {poolFound} </span>
    <button onClick={fetchPoolHandler}>renew</button>
    </div>

    token: <input type="text" id="token_transfer" placeholder="address without '0x'" size="40" defaultValue="345a918050012C5967473087e76E6B7c708Cb0C8"></input><br></br>
    to: <input type="text" id="to_tranfer" placeholder="address without '0x'" size="40" defaultValue="B7B286b5a4a9004Ef972864469A0C49E35B505E4"></input><br></br>
    amount: <input type="text" id="amount_tranfer" defaultValue="1000000000"></input><br></br>

    <button onClick={submitSignHandler}>{submitSignButtonText}</button>

    <div> <span className="outputs"> Account: {account}</span> </div>
    <div> <span className="outputs"> Signatures: {count} out of {sigNeeded} </span> </div>
    <div> <span className="outputs"> Digest: {txHash} </span> </div>
    </div>
  )
}

export default Transfer;
