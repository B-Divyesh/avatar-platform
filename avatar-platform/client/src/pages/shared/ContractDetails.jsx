import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Tooltip,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  CheckCircle as CompletedIcon,
  Cancel as CancelledIcon,
  Pending as PendingIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  AttachFile as FileIcon,
  Add as AddIcon,
  Edit as EditIcon,
  ArrowBack as BackIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
  VerifiedUser as VerifiedIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Chat as ChatIcon,
  AccountBalanceWallet as WalletIcon,
} from "@mui/icons-material";

import Navigation from "../components/common/Navigation";
import { useAuth } from "../../context/AuthContext";
import {
  getContractById,
  updateContractStatus,
  addDeliverable,
  updateDeliverableStatus,
  uploadDeliverableFile,
  verifyAndReleasePayment,
} from "../../services/contractService";

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

const ContractHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: theme.spacing(3),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    gap: theme.spacing(2),
  },
}));

const AddressBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1, 2),
  backgroundColor: "rgba(0, 0, 0, 0.03)",
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  overflow: "hidden",
}));

const StatusChip = styled(Chip)(({ theme, status }) => {
  const statusColors = {
    pending: theme.colors.warning.main,
    active: theme.colors.success.main,
    completed: theme.colors.info.main,
    cancelled: theme.colors.error.main,
    draft: theme.colors.text.disabled,
  };

  return {
    backgroundColor: statusColors[status] || statusColors.pending,
    color: "#fff",
    fontWeight: "bold",
  };
});

const DeliverableItem = styled(ListItem)(({ theme, status }) => {
  const statusColors = {
    pending: "rgba(255, 152, 0, 0.1)",
    approved: "rgba(76, 175, 80, 0.1)",
    rejected: "rgba(244, 67, 54, 0.1)",
  };

  return {
    backgroundColor: statusColors[status] || "transparent",
    borderRadius: theme.shape.borderRadius,
    marginBottom: theme.spacing(1),
  };
});

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

