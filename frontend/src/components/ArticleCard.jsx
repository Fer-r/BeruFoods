const ArticleCard = ({ article }) => {
  if (!article) return null;

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
      </div>
    </div>
  );
};

export default ArticleCard; 