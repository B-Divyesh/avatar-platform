import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Divider,
  Grid,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  ContentPaste as PasteIcon,
  Link as LinkIcon,
  Upload as UploadIcon,
  Slideshow as PresentationIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  PowerSettingsNew as PowerIcon,
  ViewQuilt as TemplateIcon,
} from "@mui/icons-material";

import Navigation from "../../components/Navigation";
import { useAuth } from "../../context/AuthContext";
import {
  generatePresentation,
  generateSummary,
} from "../../services/aiService";

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

const PreviewBox = styled(Box)(({ theme }) => ({
  backgroundColor: "#fafafa",
  padding: theme.spacing(3),
  border: "1px solid #e0e0e0",
  borderRadius: theme.shape.borderRadius,
  minHeight: "300px",
  maxHeight: "500px",
  overflowY: "auto",
}));

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`ai-tabpanel-${index}`}
      aria-labelledby={`ai-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

// Main component
const AvatarAI = ({ userType = "investor" }) => {
  const theme = useTheme();
  const { currentUser } = useAuth();
  const fileInputRef = useRef(null);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [savedPresentations, setSavedPresentations] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [useMCP, setUseMCP] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("modern");

  // Templates
  const templates = [
    { id: "modern", name: "Modern & Clean" },
    { id: "professional", name: "Professional" },
    { id: "creative", name: "Creative" },
    { id: "minimal", name: "Minimal" },
    { id: "corporate", name: "Corporate" },
  ];

  // Load saved presentations
  useEffect(() => {
    const fetchSavedPresentations = async () => {
      try {
        // In a real app, this would come from your backend
        const mockSavedPresentations = [
          {
            id: 1,
            title: "Company Overview",
            createdAt: new Date().toISOString(),
            slides: 12,
          },
          {
            id: 2,
            title: "Pitch Deck",
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            slides: 9,
          },
          {
            id: 3,
            title: "Q1 Results",
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            slides: 7,
          },
        ];

        setSavedPresentations(mockSavedPresentations);
      } catch (err) {
        console.error("Error fetching saved presentations:", err);
      }
    };

    fetchSavedPresentations();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);

      // For PDF/Word files, we could display file info
      // For simplicity, just showing the name
      setTextInput(`File: ${selectedFile.name}`);
    }
  };

  // Handle generate content
  const handleGenerateContent = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      let content;

      // Generate based on active tab
      if (activeTab === 0) {
        // URL
        if (!urlInput) {
          throw new Error("Please enter a valid URL");
        }
        content = await generatePresentation({
          url: urlInput,
          template: selectedTemplate,
          useMCP,
        });
      } else if (activeTab === 1) {
        // Text
        if (!textInput) {
          throw new Error("Please enter some text content");
        }
        content = await generatePresentation({
          text: textInput,
          template: selectedTemplate,
          useMCP,
        });
      } else if (activeTab === 2) {
        // File
        if (!file) {
          throw new Error("Please upload a file");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("template", selectedTemplate);
        formData.append("useMCP", useMCP);

        content = await generatePresentation(formData);
      }

      // Show preview of generated content
      setPreviewContent(content.preview || "Preview not available");

      // Show success message
      setSuccess(
        useMCP
          ? "Your presentation has been generated and is available in your default presentation software!"
          : "Your presentation has been generated successfully!"
      );

      // Add to saved presentations
      const newPresentation = {
        id: Date.now(),
        title: content.title || "Untitled Presentation",
        createdAt: new Date().toISOString(),
        slides: content.slideCount || 0,
      };

      setSavedPresentations([newPresentation, ...savedPresentations]);
    } catch (err) {
      console.error("Error generating content:", err);
      setError(
        err.message || "Failed to generate presentation. Please try again."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle download presentation
  const handleDownload = () => {
    // In a real app, this would download the generated presentation
    // For demo purposes, just show success message
    setSuccess("Presentation downloaded successfully!");
  };

  return (
    <>
      <Navigation />
      <Container>
        <Typography variant="h4" gutterBottom>
          Avatar AI - Create Smart Presentations
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <StyledPaper>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                sx={{ mb: 2 }}
                textColor="secondary"
                indicatorColor="secondary"
              >
                <Tab label="Website URL" />
                <Tab label="Text Input" />
                <Tab label="Upload File" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Typography variant="body1" gutterBottom>
                  Enter your website URL to generate a presentation based on its
                  content
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TextField
                    fullWidth
                    placeholder="https://yourcompany.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <LinkIcon sx={{ mr: 1, color: "text.secondary" }} />
                      ),
                    }}
                  />
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Typography variant="body1" gutterBottom>
                  Enter or paste your content to generate a presentation
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  placeholder="Paste your content here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  startIcon={<PasteIcon />}
                  onClick={() => {
                    navigator.clipboard.readText().then(
                      (text) => setTextInput(text),
                      (err) =>
                        console.error(
                          "Failed to read clipboard contents: ",
                          err
                        )
                    );
                  }}
                  sx={{ mb: 2 }}
                >
                  Paste from Clipboard
                </Button>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Typography variant="body1" gutterBottom>
                  Upload a document to generate a presentation
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    py: 3,
                  }}
                >
                  <input
                    ref={fileInputRef}
                    accept=".doc,.docx,.pdf,.ppt,.pptx,.txt,.md"
                    type="file"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => fileInputRef.current.click()}
                    sx={{ mb: 2 }}
                  >
                    Choose File
                  </Button>
                  {file && (
                    <Typography variant="body2" color="text.secondary">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </Typography>
                  )}
                </Box>
              </TabPanel>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Typography variant="h6">Presentation Settings</Typography>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={useMCP}
                        onChange={(e) => setUseMCP(e.target.checked)}
                        color="secondary"
                      />
                    }
                    label="Use MCP (Open in local presentation app)"
                  />

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TemplateIcon color="action" />
                    <Typography variant="body2">Template:</Typography>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      style={{
                        padding: "8px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                        backgroundColor: "#fff",
                      }}
                    >
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setUrlInput("");
                      setTextInput("");
                      setFile(null);
                      setPreviewContent("");
                    }}
                  >
                    Clear
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={
                      isGenerating ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <PresentationIcon />
                      )
                    }
                    onClick={handleGenerateContent}
                    disabled={isGenerating}
                    sx={{
                      bgcolor: theme.colors.secondary.main,
                      "&:hover": { bgcolor: theme.colors.secondary.dark },
                    }}
                  >
                    {isGenerating ? "Generating..." : "Generate Presentation"}
                  </Button>
                </Box>
              </Box>
            </StyledPaper>

            {previewContent && (
              <StyledPaper>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">Preview</Typography>
                  <Button startIcon={<DownloadIcon />} onClick={handleDownload}>
                    Download
                  </Button>
                </Box>
                <PreviewBox>
                  <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                </PreviewBox>
              </StyledPaper>
            )}
          </Grid>

          <Grid item xs={12} md={4}>
            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                Saved Presentations
              </Typography>

              {savedPresentations.length === 0 ? (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  No presentations saved yet. Generate your first presentation!
                </Typography>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {savedPresentations.map((presentation) => (
                    <Paper
                      key={presentation.id}
                      sx={{
                        p: 2,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        "&:hover": { bgcolor: "rgba(0,0,0,0.02)" },
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1">
                          {presentation.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(
                            presentation.createdAt
                          ).toLocaleDateString()}{" "}
                          • {presentation.slides} slides
                        </Typography>
                      </Box>
                      <Box>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}
            </StyledPaper>

            <StyledPaper>
              <Typography variant="h6" gutterBottom>
                About Avatar AI
              </Typography>
              <Typography variant="body1" paragraph>
                Avatar AI converts your content into professionally designed
                presentations that can be opened directly in your preferred
                presentation software.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Features:</strong>
              </Typography>
              <ul>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Convert websites, documents, and text into presentations
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Uses AI to structure and format content intelligently
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  MCP technology enables direct editing in Microsoft Office or
                  LibreOffice
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Multiple professional templates to choose from
                </Typography>
                <Typography
                  component="li"
                  variant="body2"
                  color="text.secondary"
                >
                  Save, edit, and download your presentations anytime
                </Typography>
              </ul>
            </StyledPaper>
          </Grid>
        </Grid>

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
      </Container>
    </>
  );
};

export default AvatarAI;
