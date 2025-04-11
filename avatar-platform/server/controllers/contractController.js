const { createClient } = require('@supabase/supabase-js');
const ethers = require('ethers');
const config = require('../config/config');
const AvatarContractABI = require('../contracts/AvatarContract.json');

// Create Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceKey);

// Table names
const TABLES = {
  CONTRACTS: 'contracts',
  DELIVERABLES: 'deliverables',
  PROFILES: 'profiles',
};

/**
 * Create a new contract
 */
const createContract = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      investorId,
      freelancerId,
      title,
      description,
      terms,
      value,
      createOnBlockchain,
      freelancerWalletAddress,
    } = req.body;
    
    // Validate input
    if (!title || !investorId || !freelancerId) {
      return res.status(400).json({ 
        error: 'Title, investor ID, and freelancer ID are required' 
      });
    }
    
    // Verify user is involved in the contract
    if (userId !== investorId && userId !== freelancerId) {
      return res.status(403).json({ 
        error: 'You must be a participant in the contract' 
      });
    }
    
    // Create contract in database
    const { data: dbContract, error: dbError } = await supabase
      .from(TABLES.CONTRACTS)
      .insert({
        investor_id: investorId,
        freelancer_id: freelancerId,
        title,
        description,
        terms,
        value,
        status: 'draft',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
    
    if (dbError) {
      throw dbError;
    }
    
    // If blockchain integration is requested
    if (createOnBlockchain && freelancerWalletAddress) {
      // In a production environment, this would be handled in a separate service
      // or worker to avoid blocking the request
      res.status(201).json({
        ...dbContract,
        blockchainStatus: 'pending',
        message: 'Contract created, blockchain transaction initiated',
      });
      
      // Process blockchain transaction asynchronously
      processBlockchainContract(dbContract.id, freelancerWalletAddress, value, terms)
        .catch(error => {
          console.error('Blockchain contract creation failed:', error);
          // Update contract status to reflect error
          supabase
            .from(TABLES.CONTRACTS)
            .update({
              status: 'error',
              blockchain_error: error.message,
              updated_at: new Date(),
            })
            .eq('id', dbContract.id);
        });
    } else {
      res.status(201).json(dbContract);
    }
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
};

/**
 * Helper to process blockchain contract creation
 */
const processBlockchainContract = async (contractId, freelancerAddress, value, terms) => {
  try {
    // This would connect to an actual blockchain in production
    // For demo, we're simulating success with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock transaction data
    const txHash = '0x' + Array(64).fill().map(() => 
      Math.floor(Math.random() * 16).toString(16)).join('');
    const blockchainContractId = Math.floor(Math.random() * 1000000);
    
    // Update contract with blockchain details
    const { error } = await supabase
      .from(TABLES.CONTRACTS)
      .update({
        status: 'pending',
        smart_contract_address: config.blockchain.contractAddress,
        blockchain_contract_id: blockchainContractId.toString(),
        transaction_hash: txHash,
        updated_at: new Date(),
      })
      .eq('id', contractId);
    
    if (error) {
      throw error;
    }
    
    return { txHash, blockchainContractId };
  } catch (error) {
    console.error('Error in blockchain processing:', error);
    throw error;
  }
};

/**
 * Get a contract by ID
 */
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get contract with related data
    const { data, error } = await supabase
      .from(TABLES.CONTRACTS)
      .select(`
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
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Verify user is involved in the contract
    if (data.investor_id !== userId && data.freelancer_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this contract' });
    }
    
    // Format response
    const formattedContract = {
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
        name: data.investor.profiles?.name || '',
        profileImage: data.investor.profiles?.profile_image || '',
      },
      freelancer: {
        id: data.freelancer.id,
        email: data.freelancer.email,
        name: data.freelancer.profiles?.name || '',
        profileImage: data.freelancer.profiles?.profile_image || '',
      },
      deliverables: data.deliverables.map(d => ({
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
    
    res.status(200).json(formattedContract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
};

/**
 * Get contracts for a user
 */
const getUserContracts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    
    // Build query
    let query = supabase
      .from(TABLES.CONTRACTS)
      .select(`
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
      `)
      .or(`investor_id.eq.${userId},freelancer_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    // Apply status filter if provided
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Format response
    const formattedContracts = data.map(contract => ({
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
        name: contract.investor.profiles?.name || '',
        profileImage: contract.investor.profiles?.profile_image || '',
      },
      freelancer: {
        id: contract.freelancer.id,
        email: contract.freelancer.email,
        name: contract.freelancer.profiles?.name || '',
        profileImage: contract.freelancer.profiles?.profile_image || '',
      },
      createdAt: contract.created_at,
      updatedAt: contract.updated_at,
      completedAt: contract.completed_at,
    }));
    
    res.status(200).json(formattedContracts);
  } catch (error) {
    console.error('Error fetching user contracts:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
};

/**
 * Update contract status
 */
const updateContractStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    // Get current contract
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (contractError) {
      throw contractError;
    }
    
    // Verify user is involved in the contract
    if (contract.investor_id !== userId && contract.freelancer_id !== userId) {
      return res.status(403).json({ error: 'Access denied to this contract' });
    }
    
    // Validate status transition
    const validTransitions = {
      draft: ['pending', 'cancelled'],
      pending: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [], // No transitions from completed
      cancelled: [], // No transitions from cancelled
    };
    
    if (!validTransitions[contract.status].includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${contract.status} to ${status}`
      });
    }
    
    // Update blockchain contract if applicable
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      // This would interact with the blockchain in production
      // Here we're simulating success
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update database
    const updateData = {
      status,
      updated_at: new Date(),
    };
    
    // Set completion date if status is completed
    if (status === 'completed') {
      updateData.completed_at = new Date();
    }
    
    const { data: updatedContract, error: updateError } = await supabase
      .from(TABLES.CONTRACTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.status(200).json(updatedContract);
  } catch (error) {
    console.error('Error updating contract status:', error);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
};

/**
 * Add deliverable to a contract
 */
const addDeliverable = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { title, description, fileUrl } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select('*')
      .eq('id', contractId)
      .single();
    
    if (contractError) {
      throw contractError;
    }
    
    // Verify user is the freelancer for this contract
    if (contract.freelancer_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the freelancer can add deliverables' 
      });
    }
    
    // Validate contract is active
    if (contract.status !== 'active') {
      return res.status(400).json({
        error: 'Can only add deliverables to active contracts'
      });
    }
    
    // Create deliverable
    const { data: deliverable, error: deliverableError } = await supabase
      .from(TABLES.DELIVERABLES)
      .insert({
        contract_id: contractId,
        title,
        description,
        file_url: fileUrl,
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .select()
      .single();
    
    if (deliverableError) {
      throw deliverableError;
    }
    
    // Add to blockchain if applicable
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      // In a real implementation, this would interact with the blockchain
      // Update deliverable with blockchain URI
      const deliverableUri = `ipfs://deliverable-${deliverable.id}`;
      
      await supabase
        .from(TABLES.DELIVERABLES)
        .update({
          blockchain_uri: deliverableUri,
          updated_at: new Date(),
        })
        .eq('id', deliverable.id);
    }
    
    res.status(201).json(deliverable);
  } catch (error) {
    console.error('Error adding deliverable:', error);
    res.status(500).json({ error: 'Failed to add deliverable' });
  }
};

