import React, { createContext, useContext, useState, useEffect } from "react";
import { getUserContracts } from "../services/contractService";
import { useAuth } from "./AuthContext";

// Create contract context
const ContractContext = createContext();

/**
 * Contract provider component for managing contract state globally
 * @param {Object} props Component props
 * @param {React.ReactNode} props.children Child components
 * @returns {React.ReactElement} Contract provider component
 */
export const ContractProvider = ({ children }) => {
  const { currentUser } = useAuth();

  // State
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "newest",
  });

  // Fetch contracts when user changes
  useEffect(() => {
    if (!currentUser) {
      setContracts([]);
      setFilteredContracts([]);
      return;
    }

    const fetchContracts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch contracts from API
        const data = await getUserContracts(currentUser.id);

        // Sort by created date by default
        const sortedContracts = data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setContracts(sortedContracts);
        applyFilters(sortedContracts, filters);
      } catch (err) {
        console.error("Error fetching contracts:", err);
        setError("Failed to load contracts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser]);

  // Apply filters whenever contracts or filters change
  useEffect(() => {
    applyFilters(contracts, filters);
  }, [contracts, filters]);

  /**
   * Apply filters to contracts
   * @param {Array} contractsData List of contracts to filter
   * @param {Object} filterOptions Filter options
   */
  const applyFilters = (contractsData, filterOptions) => {
    // Start with all contracts
    let result = [...contractsData];

    // Apply status filter
    if (filterOptions.status !== "all") {
      result = result.filter(
        (contract) => contract.status === filterOptions.status
      );
    }

    // Apply search filter
    if (filterOptions.search.trim()) {
      const query = filterOptions.search.toLowerCase();
      result = result.filter(
        (contract) =>
          contract.title.toLowerCase().includes(query) ||
          contract.description?.toLowerCase().includes(query) ||
          (currentUser?.userType === "investor"
            ? contract.freelancer.name?.toLowerCase().includes(query)
            : contract.investor.name?.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (filterOptions.sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (filterOptions.sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (filterOptions.sortBy === "value-high") {
      result.sort((a, b) => b.value - a.value);
    } else if (filterOptions.sortBy === "value-low") {
      result.sort((a, b) => a.value - b.value);
    }

    setFilteredContracts(result);
  };

  /**
   * Update filters
   * @param {Object} newFilters Updated filter options
   */
  const updateFilters = (newFilters) => {
    setFilters({
      ...filters,
      ...newFilters,
    });
  };

  /**
   * Reset all filters to defaults
   */
  const resetFilters = () => {
    setFilters({
      status: "all",
      search: "",
      sortBy: "newest",
    });
  };

  /**
   * Add new contract to the list
   * @param {Object} contract New contract to add
   */
  const addContract = (contract) => {
    const updatedContracts = [contract, ...contracts];
    setContracts(updatedContracts);
    // Filters will be automatically applied by the useEffect
  };

  /**
   * Update existing contract
   * @param {string} contractId Contract ID to update
   * @param {Object} updates Updates to apply
   */
  const updateContract = (contractId, updates) => {
    const updatedContracts = contracts.map((contract) =>
      contract.id === contractId ? { ...contract, ...updates } : contract
    );

    setContracts(updatedContracts);
    // Filters will be automatically applied by the useEffect
  };

  /**
   * Remove contract from the list
   * @param {string} contractId Contract ID to remove
   */
  const removeContract = (contractId) => {
    const updatedContracts = contracts.filter(
      (contract) => contract.id !== contractId
    );
    setContracts(updatedContracts);
    // Filters will be automatically applied by the useEffect
  };

  /**
   * Get a specific contract by ID
   * @param {string} contractId Contract ID to get
   * @returns {Object|null} Contract or null if not found
   */
  const getContractById = (contractId) => {
    return contracts.find((contract) => contract.id === contractId) || null;
  };

  /**
   * Get contracts by status
   * @param {string} status Status to filter by
   * @returns {Array} Filtered contracts
   */
  const getContractsByStatus = (status) => {
    return contracts.filter((contract) => contract.status === status);
  };

  // Context value with state and functions
  const contextValue = {
    contracts,
    filteredContracts,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    addContract,
    updateContract,
    removeContract,
    getContractById,
    getContractsByStatus,
  };

  return (
    <ContractContext.Provider value={contextValue}>
      {children}
    </ContractContext.Provider>
  );
};

/**
 * Custom hook to use the contract context
 * @returns {Object} Contract context value
 */
export const useContracts = () => {
  const context = useContext(ContractContext);

  if (!context) {
    throw new Error("useContracts must be used within a ContractProvider");
  }

  return context;
};
