import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";

const SubmitVerification: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      const res = await fetch("/api/verification/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      setMessage("Document uploaded successfully! Awaiting admin review.");
      setFile(null);
      setSuccess(true);
    } catch (err) {
      setMessage("Failed to upload document.");
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mx: 5, my: 5 }}>
      <Typography variant="h5" gutterBottom style={{ color: "#020F6F" }}>
        Submit Verification Documents
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "text.secondary" }}>
        Please provide references to your identification documents. This helps
        us verify your identity and build trust in our community.
      </Typography>
      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileChange}
        style={{ marginBottom: 20 }}
      />
      <Box>
        <Button type="submit" variant="contained" disabled={uploading || !file}>
          {uploading ? <CircularProgress size={20} /> : "Upload"}
        </Button>
      </Box>
      {message && (
        <Alert sx={{ mt: 2 }} severity={success ? "success" : "error"}>
          {message}
        </Alert>
      )}
    </Box>
  );
};

export default SubmitVerification;
