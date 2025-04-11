import React from "react";
import {
  Paper,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Tooltip,
  useTheme,
  styled,
} from "@mui/material";
import {
  VerifiedUser as VerifiedIcon,
  LinkOff as UnverifiedIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
  Flag as StatusIcon,
} from "@mui/icons-material";

// Styled components
const StyledCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  backgroundColor: theme.colors.background.paper,
  position: "relative",
  borderRadius: theme.shape.borderRadius,
  overflow: "hidden",
  boxShadow: theme.shadows[2],
}));

const HolographicOverlay = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  height: "8px",
  background:
    "linear-gradient(90deg, rgba(255,235,59,1) 0%, rgba(233,30,99,1) 50%, rgba(255,235,59,1) 100%)",
  backgroundSize: "200% 100%",
  animation: "shimmer 3s linear infinite",
  "@keyframes shimmer": {
    "0%": {
      backgroundPosition: "0% 0%",
    },
    "100%": {
      backgroundPosition: "200% 0%",
    },
  },
}));

const AddressBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(1, 2),
  backgroundColor: "rgba(0, 0, 0, 0.04)",
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
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

/**
 * SmartContractCard component for displaying contract details
 *
 * @param {Object} props Component props
 * @param {string} props.title Contract title
 * @param {string} props.address Smart contract address
 * @param {string} props.status Contract status
 * @param {boolean} props.verified Whether contract is verified
 * @param {string} props.description Contract description
 * @param {Object} props.investor Investor info
 * @param {Object} props.freelancer Freelancer info
 * @param {number} props.value Contract value
 * @param {Array} props.tags Tag list
 * @param {function} props.onClick Click handler
 * @param {React.ReactNode} props.actions Additional actions
 * @returns {React.ReactElement} Smart contract card component
 */
const SmartContractCard = ({
  title,
  address,
  status = "pending",
  verified = false,
  description,
  investor,
  freelancer,
  value,
  tags = [],
  onClick,
  actions,
  children,
  ...rest
}) => {
  const theme = useTheme();

  const handleCopyAddress = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
  };

  const handleOpenEtherscan = (e) => {
    e.stopPropagation();
    window.open(`https://etherscan.io/address/${address}`, "_blank");
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: "Pending",
      active: "Active",
      completed: "Completed",
      cancelled: "Cancelled",
      draft: "Draft",
    };
    return statusMap[status] || "Unknown";
  };

  return (
    <StyledCard onClick={onClick} {...rest}>
      <HolographicOverlay />

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mt: 1,
          mb: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <StatusChip
            status={status}
            icon={<StatusIcon />}
            label={getStatusLabel(status)}
            size="small"
          />

          <Tooltip
            title={verified ? "Verified Contract" : "Unverified Contract"}
          >
            <IconButton size="small" color={verified ? "success" : "default"}>
              {verified ? <VerifiedIcon /> : <UnverifiedIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {address && (
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
            {address}
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

      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        {investor && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Investor
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {investor.name || investor.email || "Unknown Investor"}
            </Typography>
          </Box>
        )}

        {freelancer && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Freelancer
            </Typography>
            <Typography variant="body2" fontWeight="medium">
              {freelancer.name || freelancer.email || "Unknown Freelancer"}
            </Typography>
          </Box>
        )}

        {value !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Value
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              color={theme.colors.success.main}
            >
              ${value.toLocaleString()}
            </Typography>
          </Box>
        )}
      </Box>

      {tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mb: 2 }}>
          {tags.map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" />
          ))}
        </Box>
      )}

      {children && (
        <>
          <Divider sx={{ my: 2 }} />
          {children}
        </>
      )}

      {actions && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          {actions}
        </Box>
      )}
    </StyledCard>
  );
};

export default SmartContractCard;
