using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Azure.Identity;
using NetworkingApp.Models;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Security.Cryptography;
using System.Text;

namespace NetworkingApp.Services
{
    /// <summary>
    /// Interface for Azure Blob Storage operations for verification documents.
    /// </summary>
    public interface IBlobStorageService
    {
        Task<BlobUploadResult> UploadVerificationDocumentAsync(Stream fileStream, string fileName, string contentType, int userId);
        Task<Stream> DownloadVerificationDocumentAsync(string blobName);
        Task<string> GenerateSecureDownloadUrlAsync(string blobName, TimeSpan expiry);
        Task<bool> DeleteVerificationDocumentAsync(string blobName);
        Task<bool> MoveToQuarantineAsync(string blobName, string reason);
        Task<BlobMetadata> GetBlobMetadataAsync(string blobName);
        Task<bool> ValidateFileSecurityAsync(Stream fileStream, string fileName);
    }

    /// <summary>
    /// Azure Blob Storage service for handling verification document uploads with security features.
    /// </summary>
    public class BlobStorageService : IBlobStorageService
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly BlobContainerClient _verificationContainer;
        private readonly BlobContainerClient _quarantineContainer;
        private readonly IConfiguration _configuration;
        private readonly ILogger<BlobStorageService> _logger;
        private readonly ITelemetryService _telemetryService;

        // Allowed file types for verification documents
        private readonly HashSet<string> _allowedContentTypes = new()
        {
            "image/jpeg",
            "image/jpg", 
            "image/png",
            "image/gif",
            "application/pdf",
            "image/bmp",
            "image/tiff"
        };

        // Maximum file size (10MB)
        private const long MaxFileSize = 10 * 1024 * 1024;

        public BlobStorageService(
            IConfiguration configuration,
            ILogger<BlobStorageService> logger,
            ITelemetryService telemetryService)
        {
            _configuration = configuration;
            _logger = logger;
            _telemetryService = telemetryService;

            var storageAccountName = _configuration["BlobStorage:AccountName"];
            var verificationContainerName = _configuration["BlobStorage:VerificationContainer"];
            var quarantineContainerName = _configuration["BlobStorage:QuarantineContainer"];

            if (string.IsNullOrEmpty(storageAccountName))
            {
                throw new InvalidOperationException("BlobStorage:AccountName configuration is required");
            }

            // Use Azure Identity for authentication (managed identity in production)
            var credential = new DefaultAzureCredential();
            var blobServiceUri = new Uri($"https://{storageAccountName}.blob.core.windows.net");
            
            _blobServiceClient = new BlobServiceClient(blobServiceUri, credential);
            _verificationContainer = _blobServiceClient.GetBlobContainerClient(verificationContainerName ?? "verification-documents");
            _quarantineContainer = _blobServiceClient.GetBlobContainerClient(quarantineContainerName ?? "quarantine");
        }

