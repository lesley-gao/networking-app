﻿using System.CommandLine;
using Microsoft.Extensions.Hosting;
using GenAIDBExplorer.Console.CommandHandlers;
using GenAIDBExplorer.Console.Extensions;

namespace GenAIDBExplorer.Console;

/// <summary>
/// The main entry point for the GenAI Database Explorer tool.
/// </summary>
internal static class Program
{
    /// <summary>
    /// The main method that sets up and runs the application.
    /// </summary>
    /// <param name="args">The command-line arguments.</param>
    /// <returns>The exit code.</returns>
    private static async Task<int> Main(string[] args)
    {
        // Create the root command with a description
        var rootCommand = new RootCommand("GenAI Database Explorer console application");

        // Build the host
        var host = Host.CreateDefaultBuilder(args)
            .ConfigureHost(args)
            .Build();

        // Set up commands
        rootCommand.Subcommands.Add(InitProjectCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(DataDictionaryCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(EnrichModelCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(ExportModelCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(ExtractModelCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(QueryModelCommandHandler.SetupCommand(host));
        rootCommand.Subcommands.Add(ShowObjectCommandHandler.SetupCommand(host));

        // For beta5, the pattern might be different - let me try parsing and executing directly
        // Since we can't find the right invocation method, let's try command line argument parsing 
        try
        {
            await rootCommand.Parse(args).InvokeAsync();
            return 0;
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Error: {ex.Message}");
            return 1;
        }
    }
}
