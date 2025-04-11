import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { Home as HomeIcon } from '@mui/icons-material';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  maxWidth: '500px',
  margin: '0 auto',
  marginTop: theme.spacing(10),
  backgroundColor: theme.colors.background.paper,
}));

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      backgroundColor: '#FFEB3B',
      padding: 2
    }}>
      <StyledPaper>
        <Typography variant="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
          Oops! The page you are looking for does not exist. It might have been moved or deleted.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<HomeIcon />}
          onClick={() => navigate('/')}
          sx={{ 
            backgroundColor: '#E91E63',
            '&:hover': { backgroundColor: '#C2185B' } 
          }}
        >
          Back to Home
        </Button>
      </StyledPaper>
    </Box>
  );
};

export default NotFound;