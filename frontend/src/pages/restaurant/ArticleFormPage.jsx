import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../../context/AuthContext.jsx';
import articleService from '../../features/restaurant/services/articleService'; // Using actual service
import LoadingFallback from '../../components/common/LoadingFallback';

// TODO: Later, import PATHS from router or a constants file if it's extracted
const PATHS = {
    RESTAURANT_MANAGE_ARTICLES: '/restaurant/articles',
};

const ArticleFormPage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { entity: user } = useAuth();
  const isEditMode = Boolean(articleId);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    listed: true,
    available: true,
    allergies: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentAllergy, setCurrentAllergy] = useState('');
  const [loading, setLoading] = useState(false); // For form submission
  const [pageLoading, setPageLoading] = useState(isEditMode); // For initial data load in edit mode
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('[ArticleFormPage] Received articleId:', articleId); // Log received ID
    if (isEditMode && articleId) {
      setPageLoading(true);
      articleService.getArticleById(articleId)
        .then(response => {
          console.log('[ArticleFormPage] API response.data:', response.data); // Log API response
          const article = response;
          if (article && Object.keys(article).length > 0) { // Modified check
            setFormData({
              name: article.name || '',
              description: article.description || '',
              price: article.price || '',
              listed: article.listed !== undefined ? article.listed : true,
              available: article.available !== undefined ? article.available : true,
              allergies: article.allergies || [],
            });
            if (article.imageUrl) { // Assuming the backend provides imageUrl
              setImagePreview(article.imageUrl);
            }
          } else {
            console.error('[ArticleFormPage] Article data is falsy or empty after API call. Response was:', response);
            setError('Article not found. The data received from the server was empty or invalid.'); // More descriptive error
          }
        })
        .catch(err => {
            console.error("[ArticleFormPage] Failed to load article data:", err.response || err);
            setError(err.response?.data?.message || err.message || 'Failed to load article data.');
        })
        .finally(() => setPageLoading(false));
    } else if (!isEditMode) {
        // This case is for create mode, no articleId is expected.
        setPageLoading(false);
    } else if (isEditMode && !articleId) { // Explicitly handle missing articleId in edit mode
        console.error('[ArticleFormPage] In edit mode but articleId is missing.');
        setError('Article ID is missing. Cannot load article details.');
        setPageLoading(false);
    }
  }, [articleId, isEditMode]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddAllergy = () => {
    if (currentAllergy.trim() && !formData.allergies.includes(currentAllergy.trim())) {
      setFormData(prev => ({ ...prev, allergies: [...prev.allergies, currentAllergy.trim()] }));
      setCurrentAllergy('');
    }
  };

  const handleRemoveAllergy = (allergyToRemove) => {
    setFormData(prev => ({ ...prev, allergies: prev.allergies.filter(allergy => allergy !== allergyToRemove) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
        setError("You must be logged in to perform this action.");
        return;
    }
    setLoading(true);
    setError(null);

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('description', formData.description);
    payload.append('price', formData.price);
    payload.append('listed', String(formData.listed)); // Ensure boolean is sent as string for FormData
    payload.append('available', String(formData.available)); // Ensure boolean is sent as string for FormData
    
    if (formData.allergies && formData.allergies.length > 0) {
        formData.allergies.forEach(allergy => payload.append('allergies[]', allergy));
    } else {
        payload.append('allergies', JSON.stringify([])); // Send empty array if no allergies
    }

    if (imageFile) {
      payload.append('imageFile', imageFile);
    } else if (isEditMode && !imagePreview) {
        // If in edit mode and imagePreview is null (meaning image was removed), 
        // we might need a way to signal the backend to remove the image.
        // This often involves sending a specific field like `removeImage: true` or `imageFilename: null`
        // For now, we assume if no imageFile is sent, the backend keeps the existing one unless explicitly told to remove.
        // The backend logic currently keeps imageFilename if no new image is uploaded.
    }

    try {
      if (isEditMode) {
        await articleService.updateArticle(articleId, payload);
      } else {
        await articleService.createArticle(payload);
      }
      // alert(`Article ${isEditMode ? 'updated' : 'created'} successfully!`); // Using a more subtle notification is better UX
      navigate(PATHS.RESTAURANT_MANAGE_ARTICLES, { state: { message: `Article successfully ${isEditMode ? 'updated' : 'created'}!` } });
    } catch (err) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} article:`, err.response || err);
      const errorData = err.response?.data;
      if (errorData && errorData.errors) { // Handle validation errors from Symfony
        const messages = Object.values(errorData.errors).flat().join(' ');
        setError(messages || `Failed to ${isEditMode ? 'update' : 'create'} article. Please check your input.`);
      } else {
        setError(errorData?.message || err.message || `An unexpected error occurred while ${isEditMode ? 'updating' : 'creating'} the article.`);
      }
    }
    setLoading(false);
  };

  if (pageLoading) return <LoadingFallback message={isEditMode ? 'Loading article details...' : 'Preparing form...'} />;
  // In edit mode, we show form even if initial load error, with error message above.
  // In create mode, if there's an error that's not pageLoading related (shouldn't happen often), show it.
  if (error && !pageLoading && !isEditMode) return (
    <div className="container mx-auto px-4 py-8 max-w-2xl text-center">
        <p className="text-error py-10">Error: {error}</p>
        <button onClick={() => navigate(PATHS.RESTAURANT_MANAGE_ARTICLES)} className="btn btn-primary">
            Back to Manage Articles
        </button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-base-content mb-6 text-center">
        {isEditMode ? 'Edit Article' : 'Create New Article'}
      </h1>
      {error && <p className="alert alert-error shadow-lg mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-6 bg-base-200 p-6 md:p-8 rounded-lg shadow-xl">
        <div>
          <label htmlFor="name" className="label">
            <span className="label-text text-base-content font-medium">Article Name</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="input input-bordered w-full focus:input-primary"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="label">
            <span className="label-text text-base-content font-medium">Description</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="textarea textarea-bordered w-full h-32 focus:textarea-primary"
          />
        </div>

        <div>
          <label htmlFor="price" className="label">
            <span className="label-text text-base-content font-medium">Price (USD)</span>
          </label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            className="input input-bordered w-full appearance-none focus:input-primary"
            min="0.01"
            step="0.01"
            required
          />
        </div>

        <div className="form-control">
          <label htmlFor="imageFile" className="label">
            <span className="label-text text-base-content font-medium">Article Image</span>
            {isEditMode && formData.imageUrl && !imagePreview && <span className="label-text-alt text-xs">(Current image will be kept)</span>}
            {isEditMode && imagePreview && imagePreview.startsWith('blob:') && <span className="label-text-alt text-xs">(New image selected)</span>}

          </label>
          <input 
            type="file" 
            id="imageFile"
            name="imageFile"
            onChange={handleImageChange} 
            className="file-input file-input-bordered file-input-primary w-full text-sm"
            accept="image/png, image/jpeg, image/webp"
          />
          {imagePreview && (
            <div className="mt-4 border border-base-300 p-2 rounded-md bg-base-100">
              <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-64 object-contain rounded" />
             {isEditMode && <button type="button" onClick={() => {setImagePreview(null); setImageFile(null);}} className="btn btn-xs btn-error mt-2">Remove Image</button>}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control p-4 bg-base-100 rounded-lg">
              <label className="label cursor-pointer justify-between">
                <span className="label-text text-base-content font-medium">Listed</span>
                <input 
                  type="checkbox" 
                  name="listed"
                  checked={formData.listed}
                  onChange={handleInputChange}
                  className="toggle toggle-success"
                />
              </label>
              <p className="text-xs text-base-content opacity-70 mt-1">Controls if the article is visible to customers on the menu.</p>
            </div>

            <div className="form-control p-4 bg-base-100 rounded-lg">
              <label className="label cursor-pointer justify-between">
                <span className="label-text text-base-content font-medium">Available</span>
                <input 
                  type="checkbox" 
                  name="available"
                  checked={formData.available}
                  onChange={handleInputChange}
                  className="toggle toggle-info"
                />
              </label>
              <p className="text-xs text-base-content opacity-70 mt-1">Controls if the article can be ordered (e.g., in stock).</p>
            </div>
        </div>

        <div>
          <label htmlFor="allergies" className="label">
            <span className="label-text text-base-content font-medium">Allergies</span>
          </label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={currentAllergy}
              onChange={(e) => setCurrentAllergy(e.target.value)}
              onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAllergy(); } }}
              className="input input-bordered flex-grow focus:input-primary"
              placeholder="e.g., gluten, nuts, dairy..."
            />
            <button type="button" onClick={handleAddAllergy} className="btn btn-outline btn-primary">
              Add
            </button>
          </div>
          {formData.allergies.length > 0 && (
            <div className="p-3 border border-base-300 rounded-md bg-base-100 flex flex-wrap gap-2">
              {formData.allergies.map(allergy => (
                <span key={allergy} className="badge badge-lg badge-outline font-medium pl-2 pr-1">
                  {allergy}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveAllergy(allergy)} 
                    className="ml-1.5 text-error hover:text-red-700 text-lg leading-none align-middle"
                    aria-label={`Remove ${allergy}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 mt-4 border-t border-base-300">
            <button 
                type="button" 
                onClick={() => navigate(PATHS.RESTAURANT_MANAGE_ARTICLES)} 
                className="btn btn-ghost w-full sm:w-auto"
                disabled={loading}
            >
                Cancel
            </button>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={loading || !user || pageLoading}>
                {loading ? <span className="loading loading-spinner"></span> : (isEditMode ? 'Save Changes' : 'Create Article')}
            </button>
        </div>
        {(!user && !pageLoading) && <p className="text-error text-sm text-right mt-2">You must be logged in to manage articles.</p>}
      </form>
    </div>
  );
};

export default ArticleFormPage; 