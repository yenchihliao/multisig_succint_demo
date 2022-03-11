const { ethers } = require("ethers");

privateKey = "2bd2d088cc94204c269714aba8de15af47a30c0f3ca0b4ede10b8895f9722787"
let wallet = new ethers.Wallet(privateKey);
console.log(wallet.address);

let messageHash = "0x7994dd34c5b1024460095686ded3b5228dba88adcd1683eaeb83f47ef908e002";
// let messageHashBytes = messageHash;
let messageHashBytes = ethers.utils.arrayify(messageHash);
wallet.signMessage(messageHashBytes).then((flatSig) => {
  console.log(flatSig);
  let recovered = ethers.utils.verifyMessage(messageHashBytes, flatSig);
  console.log(recovered);
});


// let flatSig = "0xe4cf65d49011bc8e9f527779513700d8769859a644fe6f19d5d7dd737c796e1a7e050f9fc368af2a0631f170882db70d4a7ef1751bb76060bef8eda005e970e81b";
// let recovered = 
