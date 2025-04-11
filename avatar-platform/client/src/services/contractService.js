import { supabase, TABLES } from "./supabaseClient";
import { ethers } from "ethers";
import AvatarContractABI from "../contracts/AvatarContract.json";

// Contract address (would come from deployment)
const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

/**
 * Get Ethereum provider and contract instance
 * @returns {Promise<Object>} Provider and contract instance
 */
export const getContractInstance = async () => {
  try {
    if (!window.ethereum) {
      throw new Error(
        "Ethereum provider not found. Please install MetaMask or another Ethereum wallet."
      );
    }

    await window.ethereum.request({ method: "eth_requestAccounts" });
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      AvatarContractABI.abi,
      signer
    );

    return { provider, signer, contract };
  } catch (error) {
    console.error("Error getting contract instance:", error);
    throw error;
  }
};

/**
 * Create a new contract
 * @param {Object} contractData - Contract data
 * @returns {Promise<Object>} Created contract
 */
export const createContract = async (contractData) => {
  try {
    // First create the contract in the database
    const { data: dbContract, error: dbError } = await supabase
      .from(TABLES.CONTRACTS)
      .insert({
        investor_id: contractData.investorId,
        freelancer_id: contractData.freelancerId,
        title: contractData.title,
        description: contractData.description,
        terms: contractData.terms,
        value: contractData.value,
        status: "draft",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    // If the contract has a blockchain component, create it on the blockchain
    if (
      contractData.createOnBlockchain &&
      contractData.investorWalletAddress &&
      contractData.freelancerWalletAddress
    ) {
      try {
        const { contract } = await getContractInstance();

        // Upload contract terms to IPFS (in a real app)
        // For demo, we'll just use a simple string
        const termsIpfsUri = `ipfs://terms-${dbContract.id}`;

        // Create contract on blockchain
        const tx = await contract.createContract(
          contractData.freelancerWalletAddress,
          termsIpfsUri,
          { value: ethers.utils.parseEther(contractData.value.toString()) }
        );

        const receipt = await tx.wait();

        // Get contract ID from event logs
        const event = receipt.events.find((e) => e.event === "ContractCreated");
        const [contractId, investor, freelancer] = event.args;

        // Update database contract with blockchain details
        const { data: updatedContract, error: updateError } = await supabase
          .from(TABLES.CONTRACTS)
          .update({
            status: "pending",
            smart_contract_address: CONTRACT_ADDRESS,
            blockchain_contract_id: contractId.toString(),
            transaction_hash: receipt.transactionHash,
            updated_at: new Date(),
          })
          .eq("id", dbContract.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return updatedContract;
      } catch (blockchainError) {
        console.error(
          "Error creating contract on blockchain:",
          blockchainError
        );

        // Update database contract with error
        await supabase
          .from(TABLES.CONTRACTS)
          .update({
            status: "error",
            blockchain_error: blockchainError.message,
            updated_at: new Date(),
          })
          .eq("id", dbContract.id);

        throw blockchainError;
      }
    }

    return dbContract;
  } catch (error) {
    console.error("Error creating contract:", error);
    throw error;
  }
};

/**
 * Get contract by ID
 * @param {string} contractId - Contract ID
 * @returns {Promise<Object>} Contract
 */
export const getContractById = async (contractId) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .select(
        `
        *,
        investor:investor_id (
          id,
          email,
          profiles (
            name,
            profile_image
          )
        ),
        freelancer:freelancer_id (
          id,
          email,
          profiles (
            name,
            profile_image
          )
        ),
        deliverables (*)
      `
      )
      .eq("id", contractId)
      .single();

    if (error) {
      throw error;
    }

    // Format data
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      terms: data.terms,
      value: data.value,
      status: data.status,
      smartContractAddress: data.smart_contract_address,
      blockchainContractId: data.blockchain_contract_id,
      transactionHash: data.transaction_hash,
      investor: {
        id: data.investor.id,
        email: data.investor.email,
        name: data.investor.profiles?.name || "",
        profileImage: data.investor.profiles?.profile_image || "",
      },
      freelancer: {
        id: data.freelancer.id,
        email: data.freelancer.email,
        name: data.freelancer.profiles?.name || "",
        profileImage: data.freelancer.profiles?.profile_image || "",
      },
      deliverables: data.deliverables.map((d) => ({
        id: d.id,
        title: d.title,
        description: d.description,
        fileUrl: d.file_url,
        status: d.status,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      completedAt: data.completed_at,
    };
  } catch (error) {
    console.error("Error fetching contract:", error);
    throw error;
  }
};

/**
 * Get contracts for a user
 * @param {string} userId - User ID
 * @param {string} status - Filter by status
 * @returns {Promise<Array>} Array of contracts
 */
export const getUserContracts = async (userId, status = null) => {
  try {
    let query = supabase
      .from(TABLES.CONTRACTS)
      .select(
        `
        *,
        investor:investor_id (
          id,
          email,
          profiles (
            name,
            profile_image
          )
        ),
        freelancer:freelancer_id (
          id,
          email,
          profiles (
            name,
            profile_image
          )
        )
      `
      )
      .or(`investor_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Format data
    return data.map((contract) => ({
      id: contract.id,
      title: contract.title,
      description: contract.description,
      value: contract.value,
      status: contract.status,
      isInvestor: contract.investor_id === userId,
      smartContractAddress: contract.smart_contract_address,
      blockchainContractId: contract.blockchain_contract_id,
      investor: {
        id: contract.investor.id,
        email: contract.investor.email,
        name: contract.investor.profiles?.name || "",
        profileImage: contract.investor.profiles?.profile_image || "",
      },
      freelancer: {
        id: contract.freelancer.id,
        email: contract.freelancer.email,
        name: contract.freelancer.profiles?.name || "",
        profileImage: contract.freelancer.profiles?.profile_image || "",
      },
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      completedAt: contract.completed_at,
    }));
  } catch (error) {
    console.error("Error fetching user contracts:", error);
    throw error;
  }
};

/**
 * Update contract status
 * @param {string} contractId - Contract ID
 * @param {string} status - New status
 * @param {string} userId - User ID updating the status
 * @returns {Promise<Object>} Updated contract
 */
export const updateContractStatus = async (contractId, status, userId) => {
  try {
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError) {
      throw contractError;
    }

    // Validate user permission
    if (contract.investor_id !== userId && contract.freelancer_id !== userId) {
      throw new Error("You do not have permission to update this contract.");
    }

    // Validate status transition
    const validTransitions = {
      draft: ["pending", "cancelled"],
      pending: ["active", "cancelled"],
      active: ["completed", "cancelled"],
      completed: [], // No transitions from completed
      cancelled: [], // No transitions from cancelled
    };

    if (!validTransitions[contract.status].includes(status)) {
      throw new Error(
        `Invalid status transition from ${contract.status} to ${status}.`
      );
    }

    // Update blockchain contract if it exists
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      try {
        const { contract: contractInstance } = await getContractInstance();

        // Map status to blockchain status
        const blockchainStatus = {
          pending: 0,
          active: 1,
          completed: 2,
          cancelled: 3,
        };

        const tx = await contractInstance.updateContractStatus(
          contract.blockchain_contract_id,
          blockchainStatus[status]
        );

        await tx.wait();
      } catch (blockchainError) {
        console.error(
          "Error updating contract on blockchain:",
          blockchainError
        );
        throw blockchainError;
      }
    }

    // Update database
    const updateData = {
      status,
      updated_at: new Date(),
    };

    // Set completion date if status is completed
    if (status === "completed") {
      updateData.completed_at = new Date();
    }

    const { data: updatedContract, error: updateError } = await supabase
      .from(TABLES.CONTRACTS)
      .update(updateData)
      .eq("id", contractId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedContract;
  } catch (error) {
    console.error("Error updating contract status:", error);
    throw error;
  }
};

/**
 * Add deliverable to contract
 * @param {string} contractId - Contract ID
 * @param {Object} deliverableData - Deliverable data
 * @returns {Promise<Object>} Created deliverable
 */
export const addDeliverable = async (contractId, deliverableData) => {
  try {
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError) {
      throw contractError;
    }

    // Validate contract is active
    if (contract.status !== "active") {
      throw new Error("Can only add deliverables to active contracts.");
    }

    // Create deliverable
    const { data: deliverable, error: deliverableError } = await supabase
      .from(TABLES.DELIVERABLES)
      .insert({
        contract_id: contractId,
        title: deliverableData.title,
        description: deliverableData.description,
        file_url: deliverableData.fileUrl,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();

    if (deliverableError) {
      throw deliverableError;
    }

    // Add to blockchain if smart contract exists
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      try {
        const { contract: contractInstance } = await getContractInstance();

        // In a real app, we'd upload to IPFS first
        const deliverableUri = `ipfs://deliverable-${deliverable.id}`;

        const tx = await contractInstance.addDeliverable(
          contract.blockchain_contract_id,
          deliverableUri
        );

        await tx.wait();

        // Update deliverable with blockchain info
        await supabase
          .from(TABLES.DELIVERABLES)
          .update({
            blockchain_uri: deliverableUri,
            updated_at: new Date(),
          })
          .eq("id", deliverable.id);
      } catch (blockchainError) {
        console.error(
          "Error adding deliverable to blockchain:",
          blockchainError
        );
        // Continue without failing - the deliverable is still in the database
      }
    }

    return deliverable;
  } catch (error) {
    console.error("Error adding deliverable:", error);
    throw error;
  }
};

/**
 * Update deliverable status
 * @param {string} deliverableId - Deliverable ID
 * @param {string} status - New status
 * @param {string} userId - User ID updating the status
 * @returns {Promise<Object>} Updated deliverable
 */
export const updateDeliverableStatus = async (
  deliverableId,
  status,
  userId
) => {
  try {
    // Get deliverable and contract details
    const { data: deliverable, error: deliverableError } = await supabase
      .from(TABLES.DELIVERABLES)
      .select("*, contract:contract_id (*)")
      .eq("id", deliverableId)
      .single();

    if (deliverableError) {
      throw deliverableError;
    }

    // Validate user permission (only investor can approve/reject)
    if (deliverable.contract.investor_id !== userId) {
      throw new Error("Only the investor can approve or reject deliverables.");
    }

    // Validate contract is active
    if (deliverable.contract.status !== "active") {
      throw new Error("Can only update deliverables for active contracts.");
    }

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      throw new Error('Invalid status. Must be "approved" or "rejected".');
    }

    // Update deliverable
    const { data: updatedDeliverable, error: updateError } = await supabase
      .from(TABLES.DELIVERABLES)
      .update({
        status,
        updated_at: new Date(),
      })
      .eq("id", deliverableId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedDeliverable;
  } catch (error) {
    console.error("Error updating deliverable status:", error);
    throw error;
  }
};

/**
 * Upload deliverable file
 * @param {string} contractId - Contract ID
 * @param {File} file - File to upload
 * @returns {Promise<string>} URL of uploaded file
 */
export const uploadDeliverableFile = async (contractId, file) => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${contractId}-${Date.now()}.${fileExt}`;
    const filePath = `deliverables/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from("contracts")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading deliverable file:", error);
    throw error;
  }
};

