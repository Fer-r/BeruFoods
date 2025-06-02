import { useState } from 'react';
import { parseArticleCsv, downloadCsvTemplate } from '../../../utils/csvUtils';
import articleService from '../services/articleService';

const ArticleCsvImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [csvFile, setCsvFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importErrors, setImportErrors] = useState([]);

  const handleCsvImport = async () => {
    if (!csvFile) {
      onSuccess('Please select a CSV file to import.', true);
      return;
    }

    setImportLoading(true);
    setImportErrors([]);
    setImportProgress({ current: 0, total: 0 });

    try {
      const fileContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(csvFile);
      });

      const articles = parseArticleCsv(fileContent);
      setImportProgress({ current: 0, total: articles.length });

      const errors = [];
      let successCount = 0;

      for (let i = 0; i < articles.length; i++) {
        try {
          const formData = new FormData();
          formData.append('name', articles[i].name);
          formData.append('description', articles[i].description);
          formData.append('price', articles[i].price);
          formData.append('listed', String(articles[i].listed));
          formData.append('available', String(articles[i].available));
          
          if (articles[i].allergies && articles[i].allergies.length > 0) {
            articles[i].allergies.forEach(allergy => {
              if (allergy && allergy.trim()) {
                formData.append('allergies[]', allergy.trim());
              }
            });
          }

          await articleService.createArticle(formData);
          successCount++;
        } catch (err) {
          console.error(`Failed to create article ${i + 1}:`, err);
          errors.push({
            row: i + 2,
            name: articles[i].name,
            error: err.response?.data?.message || err.message || 'Unknown error'
          });
        }
        
        setImportProgress({ current: i + 1, total: articles.length });
      }

      setImportErrors(errors);
      
      if (successCount > 0) {
        onSuccess(`Successfully imported ${successCount} article(s).${errors.length > 0 ? ` ${errors.length} failed.` : ''}`, false);
      } else {
        onSuccess('No articles were imported due to errors.', true);
      }

      if (errors.length === 0) {
        resetModal();
      }

    } catch (err) {
      console.error('CSV import error:', err);
      onSuccess(err.message || 'Failed to process CSV file.', true);
    }

    setImportLoading(false);
  };

  const resetModal = () => {
    setCsvFile(null);
    setImportErrors([]);
    setImportProgress({ current: 0, total: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Import Articles from CSV</h3>
        
        <div className="bg-base-200 p-4 rounded-lg mb-4">
          <h4 className="font-semibold mb-2">CSV Format Requirements:</h4>
          <ul className="text-sm space-y-1 mb-3">
            <li><strong>Required columns:</strong> name, description, price</li>
            <li><strong>Optional columns:</strong> listed (true/false), available (true/false), allergies (semicolon-separated)</li>
            <li><strong>Example:</strong> name,description,price,listed,available,allergies</li>
          </ul>
          <button 
            onClick={downloadCsvTemplate}
            className="btn btn-xs btn-outline"
          >
            Download Template
          </button>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Select CSV File</span>
          </label>
          <input 
            type="file" 
            accept=".csv"
            onChange={(e) => setCsvFile(e.target.files[0])}
            className="file-input file-input-bordered w-full"
            disabled={importLoading}
          />
        </div>

        {importLoading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Importing articles...</span>
              <span>{importProgress.current} / {importProgress.total}</span>
            </div>
            <progress 
              className="progress progress-primary w-full" 
              value={importProgress.current} 
              max={importProgress.total}
            ></progress>
          </div>
        )}

        {importErrors.length > 0 && (
          <div className="mb-4">
            <h4 className="font-semibold text-error mb-2">Import Errors:</h4>
            <div className="bg-error bg-opacity-10 p-3 rounded max-h-32 overflow-y-auto">
              {importErrors.map((error, index) => (
                <div key={index} className="text-sm mb-1">
                  <strong>Row {error.row} ({error.name}):</strong> {error.error}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-action">
          <button 
            className="btn btn-ghost" 
            onClick={resetModal}
            disabled={importLoading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCsvImport}
            disabled={!csvFile || importLoading}
          >
            {importLoading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Importing...
              </>
            ) : (
              'Import Articles'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticleCsvImportModal; 