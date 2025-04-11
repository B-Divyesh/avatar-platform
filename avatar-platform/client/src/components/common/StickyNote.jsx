import React from "react";
import { Paper, Typography, Box, Chip, useTheme, styled } from "@mui/material";
import { StarRate as StarIcon } from "@mui/icons-material";

// Styled components
const StyledStickyNote = styled(Paper)(({ theme, elevated }) => ({
  padding: theme.spacing(3),
  margin: theme.spacing(2),
  height: "180px",
  width: "180px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: theme.colors.background.paper,
  boxShadow: elevated
    ? "0px 6px 12px rgba(0, 0, 0, 0.3)"
    : "0px 4px 8px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.2s, box-shadow 0.2s",
  position: "relative",
  overflow: "hidden",
  cursor: "pointer",
  "&:hover": {
    transform: "translateY(-5px)",
    boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
  },
}));

const SmartStyledStickyNote = styled(StyledStickyNote)(({ theme }) => ({
  background: "linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)",
  "&::after": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background:
      "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.1) 100%)",
    backgroundSize: "200% 200%",
    animation: "holographic 5s ease infinite",
    pointerEvents: "none",
  },
  "@keyframes holographic": {
    "0%": {
      backgroundPosition: "0% 0%",
    },
    "50%": {
      backgroundPosition: "100% 100%",
    },
    "100%": {
      backgroundPosition: "0% 0%",
    },
  },
}));

/**
 * StickyNote component for displaying user profiles or contracts
 *
 * @param {Object} props Component props
 * @param {string} props.title Note title
 * @param {number} props.rating Rating (0-5)
 * @param {string} props.description Short description
 * @param {Array} props.tags Array of tag strings
 * @param {boolean} props.isSmartContract Whether this is a smart contract (for special styling)
 * @param {boolean} props.elevated Whether to show elevated styling
 * @param {function} props.onClick Click handler
 * @param {React.ReactNode} props.actions Additional actions to display
 * @returns {React.ReactElement} Sticky note component
 */
const StickyNote = ({
  title,
  rating,
  description,
  tags = [],
  isSmartContract = false,
  elevated = false,
  onClick,
  actions,
  children,
  ...rest
}) => {
  const theme = useTheme();

  const NoteComponent = isSmartContract
    ? SmartStyledStickyNote
    : StyledStickyNote;

  return (
    <NoteComponent onClick={onClick} elevated={elevated} {...rest}>
      <Typography variant="h6" noWrap sx={{ mb: 1 }}>
        {title}
      </Typography>

      {rating !== undefined && (
        <Box sx={{ mb: 1, display: "flex", alignItems: "center" }}>
          <StarIcon sx={{ color: theme.colors.warning.main, mr: 0.5 }} />
          <Typography variant="body2">{rating.toFixed(1)}</Typography>
        </Box>
      )}

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 1, flex: 1, overflow: "hidden" }}
      >
        {description?.substring(0, 70) || "No description available"}
        {(description?.length || 0) > 70 ? "..." : ""}
      </Typography>

      {tags.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
          {tags.slice(0, 2).map((tag, idx) => (
            <Chip key={idx} label={tag} size="small" />
          ))}
          {tags.length > 2 && (
            <Chip label={`+${tags.length - 2}`} size="small" />
          )}
        </Box>
      )}

      {children}

      {actions && (
        <Box
          sx={{
            position: "absolute",
            right: theme.spacing(1),
            bottom: theme.spacing(1),
          }}
        >
          {actions}
        </Box>
      )}
    </NoteComponent>
  );
};

export default StickyNote;