/**
 * Verify contract and release payment
 * @param {string} contractId - Contract ID
 * @param {string} userId - User ID (investor)
 * @returns {Promise<Object>} Updated contract
 */
export const verifyAndReleasePayment = async (contractId, userId) => {
  try {
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select("*")
      .eq("id", contractId)
      .single();

    if (contractError) {
      throw contractError;
    }

    // Validate user is the investor
    if (contract.investor_id !== userId) {
      throw new Error("Only the investor can verify and release payment.");
    }

    // Validate contract is completed
    if (contract.status !== "completed") {
      throw new Error("Can only verify completed contracts.");
    }

    // Release payment on blockchain if smart contract exists
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      try {
        const { contract: contractInstance } = await getContractInstance();

        const tx = await contractInstance.verifyAndReleasePayment(
          contract.blockchain_contract_id
        );

        await tx.wait();
      } catch (blockchainError) {
        console.error(
          "Error verifying contract on blockchain:",
          blockchainError
        );
        throw blockchainError;
      }
    }

    // Update database
    const { data: updatedContract, error: updateError } = await supabase
      .from(TABLES.CONTRACTS)
      .update({
        verified: true,
        updated_at: new Date(),
      })
      .eq("id", contractId)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return updatedContract;
  } catch (error) {
    console.error("Error verifying contract:", error);
    throw error;
  }
};
