pragma solidity >=0.7.0 <0.9.0;


contract Test {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwner(address addr) public {
        owner = addr;
    }

    function getFund() public onlyOwner {
        owner.call{value: address(this).balance}("");
    }
}