        public async Task<BlobUploadResult> UploadVerificationDocumentAsync(Stream fileStream, string fileName, string contentType, int userId)
        {
            try
            {
                // Validate file size
                if (fileStream.Length > MaxFileSize)
                {
                    _logger.LogWarning("File upload rejected: File size {FileSize} exceeds maximum {MaxSize} for user {UserId}", 
                        fileStream.Length, MaxFileSize, userId);
                    return new BlobUploadResult { IsSuccess = false, ErrorMessage = "File size exceeds maximum allowed size of 10MB" };
                }

                // Validate content type
                if (!_allowedContentTypes.Contains(contentType.ToLowerInvariant()))
                {
                    _logger.LogWarning("File upload rejected: Content type {ContentType} not allowed for user {UserId}", 
                        contentType, userId);
                    return new BlobUploadResult { IsSuccess = false, ErrorMessage = "File type not allowed" };
                }

                // Validate file content security
                fileStream.Position = 0;
                if (!await ValidateFileSecurityAsync(fileStream, fileName))
                {
                    _logger.LogWarning("File upload rejected: Security validation failed for user {UserId}", userId);
                    return new BlobUploadResult { IsSuccess = false, ErrorMessage = "File failed security validation" };
                }

                // Generate secure blob name
                var blobName = GenerateSecureBlobName(fileName, userId);
                var blobClient = _verificationContainer.GetBlobClient(blobName);

                // Prepare metadata
                var metadata = new Dictionary<string, string>
                {
                    ["userId"] = userId.ToString(),
                    ["originalFileName"] = fileName,
                    ["uploadedAt"] = DateTime.UtcNow.ToString("O"),
                    ["contentType"] = contentType,
                    ["fileSize"] = fileStream.Length.ToString()
                };

                // Upload with metadata
                fileStream.Position = 0;
                var uploadOptions = new BlobUploadOptions
                {
                    Metadata = metadata,
                    HttpHeaders = new BlobHttpHeaders
                    {
                        ContentType = contentType,
                        CacheControl = "private, max-age=0"
                    },
                    AccessTier = AccessTier.Hot
                };

                var response = await blobClient.UploadAsync(fileStream, uploadOptions);

                // Track telemetry
                _telemetryService.TrackVerificationDocumentUploaded(userId, fileName, fileStream.Length);

                _logger.LogInformation("Successfully uploaded verification document {BlobName} for user {UserId}", 
                    blobName, userId);

                return new BlobUploadResult
                {
                    IsSuccess = true,
                    BlobName = blobName,
                    BlobUri = blobClient.Uri.ToString(),
                    ETag = response.Value.ETag.ToString()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading verification document for user {UserId}: {Error}", 
                    userId, ex.Message);
                _telemetryService.TrackException(ex, new Dictionary<string, string>
                {
                    ["operation"] = "UploadVerificationDocument",
                    ["userId"] = userId.ToString()
                });

                return new BlobUploadResult { IsSuccess = false, ErrorMessage = "Upload failed due to server error" };
            }
        }

