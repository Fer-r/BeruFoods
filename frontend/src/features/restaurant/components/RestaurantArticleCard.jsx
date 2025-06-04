import { Link } from 'react-router';
import { useState, useEffect } from 'react';
import articleService from '../services/articleService'; // Assuming path to articleService

// TODO: Later, import PATHS from router or a constants file if it's extracted
const PATHS = {
    RESTAURANT_ARTICLES_EDIT: '/restaurant/articles/:articleId/edit',
};

/**
 * RestaurantArticleCard displays a menu item (article) in the restaurant management interface.
 * It shows the article's image, name, description, price, availability status, and allergies.
 * The component provides controls to toggle availability status and buttons to edit or delete the article.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.article - The article data to display
 * @param {number} props.article.id - Unique identifier for the article
 * @param {string} props.article.name - Name of the article
 * @param {string} [props.article.description] - Optional description of the article
 * @param {string|number} props.article.price - Price of the article
 * @param {boolean} props.article.listed - Whether the article is listed on the menu
 * @param {boolean} props.article.available - Whether the article is currently available
 * @param {string} [props.article.imageUrl] - Optional URL to the article's image
 * @param {Array<string>} [props.article.allergies] - Optional array of allergy information
 * @param {Function} props.onDelete - Callback function when the delete button is clicked
 * @returns {JSX.Element} The rendered article card
 */
const RestaurantArticleCard = ({ article, onDelete }) => {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR', // Or use a dynamic currency from restaurant settings
  }).format(article.price);

  const editUrl = PATHS.RESTAURANT_ARTICLES_EDIT.replace(':articleId', article.id);

  const [isAvailable, setIsAvailable] = useState(article.available);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  useEffect(() => {
    setIsAvailable(article.available);
  }, [article.available]);

  const handleToggleAvailability = async () => {
    const previousAvailability = isAvailable;
    const newAvailability = !isAvailable;

    setIsAvailable(newAvailability); // Optimistic update
    setIsUpdating(true);
    setUpdateError(null);

    const payload = new FormData();
    payload.append('available', String(newAvailability));

    try {
      await articleService.updateArticle(article.id, payload);
    } catch (err) {
      console.error("Failed to update article availability:", err.response || err);
      setIsAvailable(previousAvailability);
      setUpdateError(err.response?.data?.message || err.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${article.name}"?`)) {
      onDelete(article.id);
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-6 overflow-hidden">
      <figure className="h-48 w-full overflow-hidden">
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.name} className="object-cover h-full w-full" />
        ) : (
          <div className="h-full w-full bg-base-300 flex items-center justify-center">
            <span className="text-base-content opacity-50">No Image</span>
          </div>
        )}
      </figure>
      <div className="card-body p-4">
        <h2 className="card-title text-lg font-semibold mb-1 truncate" title={article.name}>{article.name}</h2>
        <p className="text-sm text-base-content opacity-80 mb-2 h-10 overflow-hidden text-ellipsis">
          {article.description || 'No description available.'}
        </p>
        <div className="flex justify-between items-center mb-3">
            <p className="text-accent font-semibold text-md">{formattedPrice}</p>
            <div className="space-y-1 text-right">
                <div>
                    <span className={`badge ${article.listed ? 'badge-success' : 'badge-warning'} badge-sm`}>
                        {article.listed ? 'Listed' : 'Unlisted'}
                    </span>
                </div>
                <div className="flex items-center justify-end space-x-2">
                    <span className={`badge ${isAvailable ? 'badge-info' : 'badge-error'} badge-sm`}>
                        {isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                    <input
                      type="checkbox"
                      className={`toggle toggle-xs ${isAvailable ? 'toggle-info' : ''} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                      checked={isAvailable}
                      onChange={handleToggleAvailability}
                      disabled={isUpdating}
                      aria-label="Toggle article availability"
                    />
                </div>
                {updateError && <p className="text-error text-xs mt-1 text-right" role="alert">{updateError}</p>}
            </div>
        </div>

        {/* Allergies display (optional, can be enhanced) */}
        {article.allergies && article.allergies.length > 0 && (
            <div className="mb-2">
                <p className="text-xs font-semibold">Allergies:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                    {article.allergies.map(allergy => (
                        <span key={allergy} className="badge badge-outline badge-xs">{allergy}</span>
                    ))}
                </div>
            </div>
        )}

        <div className="card-actions justify-end mt-2 border-t border-base-300 pt-3">
          <Link to={editUrl} className="btn btn-outline btn-sm btn-secondary">
            Edit
          </Link>
          <button 
            onClick={handleDelete} 
            className="btn btn-outline btn-sm btn-error"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestaurantArticleCard;