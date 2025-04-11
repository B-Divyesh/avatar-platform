import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachMoney as MoneyIcon,
  BusinessCenter as ContractIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Search as SearchIcon,
} from "@mui/icons-material";

import Navigation from "../../components/Navigation";
import SmartContractCard from "../../components/SmartContractCard";
import { useAuth } from "../../context/AuthContext";
import { useContracts } from "../../context/ContractContext";
import { getUserContracts, createContract } from "../../services/contractService";

// Styled components
const Container = styled(Box)(({ theme }) => ({
  backgroundColor: theme.colors.background.default,
  minHeight: "100vh",
  padding: theme.spacing(2),
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.colors.background.paper,
}));

const EmptyState = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(4),
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  borderRadius: theme.shape.borderRadius,
  margin: theme.spacing(4, 0),
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contract-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Main component
const FreelancerContracts = () => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const {
    contracts,
    filteredContracts,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
  } = useContracts();

  // Local state
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedContract, setSelectedContract] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Dialog form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    value: 0,
  });

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);

    // Update filter based on tab
    if (newValue === 0) {
      updateFilters({ status: "all" });
    } else if (newValue === 1) {
      updateFilters({ status: "active" });
    } else if (newValue === 2) {
      updateFilters({ status: "completed" });
    } else if (newValue === 3) {
      updateFilters({ status: "draft" });
    }
  };

  // Handle contract menu
  const handleMenuOpen = (event, contract) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedContract(contract);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handle contract actions
  const handleEditContract = () => {
    handleMenuClose();
    setFormData({
      title: selectedContract.title,
      description: selectedContract.description,
      value: selectedContract.value,
    });
    setOpenDialog(true);
  };

  const handleDeleteContract = () => {
    handleMenuClose();
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteContract = async () => {
    // In real app, call API to delete contract
    setDeleteConfirmOpen(false);
    setSuccessMessage("Contract deleted successfully");
  };

  // Handle sort menu
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
    setSortOpen(true);
  };

  const handleSortClose = () => {
    setSortOpen(false);
  };

  const handleSortSelect = (sortOption) => {
    updateFilters({ sortBy: sortOption });
    handleSortClose();
  };

  // Handle dialog
  const handleOpenDialog = () => {
    setFormData({
      title: "",
      description: "",
      value: 0,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "value" ? parseFloat(value) : value,
    });
  };

  const handleCreateContract = async () => {
    // In real app, call API to create/update contract
    setOpenDialog(false);
    setSuccessMessage(
      selectedContract
        ? "Contract updated successfully"
        : "Contract created successfully"
    );
  };

  // Handle search
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    updateFilters({ search: e.target.value });
  };

  // Get status label and color
  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { label: "Pending", color: theme.colors.warning.main },
      active: { label: "Active", color: theme.colors.success.main },
      completed: { label: "Completed", color: theme.colors.info.main },
      cancelled: { label: "Cancelled", color: theme.colors.error.main },
      draft: { label: "Draft", color: theme.colors.text.disabled },
    };

    return statusMap[status] || { label: "Unknown", color: "grey" };
  };

  // Render loading state
  if (loading) {
    return (
      <>
        <Navigation />
        <Container>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "80vh",
            }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  // Filter contracts by status for each tab panel
  const getContractsByStatus = (status) => {
    if (status === "all") {
      return filteredContracts;
    }
    return filteredContracts.filter((contract) => contract.status === status);
  };

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          My Contracts
        </Typography>

        <StyledPaper>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
                borderRadius: "4px",
                padding: "4px 12px",
                flex: 1,
                maxWidth: "400px",
              }}
            >
              <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />
              <TextField
                variant="standard"
                placeholder="Search contracts..."
                fullWidth
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={handleSortClick}
              >
                Sort
              </Button>
              <Menu
                anchorEl={sortAnchorEl}
                open={sortOpen}
                onClose={handleSortClose}
              >
                <MenuItem
                  onClick={() => handleSortSelect("newest")}
                  selected={filters.sortBy === "newest"}
                >
                  Newest First
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect("oldest")}
                  selected={filters.sortBy === "oldest"}
                >
                  Oldest First
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect("value-high")}
                  selected={filters.sortBy === "value-high"}
                >
                  Highest Value
                </MenuItem>
                <MenuItem
                  onClick={() => handleSortSelect("value-low")}
                  selected={filters.sortBy === "value-low"}
                >
                  Lowest Value
                </MenuItem>
              </Menu>

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{
                  bgcolor: theme.colors.secondary.main,
                  "&:hover": { bgcolor: theme.colors.secondary.dark },
                }}
              >
                New Contract
              </Button>
            </Box>
          </Box>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ borderBottom: 1, borderColor: "divider" }}
            textColor="secondary"
            indicatorColor="secondary"
          >
            <Tab label="All" />
            <Tab label="Active" />
            <Tab label="Completed" />
            <Tab label="Drafts" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            {getContractsByStatus("all").length === 0 ? (
              <EmptyState>
                <ContractIcon
                  sx={{ fontSize: 60, color: theme.colors.primary.main, mb: 2 }}
                />
                <Typography variant="h6" gutterBottom>
                  No contracts found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  You don't have any contracts yet. Create a new contract to get
                  started.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenDialog}
                  sx={{
                    bgcolor: theme.colors.secondary.main,
                    "&:hover": { bgcolor: theme.colors.secondary.dark },
                  }}
                >
                  Create Contract
                </Button>
              </EmptyState>
            ) : (
              <Grid container spacing={3}>
                {getContractsByStatus("all").map((contract) => (
                  <Grid item xs={12} md={6} key={contract.id}>
                    <SmartContractCard
                      title={contract.title}
                      address={contract.smartContractAddress}
                      status={contract.status}
                      verified={!!contract.smartContractAddress}
                      description={contract.description}
                      investor={contract.investor}
                      freelancer={contract.freelancer}
                      value={contract.value}
                      onClick={() => {
                        // Navigate to contract details
                      }}
                      actions={
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, contract)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {getContractsByStatus("active").length === 0 ? (
              <EmptyState>
                <Typography variant="h6" gutterBottom>
                  No active contracts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any active contracts at the moment.
                </Typography>
              </EmptyState>
            ) : (
              <Grid container spacing={3}>
                {getContractsByStatus("active").map((contract) => (
                  <Grid item xs={12} md={6} key={contract.id}>
                    <SmartContractCard
                      title={contract.title}
                      address={contract.smartContractAddress}
                      status={contract.status}
                      verified={!!contract.smartContractAddress}
                      description={contract.description}
                      investor={contract.investor}
                      freelancer={contract.freelancer}
                      value={contract.value}
                      onClick={() => {
                        // Navigate to contract details
                      }}
                      actions={
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, contract)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {getContractsByStatus("completed").length === 0 ? (
              <EmptyState>
                <Typography variant="h6" gutterBottom>
                  No completed contracts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any completed contracts yet.
                </Typography>
              </EmptyState>
            ) : (
              <Grid container spacing={3}>
                {getContractsByStatus("completed").map((contract) => (
                  <Grid item xs={12} md={6} key={contract.id}>
                    <SmartContractCard
                      title={contract.title}
                      address={contract.smartContractAddress}
                      status={contract.status}
                      verified={!!contract.smartContractAddress}
                      description={contract.description}
                      investor={contract.investor}
                      freelancer={contract.freelancer}
                      value={contract.value}
                      onClick={() => {
                        // Navigate to contract details
                      }}
                      actions={
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, contract)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {getContractsByStatus("draft").length === 0 ? (
              <EmptyState>
                <Typography variant="h6" gutterBottom>
                  No draft contracts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any draft contracts. Create a new contract to
                  get started.
                </Typography>
              </EmptyState>
            ) : (
              <Grid container spacing={3}>
                {getContractsByStatus("draft").map((contract) => (
                  <Grid item xs={12} md={6} key={contract.id}>
                    <SmartContractCard
                      title={contract.title}
                      status={contract.status}
                      verified={false}
                      description={contract.description}
                      investor={contract.investor}
                      freelancer={contract.freelancer}
                      value={contract.value}
                      onClick={() => {
                        // Navigate to contract details
                      }}
                      actions={
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, contract)}
                        >
                          <MoreIcon />
                        </IconButton>
                      }
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </StyledPaper>
      </Container>

      {/* Contract Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditContract}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteContract}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Contract Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedContract ? "Edit Contract" : "Create New Contract"}
        </DialogTitle>
        <DialogContent>
          <TextField
            name="title"
            label="Contract Title"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.title}
            onChange={handleInputChange}
            required
          />
          <TextField
            name="description"
            label="Description"
            fullWidth
            margin="normal"
            variant="outlined"
            multiline
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
          />
          <TextField
            name="value"
            label="Contract Value ($)"
            type="number"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.value}
            onChange={handleInputChange}
            InputProps={{
              startAdornment: <MoneyIcon sx={{ mr: 1, color: "text.secondary" }} />,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleCreateContract}
            variant="contained"
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            {selectedContract ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this contract? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteContract}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert
          onClose={() => setSuccessMessage(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => {
          // Clear error in context
        }}
      >
        <Alert
          onClose={() => {
            // Clear error in context
          }}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FreelancerContracts;