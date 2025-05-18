import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useModal } from '../context/ModalContext';
import { useNavigate } from 'react-router';

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
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row">
      {article.imageUrl && (
        <img 
          src={article.imageUrl} // Assuming imageUrl is the full URL or API_BASE_URL is prepended where it's used
          alt={article.name} 
          className="w-full sm:w-32 h-32 object-cover rounded-md mr-0 sm:mr-4 mb-4 sm:mb-0 flex-shrink-0" 
        />
      )}
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-1">{article.name}</h3>
        {article.description && (
          <p className="text-gray-700 mb-2 text-sm">{article.description}</p>
        )}
        <p className="text-lg font-bold text-green-600 mb-2">€{parseFloat(article.price).toFixed(2)}</p>
        
        {article.allergies && article.allergies.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-gray-600">Allergies:</h4>
            <ul className="list-disc list-inside pl-1">
              {article.allergies.map((allergy, index) => (
                <li key={index} className="text-xs text-gray-500">{allergy}</li>
              ))}
            </ul>
          </div>
        )}

        {!article.available && (
          <span className="text-sm text-red-500 font-semibold mt-1 block">Not Available</span>
        )}

        {article.available && isUser && (
          <button 
            onClick={handleAddToCart} 
            className="btn btn-sm btn-primary mt-2"
          >
            Add to Cart
          </button>
        )}
         {article.available && !isAuthenticated() && (
          <button 
            onClick={handleAddToCart} 
            className="btn btn-sm btn-primary mt-2"
          >
            Add to Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleCard; 