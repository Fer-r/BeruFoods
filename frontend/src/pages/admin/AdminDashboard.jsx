import { Link } from 'react-router';
import { ROUTES } from '../../utils/constants';
import { FaUsers, FaStore } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import { fetchDataFromEndpoint } from '../../services/useApiService';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersData, restaurantsData] = await Promise.all([
          fetchDataFromEndpoint('/users?limit=1', 'GET', null, true),
          fetchDataFromEndpoint('/restaurants?limit=1', 'GET', null, true)
        ]);
        
        setStats({
          totalUsers: usersData?.pagination?.totalItems || 0,
          totalRestaurants: restaurantsData?.pagination?.totalItems || 0,
          isLoading: false
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
        <p className="text-lg opacity-70">Manage your BeruFoods platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* User Management Card */}
        <Link to={ROUTES.ADMIN.USERS} className="card bg-base-100 border-2 border-primary shadow-xl hover:shadow-2xl hover:bg-base-200 transition-all">
          <div className="card-body items-center text-center">
            <FaUsers className="text-5xl mb-4 text-primary" />
            <h2 className="card-title text-2xl text-primary">User Management</h2>
            <p className="text-base-content">View, edit, and manage user accounts</p>
            <div className="card-actions justify-end mt-4">
              <div className="badge badge-primary text-primary-content">Manage Users</div>
            </div>
          </div>
        </Link>

        {/* Restaurant Management Card */}
        <Link to={ROUTES.ADMIN.RESTAURANTS} className="card bg-base-100 border-2 border-secondary shadow-xl hover:shadow-2xl hover:bg-base-200 transition-all">
          <div className="card-body items-center text-center">
            <FaStore className="text-5xl mb-4 text-secondary" />
            <h2 className="card-title text-2xl text-secondary">Restaurant Management</h2>
            <p className="text-base-content">Manage restaurants, orders, and articles</p>
            <div className="card-actions justify-end mt-4">
              <div className="badge badge-secondary text-secondary-content">Manage Restaurants</div>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6 text-center">Quick Overview</h2>
        <div className="stats shadow w-full max-w-2xl mx-auto">
          <div className="stat">
            <div className="stat-figure text-primary">
              <FaUsers className="text-3xl" />
            </div>
            <div className="stat-title">Total Users</div>
            <div className="stat-value text-primary">
              {stats.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                stats.totalUsers.toLocaleString()
              )}
            </div>
            <div className="stat-desc">Registered users</div>
          </div>

          <div className="stat">
            <div className="stat-figure text-secondary">
              <FaStore className="text-3xl" />
            </div>
            <div className="stat-title">Total Restaurants</div>
            <div className="stat-value text-secondary">
              {stats.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                stats.totalRestaurants.toLocaleString()
              )}
            </div>
            <div className="stat-desc">Active restaurants</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 