        public async Task<Stream> DownloadVerificationDocumentAsync(string blobName)
        {
            try
            {
                var blobClient = _verificationContainer.GetBlobClient(blobName);
                var response = await blobClient.DownloadStreamingAsync();
                return response.Value.Content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading verification document {BlobName}: {Error}", 
                    blobName, ex.Message);
                throw;
            }
        }

        public async Task<string> GenerateSecureDownloadUrlAsync(string blobName, TimeSpan expiry)
        {
            try
            {
                var blobClient = _verificationContainer.GetBlobClient(blobName);
                
                // Check if the blob exists
                if (!await blobClient.ExistsAsync())
                {
                    throw new FileNotFoundException($"Blob {blobName} not found");
                }

                // Generate SAS token for secure access
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _verificationContainer.Name,
                    BlobName = blobName,
                    Resource = "b",
                    ExpiresOn = DateTimeOffset.UtcNow.Add(expiry)
                };
                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                var sasUri = blobClient.GenerateSasUri(sasBuilder);
                return sasUri.ToString();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating secure download URL for {BlobName}: {Error}", 
                    blobName, ex.Message);
                throw;
            }
        }

        public async Task<bool> DeleteVerificationDocumentAsync(string blobName)
        {
            try
            {
                var blobClient = _verificationContainer.GetBlobClient(blobName);
                var response = await blobClient.DeleteIfExistsAsync();
                
                if (response.Value)
                {
                    _logger.LogInformation("Successfully deleted verification document {BlobName}", blobName);
                    _telemetryService.TrackCustomEvent("VerificationDocumentDeleted", new Dictionary<string, string>
                    {
                        ["blobName"] = blobName
                    });
                }

                return response.Value;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting verification document {BlobName}: {Error}", 
                    blobName, ex.Message);
                return false;
            }
        }

        public async Task<bool> MoveToQuarantineAsync(string blobName, string reason)
        {
            try
            {
                var sourceBlobClient = _verificationContainer.GetBlobClient(blobName);
                var destinationBlobClient = _quarantineContainer.GetBlobClient($"quarantine-{DateTime.UtcNow:yyyyMMdd-HHmmss}-{blobName}");

                // Copy to quarantine
                var copyOperation = await destinationBlobClient.StartCopyFromUriAsync(sourceBlobClient.Uri);
                await copyOperation.WaitForCompletionAsync();

                // Add quarantine metadata
                var metadata = new Dictionary<string, string>
                {
                    ["quarantineReason"] = reason,
                    ["quarantinedAt"] = DateTime.UtcNow.ToString("O"),
                    ["originalLocation"] = blobName
                };
                await destinationBlobClient.SetMetadataAsync(metadata);

                // Delete from verification container
                await sourceBlobClient.DeleteIfExistsAsync();

                _logger.LogWarning("Moved verification document {BlobName} to quarantine. Reason: {Reason}", 
                    blobName, reason);
                _telemetryService.TrackCustomEvent("VerificationDocumentQuarantined", new Dictionary<string, string>
                {
                    ["blobName"] = blobName,
                    ["reason"] = reason
                });

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moving verification document {BlobName} to quarantine: {Error}", 
                    blobName, ex.Message);
                return false;
            }
        }

        public async Task<BlobMetadata> GetBlobMetadataAsync(string blobName)
        {
            try
            {
                var blobClient = _verificationContainer.GetBlobClient(blobName);
                var properties = await blobClient.GetPropertiesAsync();

                return new BlobMetadata
                {
                    BlobName = blobName,
                    ContentType = properties.Value.ContentType,
                    Size = properties.Value.ContentLength,
                    LastModified = properties.Value.LastModified,
                    ETag = properties.Value.ETag.ToString(),
                    Metadata = properties.Value.Metadata
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting metadata for blob {BlobName}: {Error}", blobName, ex.Message);
                throw;
            }
        }

        public async Task<bool> ValidateFileSecurityAsync(Stream fileStream, string fileName)
        {
            try
            {
                // Basic file extension validation
                var extension = Path.GetExtension(fileName).ToLowerInvariant();
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".bmp", ".tiff" };
                
                if (!allowedExtensions.Contains(extension))
                {
                    return false;
                }

                // Check for common malicious file signatures
                fileStream.Position = 0;
                var buffer = new byte[512];
                var bytesRead = await fileStream.ReadAsync(buffer);

                // Reset position
                fileStream.Position = 0;

                // Basic signature validation (this is a simplified example)
                // In production, integrate with a proper antivirus/malware scanning service
                return await Task.FromResult(ValidateFileSignature(buffer[..bytesRead], extension));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating file security for {FileName}: {Error}", fileName, ex.Message);
                return false;
            }
        }

        private bool ValidateFileSignature(ReadOnlySpan<byte> buffer, string extension)
        {
            // Basic file signature validation
            return extension switch
            {
                ".jpg" or ".jpeg" => buffer.Length >= 3 && buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF,
                ".png" => buffer.Length >= 8 && buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47,
                ".pdf" => buffer.Length >= 4 && buffer[0] == 0x25 && buffer[1] == 0x50 && buffer[2] == 0x44 && buffer[3] == 0x46,
                ".gif" => buffer.Length >= 6 && buffer[0] == 0x47 && buffer[1] == 0x49 && buffer[2] == 0x46,
                ".bmp" => buffer.Length >= 2 && buffer[0] == 0x42 && buffer[1] == 0x4D,
                ".tiff" => buffer.Length >= 4 && ((buffer[0] == 0x49 && buffer[1] == 0x49) || (buffer[0] == 0x4D && buffer[1] == 0x4D)),
                _ => false
            };
        }

        private string GenerateSecureBlobName(string originalFileName, int userId)
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd-HHmmss");
            var extension = Path.GetExtension(originalFileName);
            var hash = ComputeHash($"{userId}-{originalFileName}-{timestamp}");
            return $"user-{userId}/{timestamp}-{hash}{extension}";
        }

        private string ComputeHash(string input)
        {
            using var sha256 = SHA256.Create();
            var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(hashBytes)[..8].ToLowerInvariant();
        }
    }

    /// <summary>
    /// Result of a blob upload operation.
    /// </summary>
    public class BlobUploadResult
    {
        public bool IsSuccess { get; set; }
        public string? BlobName { get; set; }
        public string? BlobUri { get; set; }
        public string? ETag { get; set; }
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Metadata information for a blob.
    /// </summary>
    public class BlobMetadata
    {
        public string BlobName { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long Size { get; set; }
        public DateTimeOffset LastModified { get; set; }
        public string? ETag { get; set; }
        public IDictionary<string, string>? Metadata { get; set; }
    }
}
