import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useModal } from '../../../context/ModalContext';
import { useNavigate } from 'react-router';

/**
 * ArticleCard displays a menu item (article) from a restaurant.
 * It shows the article's image, name, description, price, and allergies.
 * For authenticated users, it provides an "Add to Cart" button.
 * For unauthenticated users, clicking "Add to Cart" will redirect to the login modal.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.article - The article data to display
 * @param {string} props.article.name - Name of the article
 * @param {string} [props.article.description] - Optional description of the article
 * @param {string|number} props.article.price - Price of the article
 * @param {string} [props.article.imageUrl] - Optional URL to the article's image
 * @param {boolean} props.article.available - Whether the article is currently available
 * @param {Array<string>} [props.article.allergies] - Optional array of allergy information
 * @param {number} props.restaurantId - ID of the restaurant this article belongs to
 * @returns {JSX.Element|null} The rendered article card or null if article is invalid
 */
const ArticleCard = ({ article, restaurantId }) => {
  const { isAuthenticated, isUser } = useAuth();
  const { addToCart } = useCart();
  const { openLoginModal } = useModal();
  const navigate = useNavigate();

  if (!article) return null;

  const handleAddToCart = () => {
    if (isAuthenticated() && isUser) {
      // Ensure restaurantId is part of the article object for cart context logic
      addToCart({ ...article, restaurantId }); 
    } else {
      navigate('/');
      openLoginModal();
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row relative overflow-hidden">
      {/* Add gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-base-100/30 to-base-200/30 pointer-events-none"></div>
      
      {article.imageUrl && (
        <div className="w-full sm:w-32 h-32 flex-shrink-0 mr-0 sm:mr-4 mb-4 sm:mb-0 relative overflow-hidden rounded-md">
          <img 
            src={article.imageUrl}
            alt={article.name} 
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" 
          />
        </div>
      )}
      
      <div className="flex-1 z-10">
        <h3 className="text-xl font-semibold mb-1">{article.name}</h3>
        {article.description && (
          <p className="text-base-content/80 mb-2 text-sm">{article.description}</p>
        )}
        <p className="text-lg font-bold text-primary mb-2">{parseFloat(article.price).toFixed(2)}€</p>
        
        {article.allergies && article.allergies.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-base-content/70">Allergies:</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {article.allergies.map((allergy, index) => (
                <span key={index} className="badge badge-outline badge-sm">{allergy}</span>
              ))}
            </div>
          </div>
        )}

        {!article.available && (
          <span className="text-sm text-error font-semibold mt-1 block">Not Available</span>
        )}

        {article.available && isUser && (
          <button 
            onClick={handleAddToCart} 
            className="btn btn-sm btn-primary mt-2 relative overflow-hidden"
          >
            Add to Cart
          </button>
        )}
         {article.available && !isAuthenticated() && (
          <button 
            onClick={handleAddToCart} 
            className="btn btn-sm btn-primary mt-2 relative overflow-hidden"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleCard;