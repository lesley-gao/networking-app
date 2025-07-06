﻿using GenAIDBExplorer.Core.Data.DatabaseProviders;
using GenAIDBExplorer.Core.Models.Project;
using GenAIDBExplorer.Core.SemanticModelProviders;
using GenAIDBExplorer.Console.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.CommandLine;
using System.Resources;

namespace GenAIDBExplorer.Console.CommandHandlers;

/// <summary>
/// Command handler for extracting a model from a project.
/// </summary>
/// <remarks>
/// Initializes a new instance of the <see cref="ExtractModelCommandHandler"/> class.
/// </remarks>
/// <param name="project">The project instance to extract the model from.</param>
/// <param name="connectionProvider">The database connection provider instance for connecting to a SQL database.</param>
/// <param name="semanticModelProvider">The semantic model provider instance for building a semantic model of the database.</param>
/// <param name="serviceProvider">The service provider instance for resolving dependencies.</param>
/// <param name="logger">The logger instance for logging information, warnings, and errors.</param>
public class ExtractModelCommandHandler(
    IProject project,
    IDatabaseConnectionProvider connectionProvider,
    ISemanticModelProvider semanticModelProvider,
    IOutputService outputService,
    IServiceProvider serviceProvider,
    ILogger<ICommandHandler<ExtractModelCommandHandlerOptions>> logger
) : CommandHandler<ExtractModelCommandHandlerOptions>(project, connectionProvider, semanticModelProvider, outputService, serviceProvider, logger)
{
    private static readonly ResourceManager _resourceManagerLogMessages = new("GenAIDBExplorer.Console.Resources.LogMessages", typeof(ExtractModelCommandHandler).Assembly);

    /// <summary>
    /// Sets up the extract model command.
    /// </summary>
    /// <param name="host">The host instance.</param>
    /// <returns>The extract model command.</returns>
    public static Command SetupCommand(IHost host)
    {
        var projectPathOption = new Option<DirectoryInfo>("--project", "-p")
        {
            Description = "The path to the GenAI Database Explorer project.",
            Required = true
        };

        var skipTablesOption = new Option<bool>("--skipTables")
        {
            Description = "Flag to skip tables during the extract model process."
        };

        var skipViewsOption = new Option<bool>("--skipViews")
        {
            Description = "Flag to skip views during the extract model process."
        };

        var skipStoredProceduresOption = new Option<bool>("--skipStoredProcedures")
        {
            Description = "Flag to skip stored procedures during the extract model process."
        };

        var extractModelCommand = new Command("extract-model", "Extract a semantic model from a SQL database for a GenAI Database Explorer project.");
        extractModelCommand.Options.Add(projectPathOption);
        extractModelCommand.Options.Add(skipTablesOption);
        extractModelCommand.Options.Add(skipViewsOption);
        extractModelCommand.Options.Add(skipStoredProceduresOption);
        extractModelCommand.SetAction(async (parseResult) =>
        {
            var projectPath = parseResult.GetValue(projectPathOption)!;
            var skipTables = parseResult.GetValue(skipTablesOption);
            var skipViews = parseResult.GetValue(skipViewsOption);
            var skipStoredProcedures = parseResult.GetValue(skipStoredProceduresOption);

            var handler = host.Services.GetRequiredService<ExtractModelCommandHandler>();
            var options = new ExtractModelCommandHandlerOptions(projectPath, skipTables, skipViews, skipStoredProcedures);
            await handler.HandleAsync(options);
        });

        return extractModelCommand;
    }

    /// <summary>
    /// Handles the extract model command with the specified project path.
    /// </summary>
    /// <param name="commandOptions">The options for the command.</param>
    public override async Task HandleAsync(ExtractModelCommandHandlerOptions commandOptions)
    {
        AssertCommandOptionsValid(commandOptions);

        var projectPath = commandOptions.ProjectPath;

        _logger.LogInformation("{Message} '{ProjectPath}'", _resourceManagerLogMessages.GetString("ExtractingSemanticModel"), projectPath.FullName);

        _project.LoadProjectConfiguration(projectPath);

        // Extract the Semantic Model
        var semanticModel = await _semanticModelProvider.ExtractSemanticModelAsync().ConfigureAwait(false);

        // Save the Semantic Model into the project directory into a subdirectory with the name of the semanticModel.Name
        var semanticModelDirectory = new DirectoryInfo(Path.Combine(projectPath.FullName, semanticModel.Name));

        _logger.LogInformation("{Message} '{ProjectPath}'", _resourceManagerLogMessages.GetString("SavingSemanticModel"), semanticModelDirectory);
        await semanticModel.SaveModelAsync(semanticModelDirectory);

        _logger.LogInformation("{Message} '{ProjectPath}'", _resourceManagerLogMessages.GetString("ExtractSemanticModelComplete"), projectPath.FullName);
    }
}