#r "nuget: Microsoft.Data.Sqlite, 7.0.0"
#r "nuget: Azure.Storage.Blobs, 12.16.0"
#r "nuget: DotNetEnv, 3.1.0"
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Azure.Storage.Blobs;
using Azure;
using DotNetEnv;

// Load .env file from backend folder if present
try
{
    DotNetEnv.Env.Load("backend/.env");
}
catch (Exception ex)
{
    Console.WriteLine($"[INFO] Could not load backend/.env: {ex.Message}");
}

string dbPath = Environment.GetEnvironmentVariable("VERIFICATION_DB_PATH") ?? "backend/FlightCompanion.db";
string blobConnStr = Environment.GetEnvironmentVariable("AZURE_BLOB_CONNECTION_STRING") ?? "";
string containerName = Environment.GetEnvironmentVariable("AZURE_BLOB_CONTAINER") ?? "verification-documents";

if (string.IsNullOrWhiteSpace(blobConnStr))
{
    Console.WriteLine("[ERROR] AZURE_BLOB_CONNECTION_STRING is not set. Please set it in backend/.env or as an environment variable.");
    Environment.Exit(1);
}

Main();

void Main()
{
    var blobServiceClient = new BlobServiceClient(blobConnStr);
    var containerClient = blobServiceClient.GetBlobContainerClient(containerName);

    using var connection = new SqliteConnection($"Data Source={dbPath}");
    connection.Open();

    var selectCmd = connection.CreateCommand();
    selectCmd.CommandText = "SELECT Id, BlobUri, FileName, UserId FROM VerificationDocuments";
    var toDelete = new List<int>();

    using (var reader = selectCmd.ExecuteReader())
    {
        while (reader.Read())
        {
            int id = reader.GetInt32(0);
            string blobUri = reader.GetString(1);
            string fileName = reader.GetString(2);
            int userId = reader.GetInt32(3);
            try
            {
                var uri = new Uri(blobUri);
                string blobName = uri.AbsolutePath.TrimStart('/');
                var blobClient = containerClient.GetBlobClient(blobName);
                if (!blobClient.Exists())
                {
                    Console.WriteLine($"[DELETE] Orphaned record: Id={id}, UserId={userId}, FileName={fileName}, BlobUri={blobUri}");
                    toDelete.Add(id);
                }
                else
                {
                    Console.WriteLine($"[KEEP] Valid record: Id={id}, UserId={userId}, FileName={fileName}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Id={id}, BlobUri={blobUri}, Exception={ex.Message}");
                toDelete.Add(id);
            }
        }
    }

    foreach (var id in toDelete)
    {
        var deleteCmd = connection.CreateCommand();
        deleteCmd.CommandText = "DELETE FROM VerificationDocuments WHERE Id = @id";
        deleteCmd.Parameters.AddWithValue("@id", id);
        deleteCmd.ExecuteNonQuery();
    }

    Console.WriteLine($"Cleanup complete. Deleted {toDelete.Count} orphaned records.");
}