// Main component
const ContractDetails = () => {
  const theme = useTheme();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  // State
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [openDeliverableDialog, setOpenDeliverableDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [file, setFile] = useState(null);

  // Deliverable form state
  const [deliverableData, setDeliverableData] = useState({
    title: "",
    description: "",
  });

  // Fetch contract data
  useEffect(() => {
    const fetchContract = async () => {
      try {
        setLoading(true);
        const data = await getContractById(id);
        setContract(data);
      } catch (err) {
        console.error("Error fetching contract:", err);
        setError("Failed to load contract details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  // Handle file upload for deliverable
  const handleFileUpload = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Handle dialog input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliverableData({
      ...deliverableData,
      [name]: value,
    });
  };

  // Handle add deliverable
  const handleAddDeliverable = async () => {
    try {
      if (!deliverableData.title) {
        setError("Deliverable title is required");
        return;
      }

      let fileUrl = "";
      if (file) {
        fileUrl = await uploadDeliverableFile(contract.id, file);
      }

      const deliverablePayload = {
        title: deliverableData.title,
        description: deliverableData.description,
        fileUrl,
      };

      await addDeliverable(contract.id, deliverablePayload);

      // Refresh contract data
      const updatedContract = await getContractById(id);
      setContract(updatedContract);

      setOpenDeliverableDialog(false);
      setDeliverableData({ title: "", description: "" });
      setFile(null);
      setSuccess("Deliverable added successfully");
    } catch (err) {
      console.error("Error adding deliverable:", err);
      setError("Failed to add deliverable. Please try again.");
    }
  };

  // Handle update contract status
  const handleUpdateStatus = async (newStatus) => {
    try {
      setStatusUpdateLoading(true);

      await updateContractStatus(contract.id, newStatus, currentUser.id);

      // Refresh contract data
      const updatedContract = await getContractById(id);
      setContract(updatedContract);

      setOpenCancelDialog(false);
      setOpenCompleteDialog(false);
      setSuccess(`Contract ${newStatus} successfully`);
    } catch (err) {
      console.error("Error updating contract status:", err);
      setError(`Failed to ${newStatus} contract. Please try again.`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Handle deliverable status update
  const handleDeliverableStatusUpdate = async (deliverableId, status) => {
    try {
      await updateDeliverableStatus(deliverableId, status, currentUser.id);

      // Refresh contract data
      const updatedContract = await getContractById(id);
      setContract(updatedContract);

      setSuccess(`Deliverable ${status === "approved" ? "approved" : "rejected"} successfully`);
    } catch (err) {
      console.error("Error updating deliverable status:", err);
      setError(`Failed to ${status} deliverable. Please try again.`);
    }
  };

  // Handle verify and release payment
  const handleVerifyAndRelease = async () => {
    try {
      await verifyAndReleasePayment(contract.id, currentUser.id);

      // Refresh contract data
      const updatedContract = await getContractById(id);
      setContract(updatedContract);

      setVerifyDialogOpen(false);
      setSuccess("Payment released successfully");
    } catch (err) {
      console.error("Error releasing payment:", err);
      setError("Failed to release payment. Please try again.");
    }
  };

  // Handle copy address
  const handleCopyAddress = () => {
    if (contract?.smartContractAddress) {
      navigator.clipboard.writeText(contract.smartContractAddress);
      setSuccess("Contract address copied to clipboard");
    }
  };

  // Handle open Etherscan
  const handleOpenEtherscan = () => {
    if (contract?.smartContractAddress) {
      window.open(
        `https://etherscan.io/address/${contract.smartContractAddress}`,
        "_blank"
      );
    }
  };

  // Check if user is investor
  const isInvestor = () => {
    return currentUser?.id === contract?.investor?.id;
  };

  // Check if user is freelancer
  const isFreelancer = () => {
    return currentUser?.id === contract?.freelancer?.id;
  };

  // Handle navigate to chat
  const handleOpenChat = () => {
    const otherPartyId = isInvestor() ? contract.freelancer.id : contract.investor.id;
    navigate(`/chat/${otherPartyId}`);
  };

  // Handle back
  const handleBack = () => {
    navigate(-1);
  };

  // Format value with currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          color: theme.colors.success.main,
          icon: <PendingIcon />,
        };
      case "completed":
        return {
          label: "Completed",
          color: theme.colors.info.main,
          icon: <CompletedIcon />,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: theme.colors.error.main,
          icon: <CancelledIcon />,
        };
      case "draft":
        return {
          label: "Draft",
          color: theme.colors.text.disabled,
          icon: <DescriptionIcon />,
        };
      case "pending":
      default:
        return {
          label: "Pending",
          color: theme.colors.warning.main,
          icon: <PendingIcon />,
        };
    }
  };

  // Determine active step in contract lifecycle
  const getActiveStep = () => {
    switch (contract?.status) {
      case "pending":
        return 0;
      case "active":
        return 1;
      case "completed":
        return contract.verified ? 3 : 2;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

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

  if (!contract) {
    return (
      <>
        <Navigation />
        <Container>
          <StyledPaper>
            <Typography variant="h5" align="center" sx={{ py: 4 }}>
              Contract not found or you don't have permission to view it.
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                onClick={handleBack}
              >
                Go Back
              </Button>
            </Box>
          </StyledPaper>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <Container>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        <StyledPaper>
          <ContractHeader>
            <Box>
              <Typography variant="h4">{contract.title}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                <StatusChip
                  status={contract.status}
                  label={getStatusInfo(contract.status).label}
                  icon={getStatusInfo(contract.status).icon}
                />
                {contract.smartContractAddress && (
                  <Tooltip title="Verified on Blockchain">
                    <Chip
                      icon={<VerifiedIcon />}
                      label="Smart Contract"
                      color="success"
                      variant="outlined"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Tooltip>
                )}
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                onClick={handleOpenChat}
              >
                Chat
              </Button>

              {contract.status === "active" && isFreelancer() && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setOpenDeliverableDialog(true)}
                  sx={{
                    bgcolor: theme.colors.secondary.main,
                    "&:hover": { bgcolor: theme.colors.secondary.dark },
                  }}
                >
                  Add Deliverable
                </Button>
              )}

              {contract.status === "pending" && isFreelancer() && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleUpdateStatus("active")}
                  disabled={statusUpdateLoading}
                >
                  {statusUpdateLoading ? <CircularProgress size={24} /> : "Accept Contract"}
                </Button>
              )}

              {contract.status === "active" && (isInvestor() || isFreelancer()) && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setOpenCancelDialog(true)}
                >
                  Cancel
                </Button>
              )}

              {contract.status === "active" && isFreelancer() && (
                <Button
                  variant="contained"
                  color="info"
                  onClick={() => setOpenCompleteDialog(true)}
                >
                  Mark Completed
                </Button>
              )}

              {contract.status === "completed" && !contract.verified && isInvestor() && (
                <Button
                  variant="contained"
                  startIcon={<WalletIcon />}
                  onClick={() => setVerifyDialogOpen(true)}
                  sx={{
                    bgcolor: theme.colors.secondary.main,
                    "&:hover": { bgcolor: theme.colors.secondary.dark },
                  }}
                >
                  Verify & Release Payment
                </Button>
              )}
            </Box>
          </ContractHeader>

          {contract.smartContractAddress && (
            <AddressBox>
              <Typography
                variant="body2"
                sx={{
                  mr: 1,
                  fontFamily: "monospace",
                  flexGrow: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {contract.smartContractAddress}
              </Typography>
              <Tooltip title="Copy Address">
                <IconButton size="small" onClick={handleCopyAddress}>
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View on Etherscan">
                <IconButton size="small" onClick={handleOpenEtherscan}>
                  <ExternalLinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </AddressBox>
          )}

          <Grid container spacing={4}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Contract Details
              </Typography>
              <Typography variant="body1" paragraph>
                {contract.description}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Contract Lifecycle
              </Typography>
              <Stepper
                activeStep={getActiveStep()}
                orientation="vertical"
                sx={{ mb: 3 }}
              >
                <Step>
                  <StepLabel>Contract Created</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      Contract was created by {contract.investor.name} on{" "}
                      {new Date(contract.createdAt).toLocaleDateString()}.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Waiting for {contract.freelancer.name} to accept the contract.
                    </Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Contract Active</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      {contract.status === "active"
                        ? `Work in progress. ${contract.freelancer.name} is currently working on deliverables.`
                        : `Contract was accepted by ${contract.freelancer.name} and work began.`}
                    </Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Contract Completed</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      {contract.status === "completed" && !contract.verified
                        ? `Work has been completed by ${contract.freelancer.name}. Waiting for ${contract.investor.name} to verify and release payment.`
                        : `Work was completed on ${
                            contract.completedAt
                              ? new Date(contract.completedAt).toLocaleDateString()
                              : "N/A"
                          }.`}
                    </Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Payment Released</StepLabel>
                  <StepContent>
                    <Typography variant="body2">
                      Contract was verified and payment was released to{" "}
                      {contract.freelancer.name}.
                    </Typography>
                  </StepContent>
                </Step>
              </Stepper>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Deliverables
              </Typography>
              {contract.deliverables.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No deliverables have been added yet.
                  {contract.status === "active" && isFreelancer() && (
                    <Button
                      sx={{ ml: 2 }}
                      startIcon={<AddIcon />}
                      onClick={() => setOpenDeliverableDialog(true)}
                    >
                      Add Deliverable
                    </Button>
                  )}
                </Typography>
              ) : (
                <List>
                  {contract.deliverables.map((deliverable) => (
                    <DeliverableItem
                      key={deliverable.id}
                      status={deliverable.status}
                      secondaryAction={
                        isInvestor() &&
                        contract.status === "active" &&
                        deliverable.status === "pending" ? (
                          <Box>
                            <Tooltip title="Approve">
                              <IconButton
                                color="success"
                                onClick={() =>
                                  handleDeliverableStatusUpdate(
                                    deliverable.id,
                                    "approved"
                                  )
                                }
                              >
                                <CompletedIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                color="error"
                                onClick={() =>
                                  handleDeliverableStatusUpdate(
                                    deliverable.id,
                                    "rejected"
                                  )
                                }
                              >
                                <CancelledIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Chip
                            label={
                              deliverable.status.charAt(0).toUpperCase() +
                              deliverable.status.slice(1)
                            }
                            color={
                              deliverable.status === "approved"
                                ? "success"
                                : deliverable.status === "rejected"
                                ? "error"
                                : "warning"
                            }
                            size="small"
                          />
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar>
                          {deliverable.fileUrl ? <FileIcon /> : <DescriptionIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={deliverable.title}
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              {deliverable.description}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block", mt: 0.5 }}
                            >
                              Added on{" "}
                              {new Date(deliverable.createdAt).toLocaleDateString()}
                            </Typography>
                          </>
                        }
                      />
                      {deliverable.fileUrl && (
                        <Tooltip title="Download File">
                          <IconButton
                            size="small"
                            onClick={() => window.open(deliverable.fileUrl, "_blank")}
                            sx={{ mr: 8 }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </DeliverableItem>
                  ))}
                </List>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "rgba(0, 0, 0, 0.02)",
                  borderRadius: theme.shape.borderRadius,
                }}
              >
                <Typography variant="h6" gutterBottom>
                  Contract Value
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ color: theme.colors.success.main, fontWeight: "bold" }}
                >
                  {formatCurrency(contract.value)}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Parties
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Investor
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/profile/${contract.investor.id}`)}
                  >
                    <Avatar
                      src={contract.investor.profileImage}
                      sx={{ mr: 1, width: 32, height: 32 }}
                    >
                      {contract.investor.name?.charAt(0) || "I"}
                    </Avatar>
                    <Typography variant="body2">
                      {contract.investor.name || contract.investor.email}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Freelancer
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 1,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/profile/${contract.freelancer.id}`)}
                  >
                    <Avatar
                      src={contract.freelancer.profileImage}
                      sx={{ mr: 1, width: 32, height: 32 }}
                    >
                      {contract.freelancer.name?.charAt(0) || "F"}
                    </Avatar>
                    <Typography variant="body2">
                      {contract.freelancer.name || contract.freelancer.email}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="h6" gutterBottom>
                  Contract Timeline
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Updated
                    </Typography>
                    <Typography variant="body2">
                      {new Date(contract.updatedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Status
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: getStatusInfo(contract.status).color }}
                    >
                      {getStatusInfo(contract.status).label}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">
                      Completed
                    </Typography>
                    <Typography variant="body2">
                      {contract.completedAt
                        ? new Date(contract.completedAt).toLocaleDateString()
                        : "Not completed"}
                    </Typography>
                  </Grid>
                </Grid>

                {contract.status === "active" && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 1,
                      }}
                    >
                      {isFreelancer() && (
                        <Button
                          variant="outlined"
                          startIcon={<AddIcon />}
                          onClick={() => setOpenDeliverableDialog(true)}
                          fullWidth
                          sx={{ mb: 1 }}
                        >
                          Add Deliverable
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<ChatIcon />}
                        onClick={handleOpenChat}
                        fullWidth
                      >
                        Contact {isInvestor() ? "Freelancer" : "Investor"}
                      </Button>
                    </Box>
                  </>
                )}
              </Paper>
            </Grid>
          </Grid>
        </StyledPaper>
      </Container>

      {/* Add Deliverable Dialog */}
      <Dialog
        open={openDeliverableDialog}
        onClose={() => setOpenDeliverableDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Deliverable</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            fullWidth
            variant="outlined"
            value={deliverableData.title}
            onChange={handleInputChange}
            required
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={deliverableData.description}
            onChange={handleInputChange}
          />
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Attach File (Optional)
            </Typography>
            <Button
              component="label"
              variant="outlined"
              startIcon={<FileIcon />}
            >
              {file ? file.name : "Choose File"}
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeliverableDialog(false)}>Cancel</Button>
          <Button onClick={handleAddDeliverable}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Contract Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Cancel Contract</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to cancel this contract? This action cannot be
            undone.
          </Typography>
          {contract.smartContractAddress && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              This will also cancel the smart contract on the blockchain and any
              funds will be returned to the investor.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>No, Keep Contract</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => handleUpdateStatus("cancelled")}
            disabled={statusUpdateLoading}
          >
            {statusUpdateLoading ? <CircularProgress size={24} /> : "Yes, Cancel Contract"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Complete Contract Dialog */}
      <Dialog
        open={openCompleteDialog}
        onClose={() => setOpenCompleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Complete Contract</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you marking this contract as completed? This will notify the
            investor to review your work and release payment.
          </Typography>
          {contract.smartContractAddress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              The blockchain contract status will be updated, but payment will
              only be released after the investor verifies the work.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCompleteDialog(false)}>Cancel</Button>
          <Button
            color="primary"
            variant="contained"
            onClick={() => handleUpdateStatus("completed")}
            disabled={statusUpdateLoading}
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            {statusUpdateLoading ? <CircularProgress size={24} /> : "Mark as Completed"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Verify Contract Dialog */}
      <Dialog
        open={verifyDialogOpen}
        onClose={() => setVerifyDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Verify and Release Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you verifying that all deliverables are complete and satisfactory?
            This will release payment to the freelancer.
          </Typography>
          {contract.smartContractAddress && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This will execute the payment function on the blockchain contract and
              transfer {formatCurrency(contract.value)} from the contract to the
              freelancer's wallet.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleVerifyAndRelease}
            sx={{
              bgcolor: theme.colors.secondary.main,
              "&:hover": { bgcolor: theme.colors.secondary.dark },
            }}
          >
            Verify & Release Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContractDetails;