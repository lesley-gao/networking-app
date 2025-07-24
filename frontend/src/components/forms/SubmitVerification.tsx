import React, { useState, useEffect } from "react";
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

interface VerificationStatus {
  status: string;
  fileName?: string;
  uploadedAt?: string;
  adminComment?: string;
}

const SubmitVerification: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const checkVerificationStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("https://localhost:5001/api/verification/status", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (res.ok) {
        const data = await res.json();
        setVerificationStatus(data);
      }
    } catch (err) {
      console.error("Error checking verification status:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setMessage(null);
      setSuccess(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select a file to upload.");
      setSuccess(false);
      return;
    }
    setUploading(true);
    setMessage(null);
    setSuccess(false);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("https://localhost:5001/api/verification/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Document uploaded successfully! Awaiting admin review.");
        setFile(null);
        setSuccess(true);
        // Refresh status after successful upload
        await checkVerificationStatus();
      } else {
        // Show specific error message from the server
        setMessage(data.message || "Failed to upload document.");
        setSuccess(false);
      }
    } catch (err) {
      setMessage("Failed to upload document. Please try again.");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Your document is pending admin review. You cannot upload a new document until this one is reviewed.';
      case 'approved':
        return 'Your document has been approved! You are now verified.';
      case 'rejected':
        return 'Your document was rejected. You can upload a new document.';
      default:
        return 'No verification document submitted.';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mx: 5, my: 5 }}>
      <Typography variant="h5" gutterBottom style={{ color: "#020F6F" }} >
        Submit Verification Documents
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Please provide references to your identification documents. This helps
        us verify your identity and build trust in our community.
      </Typography>

      {/* Current Status Display */}
      {loadingStatus ? (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography>Loading verification status...</Typography>
        </Box>
      ) : verificationStatus && (
        <Alert 
          severity={getStatusColor(verificationStatus.status) as any} 
          sx={{ mb: 3 }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Current Status: {verificationStatus.status.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            {getStatusMessage(verificationStatus.status)}
          </Typography>
          {verificationStatus.fileName && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              File: {verificationStatus.fileName}
            </Typography>
          )}
          {verificationStatus.adminComment && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Admin Comment: {verificationStatus.adminComment}
            </Typography>
          )}
        </Alert>
      )}

      {/* File Upload Section - Only show if no pending document */}
      {(!verificationStatus || verificationStatus.status === 'rejected' || verificationStatus.status === 'not_submitted') ? (
        <>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            style={{ marginBottom: 8 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 2, display: "block" }}
          >
            Accepted file types: Images (JPG, PNG, GIF, etc.) or PDF
          </Typography>
          <Box>
            <Button type="submit" variant="contained" disabled={uploading || !file}>
              {uploading ? <CircularProgress size={20} /> : "Upload"}
            </Button>
          </Box>
        </>
      ) : verificationStatus.status === 'pending' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          You already have a verification document in the system. Please wait for admin review or contact support if you need to update your document.
        </Alert>
      ) : null}

      {message && (
        <Alert sx={{ mt: 2 }} severity={success ? "success" : "error"}>
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default SubmitVerification;
