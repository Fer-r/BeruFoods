import { useState, useEffect, useCallback } from 'react';
import { fetchDataFromEndpoint, putToAPI } from '../../services/useApiService';

// Modal component using DaisyUI
const Modal = ({ isOpen, onClose, title, children }) => {
  return (
    <dialog className={`modal ${isOpen ? 'modal-open' : ''}`}>
      <div className="modal-box w-full max-w-3xl max-h-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const AdminRestaurantManagementPage = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // General page errors or restaurant edit errors
  const [modalError, setModalError] = useState(null); // Specific errors for modals
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  // Restaurant Edit Modal
  const [isEditRestaurantModalOpen, setIsEditRestaurantModalOpen] = useState(false);
  const [currentRestaurant, setCurrentRestaurant] = useState(null);
  const [editRestaurantFormData, setEditRestaurantFormData] = useState({ 
    name: '', 
    address: {
      address_line: '',
      city: '',
      lat: '',
      lng: ''
    }, 
    phone: ''
  });

  // Order Edit Modal
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [editOrderFormData, setEditOrderFormData] = useState({ status: '' /* Add other editable order fields if any */ });

  // Article Edit Modal
  const [isEditArticleModalOpen, setIsEditArticleModalOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState(null);
  const [editArticleFormData, setEditArticleFormData] = useState({ name: '', price: '', description: '' });

  // Selected restaurant details (orders and articles)
  const [selectedRestaurantDetails, setSelectedRestaurantDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState(null);

  const fetchRestaurants = useCallback(async (page = 1) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDataFromEndpoint(`/restaurants?page=${page}&limit=${pagination.itemsPerPage}`, 'GET', null, true);
      // Backend returns paginated data: {items: [...], pagination: {...}}
      setRestaurants(data?.items || []);
      if (data?.pagination) {
        setPagination(prev => ({
          ...prev,
          currentPage: data.pagination.currentPage || page,
          totalPages: data.pagination.totalPages || 1,
          totalItems: data.pagination.totalItems || 0
        }));
      }
    } catch (err) {
      setError(err.message);
      setRestaurants([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.itemsPerPage]);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // Restaurant Edit Handlers
  const handleOpenEditRestaurantModal = (restaurant) => {
    setCurrentRestaurant(restaurant);
    setEditRestaurantFormData({
      name: restaurant.name,
      address: {
        address_line: restaurant.address?.address_line || '',
        city: restaurant.address?.city || '',
        lat: restaurant.address?.lat || '',
        lng: restaurant.address?.lng || ''
      },
      phone: restaurant.phone || '',
    });
    setModalError(null);
    setIsEditRestaurantModalOpen(true);
  };

  const handleCloseEditRestaurantModal = () => {
    setIsEditRestaurantModalOpen(false);
    setCurrentRestaurant(null);
  };

  const handleEditRestaurantFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setEditRestaurantFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setEditRestaurantFormData({ ...editRestaurantFormData, [name]: value });
    }
  };

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!currentRestaurant) return;
    const updatedData = { ...currentRestaurant, ...editRestaurantFormData };
    try {
      setModalError(null);
      await putToAPI(`/restaurants/${currentRestaurant.id}`, updatedData);
      handleCloseEditRestaurantModal();
      fetchRestaurants(pagination.currentPage);
    } catch (err) {
      setModalError(err.message);
    }
  };

  // Toggle Restaurant Ban Handler
  const handleToggleRestaurantBan = async (restaurant) => {
    const action = restaurant.banned ? 'unban' : 'ban';
    const confirmMessage = restaurant.banned 
      ? 'Are you sure you want to unban this restaurant?' 
      : 'Are you sure you want to ban this restaurant?';
    
    if (window.confirm(confirmMessage)) {
      try {
        // Use the ban/unban endpoints
        await fetchDataFromEndpoint(`/restaurants/${restaurant.id}/${action}`, 'PATCH', null, true);
        fetchRestaurants(pagination.currentPage);
        if (selectedRestaurantDetails && selectedRestaurantDetails.id === restaurant.id) {
          setSelectedRestaurantDetails(null);
        }
      } catch (err) {
        setError(err.message); // Show this as a general page error
        alert(`Failed to ${action} restaurant: ${err.message}`);
      }
    }
  };

  const handlePageChange = (page) => {
    fetchRestaurants(page);
  };

  // Fetch Restaurant Details (Orders & Articles)
  const fetchRestaurantDetails = useCallback(async (restaurantId, restaurantName) => {
    setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const [ordersData, articlesData] = await Promise.all([
        fetchDataFromEndpoint(`/orders?restaurantId=${restaurantId}`, 'GET', null, true),
        fetchDataFromEndpoint(`/articles?restaurantId=${restaurantId}`, 'GET', null, true)
      ]);
      setSelectedRestaurantDetails({
        id: restaurantId,
        name: restaurantName,
        // Backend returns paginated data: {items: [...], pagination: {...}}
        orders: ordersData?.items || [],
        articles: articlesData?.items || [],
      });
    } catch (err) {
      setDetailsError(err.message);
      // Keep stale data or clear? Clearing might be abrupt.
      // setSelectedRestaurantDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const handleViewDetails = (restaurant) => {
    if (selectedRestaurantDetails && selectedRestaurantDetails.id === restaurant.id) {
      setSelectedRestaurantDetails(null); // Toggle off
    } else {
      fetchRestaurantDetails(restaurant.id, restaurant.name);
    }
  };

  // Order Edit Handlers
  const handleOpenEditOrderModal = (order) => {
    setCurrentOrder(order);
    setEditOrderFormData({ status: order.status }); // Assuming only status is editable for now
    setModalError(null);
    setIsEditOrderModalOpen(true);
  };
  const handleCloseEditOrderModal = () => setIsEditOrderModalOpen(false);
  const handleEditOrderFormChange = (e) => setEditOrderFormData({ ...editOrderFormData, [e.target.name]: e.target.value });
  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!currentOrder || !selectedRestaurantDetails) return;
    const updatedData = { ...currentOrder, ...editOrderFormData };
    try {
      setModalError(null);
      await putToAPI(`/orders/${currentOrder.id}`, updatedData);
      handleCloseEditOrderModal();
      // Refresh details for the current restaurant
      fetchRestaurantDetails(selectedRestaurantDetails.id, selectedRestaurantDetails.name);
    } catch (err) {
      setModalError(err.message);
    }
  };

  // Article Edit Handlers
  const handleOpenEditArticleModal = (article) => {
    setCurrentArticle(article);
    setEditArticleFormData({ name: article.name, price: article.price, description: article.description || '' });
    setModalError(null);
    setIsEditArticleModalOpen(true);
  };
  const handleCloseEditArticleModal = () => setIsEditArticleModalOpen(false);
  const handleEditArticleFormChange = (e) => {
    const { name, value } = e.target;
    setEditArticleFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };
  const handleUpdateArticle = async (e) => {
    e.preventDefault();
    if (!currentArticle || !selectedRestaurantDetails) return;
    const updatedData = { ...currentArticle, ...editArticleFormData };
    try {
      setModalError(null);
      await putToAPI(`/articles/${currentArticle.id}`, updatedData);
      handleCloseEditArticleModal();
      fetchRestaurantDetails(selectedRestaurantDetails.id, selectedRestaurantDetails.name);
    } catch (err) {
      setModalError(err.message);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      try {
        await fetchDataFromEndpoint(`/articles/${articleId}`, 'DELETE', null, true);
        // Refresh details for the current restaurant
        if (selectedRestaurantDetails) {
          fetchRestaurantDetails(selectedRestaurantDetails.id, selectedRestaurantDetails.name);
        }
      } catch (err) {
        setError(err.message);
        alert(`Failed to delete article: ${err.message}`);
      }
    }
  };

  // Main component render
  if (isLoading) return <div className="container mx-auto p-4 text-center"><span className="loading loading-spinner loading-lg"></span><p>Loading restaurants...</p></div>;
  if (error && !isEditRestaurantModalOpen && !isEditOrderModalOpen && !isEditArticleModalOpen) {
    return <div className="container mx-auto p-4 text-center"><div className="alert alert-error"><span>Error: {error}</span></div></div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Restaurant Management</h1>
      {restaurants.length > 0 ? (
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {restaurants.map((restaurant) => (
                    <tr key={restaurant.id} className={`${selectedRestaurantDetails?.id === restaurant.id ? 'bg-primary/10' : ''} ${restaurant.banned ? 'opacity-60 bg-error/10' : ''}`}>
                      <td className="font-bold">{restaurant.id}</td>
                      <td>{restaurant.name}</td>
                      <td>
                        {restaurant.address && typeof restaurant.address === 'object' 
                          ? restaurant.address.address_line || 'N/A'
                          : restaurant.address || 'N/A'
                        }
                      </td>
                      <td>
                        {restaurant.banned ? (
                          <div className="badge badge-error">Banned</div>
                        ) : (
                          <div className="badge badge-success">Active</div>
                        )}
                      </td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button 
                            onClick={() => handleViewDetails(restaurant)} 
                            className={`btn btn-sm ${selectedRestaurantDetails?.id === restaurant.id ? 'btn-warning' : 'btn-info'}`}
                          >
                            {selectedRestaurantDetails?.id === restaurant.id ? 'Hide Details' : 'View Details'}
                          </button>
                          <button 
                            onClick={() => handleOpenEditRestaurantModal(restaurant)} 
                            className="btn btn-primary btn-sm"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleToggleRestaurantBan(restaurant)} 
                            className={`btn btn-sm ${restaurant.banned ? 'btn-success' : 'btn-error'}`}
                          >
                            {restaurant.banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        !isLoading && <div className="text-center"><div className="alert alert-info"><span>No restaurants found.</span></div></div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="join">
            <button 
              className={`join-item btn ${pagination.currentPage === 1 ? 'btn-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              «
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`join-item btn ${pagination.currentPage === page ? 'btn-active' : ''}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            
            <button 
              className={`join-item btn ${pagination.currentPage === pagination.totalPages ? 'btn-disabled' : ''}`}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      {/* Pagination Info */}
      {pagination.totalItems > 0 && (
        <div className="text-center mt-2 text-sm opacity-70">
          Showing {restaurants.length} of {pagination.totalItems} restaurants
        </div>
      )}

      {/* Restaurant Details Section */}
      {selectedRestaurantDetails && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-6">Details for: {selectedRestaurantDetails.name} (ID: {selectedRestaurantDetails.id})</h2>
            {isLoadingDetails && (
              <div className="text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p>Loading details...</p>
              </div>
            )}
            {detailsError && (
              <div className="alert alert-error">
                <span>Error loading details: {detailsError}</span>
              </div>
            )}
            {!isLoadingDetails && !detailsError && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Orders Display */}
                <div className="card bg-base-200 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Orders ({selectedRestaurantDetails.orders.length})</h3>
                    {selectedRestaurantDetails.orders.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedRestaurantDetails.orders.map(order => (
                          <div key={order.id} className="card bg-base-100 shadow-sm">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">Order #{order.id}</p>
                                  <div className="badge badge-outline badge-sm">{order.status}</div>
                                  <p className="text-sm opacity-70">Total: {(typeof order.totalPrice === 'number' ? order.totalPrice : parseFloat(order.totalPrice) || 0).toFixed(2)} €</p>
                                </div>
                                <button 
                                  onClick={() => handleOpenEditOrderModal(order)} 
                                  className="btn btn-success btn-sm"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <span>No orders found.</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Articles Display */}
                <div className="card bg-base-200 shadow">
                  <div className="card-body">
                    <h3 className="card-title text-lg mb-4">Articles ({selectedRestaurantDetails.articles.length})</h3>
                    {selectedRestaurantDetails.articles.length > 0 ? (
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {selectedRestaurantDetails.articles.map(article => (
                          <div key={article.id} className="card bg-base-100 shadow-sm">
                            <div className="card-body p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">{article.name}</p>
                                  <p className="text-sm font-medium">{(typeof article.price === 'number' ? article.price : parseFloat(article.price) || 0).toFixed(2)} €</p>
                                  {article.description && (
                                    <p className="text-xs opacity-70 mt-1">{article.description}</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleOpenEditArticleModal(article)} 
                                    className="btn btn-success btn-sm"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteArticle(article.id)} 
                                    className="btn btn-error btn-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <span>No articles found.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Restaurant Modal */}
      <Modal isOpen={isEditRestaurantModalOpen} onClose={handleCloseEditRestaurantModal} title="Edit Restaurant">
        <form onSubmit={handleUpdateRestaurant} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input 
              type="text" 
              name="name" 
              value={editRestaurantFormData.name} 
              onChange={handleEditRestaurantFormChange} 
              className="input input-bordered w-full" 
              placeholder="Restaurant name"
              required 
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Address Line</span>
            </label>
            <input 
              type="text" 
              name="address.address_line" 
              value={editRestaurantFormData.address.address_line} 
              onChange={handleEditRestaurantFormChange} 
              className="input input-bordered w-full" 
              placeholder="Restaurant address"
              required 
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">City</span>
            </label>
            <input 
              type="text" 
              name="address.city" 
              value={editRestaurantFormData.address.city} 
              onChange={handleEditRestaurantFormChange} 
              className="input input-bordered w-full" 
              placeholder="City"
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Latitude</span>
              </label>
              <input 
                type="number" 
                name="address.lat" 
                value={editRestaurantFormData.address.lat} 
                onChange={handleEditRestaurantFormChange} 
                className="input input-bordered w-full" 
                placeholder="Latitude"
                step="any"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Longitude</span>
              </label>
              <input 
                type="number" 
                name="address.lng" 
                value={editRestaurantFormData.address.lng} 
                onChange={handleEditRestaurantFormChange} 
                className="input input-bordered w-full" 
                placeholder="Longitude"
                step="any"
              />
            </div>
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone</span>
            </label>
            <input 
              type="tel" 
              name="phone" 
              value={editRestaurantFormData.phone} 
              onChange={handleEditRestaurantFormChange} 
              className="input input-bordered w-full" 
              placeholder="Phone number"
            />
          </div>

          {modalError && (
            <div className="alert alert-error">
              <span>{modalError}</span>
            </div>
          )}
          <div className="modal-action">
            <button type="button" onClick={handleCloseEditRestaurantModal} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal isOpen={isEditOrderModalOpen} onClose={handleCloseEditOrderModal} title="Edit Order">
        <form onSubmit={handleUpdateOrder} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select 
              name="status" 
              value={editOrderFormData.status} 
              onChange={handleEditOrderFormChange} 
              className="select select-bordered w-full"
              required
            >
              <option value="pending">Pending</option>
              <option value="preparing">Preparing</option>
              <option value="ready">Ready</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          {modalError && (
            <div className="alert alert-error">
              <span>{modalError}</span>
            </div>
          )}
          <div className="modal-action">
            <button type="button" onClick={handleCloseEditOrderModal} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Update Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Article Modal */}
      <Modal isOpen={isEditArticleModalOpen} onClose={handleCloseEditArticleModal} title="Edit Article">
        <form onSubmit={handleUpdateArticle} className="space-y-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Name</span>
            </label>
            <input 
              type="text" 
              name="name" 
              value={editArticleFormData.name} 
              onChange={handleEditArticleFormChange} 
              className="input input-bordered w-full" 
              placeholder="Article name"
              required 
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Price (€)</span>
            </label>
            <input 
              type="number" 
              name="price" 
              value={editArticleFormData.price} 
              onChange={handleEditArticleFormChange} 
              className="input input-bordered w-full" 
              placeholder="0.00"
              step="0.01" 
              required 
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
              <span className="label-text-alt">Optional</span>
            </label>
            <textarea 
              name="description" 
              value={editArticleFormData.description} 
              onChange={handleEditArticleFormChange} 
              className="textarea textarea-bordered w-full" 
              placeholder="Article description..."
              rows="3"
            />
          </div>
          {modalError && (
            <div className="alert alert-error">
              <span>{modalError}</span>
            </div>
          )}
          <div className="modal-action">
            <button type="button" onClick={handleCloseEditArticleModal} className="btn btn-ghost">
              Cancel
            </button>
            <button type="submit" className="btn btn-success">
              Update Article
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default AdminRestaurantManagementPage;
