import { createTheme } from '@mui/material/styles';

// Theme configuration based on the provided UI images
const theme = createTheme({
  palette: {
    primary: {
      main: "#FFEB3B", // Yellow from the sticky notes/background
      light: "#FFF59D",
      dark: "#FBC02D",
    },
    secondary: {
      main: "#E91E63", // Bubblegum pink from the nav bar
      light: "#F8BBD0",
      dark: "#C2185B",
    },
    background: {
      default: "#FFEB3B", // Yellow background
      paper: "#FFFFFF", // White sticky notes
    },
    text: {
      primary: "#212121",
      secondary: "#757575",
      disabled: "#BDBDBD",
      hint: "#9E9E9E",
    },
    error: {
      main: "#F44336",
    },
    warning: {
      main: "#FF9800",
    },
    info: {
      main: "#2196F3",
    },
    success: {
      main: "#4CAF50",
    },
  },
  // Keep custom colors for components that might reference them
  colors: {
    primary: {
      main: "#FFEB3B",
      light: "#FFF59D",
      dark: "#FBC02D",
    },
    secondary: {
      main: "#E91E63",
      light: "#F8BBD0",
      dark: "#C2185B",
    },
    background: {
      default: "#FFEB3B",
      paper: "#FFFFFF",
      secondary: "#F06292", // Lighter pink
    },
    text: {
      primary: "#212121",
      secondary: "#757575",
      disabled: "#BDBDBD",
      hint: "#9E9E9E",
    },
    error: {
      main: "#F44336",
    },
    warning: {
      main: "#FF9800",
    },
    info: {
      main: "#2196F3",
    },
    success: {
      main: "#4CAF50",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 500,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 500,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 500,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
    },
    body2: {
      fontSize: "0.875rem",
    },
  },
  shape: {
    borderRadius: 8,
  },
  shadows: [
    "none",
    "0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)",
    "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)",
    "0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)",
    // Add more shadows if needed
  ],
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: "0px 3px 5px rgba(0,0,0,0.2)",
        },
      },
    },
  },
});

export default theme;