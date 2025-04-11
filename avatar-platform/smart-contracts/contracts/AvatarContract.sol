// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title AvatarContract
 * @dev Smart contract for Avatar platform to manage freelancer-investor relationships
 */
contract AvatarContract {
    enum ContractStatus { Pending, Active, Completed, Cancelled }
    
    struct Profile {
        address walletAddress;
        string profileURI;       // IPFS URI for profile data
        bool isInvestor;
        uint256 reputation;
        bool exists;
    }
    
    struct WorkContract {
        uint256 id;
        address investor;
        address freelancer;
        string termsURI;         // IPFS URI for contract terms
        uint256 value;
        uint256 createdAt;
        uint256 completedAt;
        ContractStatus status;
        string[] deliverableURIs; // IPFS URIs for deliverables
        bool verified;
    }
    
    mapping(address => Profile) public profiles;
    mapping(uint256 => WorkContract) public contracts;
    mapping(address => uint256[]) public userContracts;
    
    uint256 private nextContractId = 1;
    
    event ProfileCreated(address indexed user, bool isInvestor);
    event ProfileUpdated(address indexed user);
    event ContractCreated(uint256 indexed contractId, address indexed investor, address indexed freelancer);
    event ContractStatusUpdated(uint256 indexed contractId, ContractStatus status);
    event DeliverableAdded(uint256 indexed contractId, string deliverableURI);
    event ContractVerified(uint256 indexed contractId);
    
    modifier onlyRegistered() {
        require(profiles[msg.sender].exists, "User not registered");
        _;
    }
    
    modifier onlyContractParticipant(uint256 contractId) {
        require(
            contracts[contractId].investor == msg.sender || 
            contracts[contractId].freelancer == msg.sender,
            "Not authorized"
        );
        _;
    }
    
    /**
     * @dev Create a new user profile
     * @param profileURI IPFS URI containing profile data
     * @param isInvestor True if user is an investor, false if freelancer
     */
    function createProfile(string memory profileURI, bool isInvestor) external {
        require(!profiles[msg.sender].exists, "Profile already exists");
        
        Profile memory newProfile = Profile({
            walletAddress: msg.sender,
            profileURI: profileURI,
            isInvestor: isInvestor,
            reputation: 0,
            exists: true
        });
        
        profiles[msg.sender] = newProfile;
        emit ProfileCreated(msg.sender, isInvestor);
    }
    
    /**
     * @dev Update user profile
     * @param profileURI New IPFS URI for profile data
     */
    function updateProfile(string memory profileURI) external onlyRegistered {
        profiles[msg.sender].profileURI = profileURI;
        emit ProfileUpdated(msg.sender);
    }
    
    /**
     * @dev Create a new contract between investor and freelancer
     * @param freelancer Address of the freelancer
     * @param termsURI IPFS URI containing contract terms
     */
    function createContract(address freelancer, string memory termsURI) external payable onlyRegistered {
        require(profiles[msg.sender].isInvestor, "Only investors can create contracts");
        require(profiles[freelancer].exists, "Freelancer not registered");
        require(!profiles[freelancer].isInvestor, "Cannot create contract with another investor");
        
        WorkContract memory newContract = WorkContract({
            id: nextContractId,
            investor: msg.sender,
            freelancer: freelancer,
            termsURI: termsURI,
            value: msg.value,
            createdAt: block.timestamp,
            completedAt: 0,
            status: ContractStatus.Pending,
            deliverableURIs: new string[](0),
            verified: false
        });
        
        contracts[nextContractId] = newContract;
        userContracts[msg.sender].push(nextContractId);
        userContracts[freelancer].push(nextContractId);
        
        emit ContractCreated(nextContractId, msg.sender, freelancer);
        nextContractId++;
    }
    
    /**
     * @dev Update contract status
     * @param contractId ID of the contract
     * @param status New status for the contract
     */
    function updateContractStatus(uint256 contractId, ContractStatus status) 
        external 
        onlyContractParticipant(contractId) 
    {
        WorkContract storage workContract = contracts[contractId];
        
        // Specific validation based on status changes
        if (status == ContractStatus.Active) {
            require(
                workContract.status == ContractStatus.Pending && 
                workContract.freelancer == msg.sender,
                "Invalid status change"
            );
        } else if (status == ContractStatus.Completed) {
            require(
                workContract.status == ContractStatus.Active && 
                workContract.freelancer == msg.sender,
                "Invalid status change"
            );
            workContract.completedAt = block.timestamp;
        } else if (status == ContractStatus.Cancelled) {
            require(workContract.status != ContractStatus.Completed, "Cannot cancel completed contract");
            
            // Refund if cancelled
            if (workContract.value > 0 && address(this).balance >= workContract.value) {
                payable(workContract.investor).transfer(workContract.value);
                workContract.value = 0;
            }
        }
        
        workContract.status = status;
        emit ContractStatusUpdated(contractId, status);
    }
    
    /**
     * @dev Add deliverable to contract
     * @param contractId ID of the contract
     * @param deliverableURI IPFS URI of the deliverable
     */
    function addDeliverable(uint256 contractId, string memory deliverableURI) 
        external 
        onlyContractParticipant(contractId) 
    {
        WorkContract storage workContract = contracts[contractId];
        require(workContract.status == ContractStatus.Active, "Contract must be active");
        workContract.deliverableURIs.push(deliverableURI);
        emit DeliverableAdded(contractId, deliverableURI);
    }
    
    /**
     * @dev Verify contract and release payment
     * @param contractId ID of the contract
     */
    function verifyAndReleasePayment(uint256 contractId) external {
        WorkContract storage workContract = contracts[contractId];
        require(workContract.investor == msg.sender, "Only investor can verify");
        require(workContract.status == ContractStatus.Completed, "Contract must be completed");
        require(!workContract.verified, "Contract already verified");
        
        workContract.verified = true;
        
        // Increase freelancer reputation
        profiles[workContract.freelancer].reputation += 1;
        
        // Release payment to freelancer
        if (workContract.value > 0 && address(this).balance >= workContract.value) {
            payable(workContract.freelancer).transfer(workContract.value);
            workContract.value = 0;
        }
        
        emit ContractVerified(contractId);
    }
    
    /**
     * @dev Get all contracts for a user
     * @param user Address of the user
     * @return Array of contract IDs
     */
    function getUserContracts(address user) external view returns (uint256[] memory) {
        return userContracts[user];
    }
    
    /**
     * @dev Get deliverables for a contract
     * @param contractId ID of the contract
     * @return Array of deliverable URIs
     */
    function getDeliverables(uint256 contractId) external view returns (string[] memory) {
        return contracts[contractId].deliverableURIs;
    }
}