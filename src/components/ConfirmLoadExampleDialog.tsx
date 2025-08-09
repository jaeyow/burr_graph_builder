import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import {
  Warning as WarningIcon,
} from '@mui/icons-material';

interface ConfirmLoadExampleDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  exampleTitle: string;
  hasExistingContent: boolean;
}

const ConfirmLoadExampleDialog: React.FC<ConfirmLoadExampleDialogProps> = ({
  open,
  onClose,
  onConfirm,
  exampleTitle,
  hasExistingContent,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <WarningIcon color="warning" />
        Load Example Graph
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to load the "{exampleTitle}" example?
        </Typography>

        {hasExistingContent && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              This will replace your current graph. Any unsaved changes will be lost.
            </Typography>
          </Alert>
        )}

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            You can always export your current work as JSON or Python code before loading the example.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onConfirm} 
          variant="contained" 
          color={hasExistingContent ? "warning" : "primary"}
        >
          {hasExistingContent ? "Replace Graph" : "Load Example"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmLoadExampleDialog;
