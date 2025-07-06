using System.IO;
using System.Threading.Tasks;
using GenAIDBExplorer.Core.Models.SemanticModel;

namespace GenAIDBExplorer.Core.Repository
{
    /// <summary>
    /// Defines persistence operations for semantic models.
    /// </summary>
    public interface ISemanticModelPersistenceStrategy
    {
        /// <summary>
        /// Saves the semantic model to the specified path.
        /// </summary>
        Task SaveModelAsync(SemanticModel semanticModel, DirectoryInfo modelPath);

        /// <summary>
        /// Loads the semantic model from the specified path.
        /// </summary>
        Task<SemanticModel> LoadModelAsync(DirectoryInfo modelPath);

        /// <summary>
        /// Checks if a semantic model exists at the specified path.
        /// </summary>
        /// <param name="modelPath">The path where the model should be located.</param>
        /// <returns>True if the model exists; otherwise, false.</returns>
        Task<bool> ExistsAsync(DirectoryInfo modelPath);

        /// <summary>
        /// Lists all available semantic models in the specified root directory.
        /// </summary>
        /// <param name="rootPath">The root directory to search for models.</param>
        /// <returns>An enumerable of model names found in the root directory.</returns>
        Task<IEnumerable<string>> ListModelsAsync(DirectoryInfo rootPath);

        /// <summary>
        /// Deletes a semantic model from the specified path.
        /// </summary>
        /// <param name="modelPath">The path where the model is located.</param>
        /// <returns>A task representing the asynchronous delete operation.</returns>
        Task DeleteModelAsync(DirectoryInfo modelPath);
    }
}