/**
 * Update deliverable status
 */
const updateDeliverableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    
    // Validate input
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Status must be "approved" or "rejected"' 
      });
    }
    
    // Get deliverable with contract details
    const { data: deliverable, error: deliverableError } = await supabase
      .from(TABLES.DELIVERABLES)
      .select('*, contract:contract_id (*)')
      .eq('id', id)
      .single();
    
    if (deliverableError) {
      throw deliverableError;
    }
    
    // Verify user is the investor for this contract
    if (deliverable.contract.investor_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the investor can approve or reject deliverables' 
      });
    }
    
    // Validate contract is active
    if (deliverable.contract.status !== 'active') {
      return res.status(400).json({
        error: 'Can only update deliverables for active contracts'
      });
    }
    
    // Update deliverable
    const { data: updatedDeliverable, error: updateError } = await supabase
      .from(TABLES.DELIVERABLES)
      .update({
        status,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.status(200).json(updatedDeliverable);
  } catch (error) {
    console.error('Error updating deliverable status:', error);
    res.status(500).json({ error: 'Failed to update deliverable status' });
  }
};

/**
 * Verify contract and release payment
 */
const verifyAndReleasePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get contract details
    const { data: contract, error: contractError } = await supabase
      .from(TABLES.CONTRACTS)
      .select('*')
      .eq('id', id)
      .single();
    
    if (contractError) {
      throw contractError;
    }
    
    // Verify user is the investor
    if (contract.investor_id !== userId) {
      return res.status(403).json({ 
        error: 'Only the investor can verify and release payment' 
      });
    }
    
    // Validate contract is completed
    if (contract.status !== 'completed') {
      return res.status(400).json({
        error: 'Can only verify completed contracts'
      });
    }
    
    // Release payment on blockchain if applicable
    if (contract.smart_contract_address && contract.blockchain_contract_id) {
      // In a real implementation, this would interact with the blockchain
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update database
    const { data: updatedContract, error: updateError } = await supabase
      .from(TABLES.CONTRACTS)
      .update({
        verified: true,
        updated_at: new Date(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) {
      throw updateError;
    }
    
    res.status(200).json(updatedContract);
  } catch (error) {
    console.error('Error verifying contract:', error);
    res.status(500).json({ error: 'Failed to verify contract' });
  }
};

module.exports = {
  createContract,
  getContractById,
  getUserContracts,
  updateContractStatus,
  addDeliverable,
  updateDeliverableStatus,
  verifyAndReleasePayment,
};