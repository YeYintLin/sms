import { Navigate, useLocation } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Protected Route wrapper that checks permissions
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.resource - Resource name to check permission for (e.g., 'students', 'teachers')
 * @param {string} props.permission - Permission type to check ('view', 'create', 'update', 'delete')
 * @param {string} props.redirectTo - Path to redirect to if permission denied
 */
const ProtectedRoute = ({ children, resource, permission = 'view', redirectTo = '/' }) => {
    const { canView, canCreate, canUpdate, canDelete, restrictions } = usePermissions();
    const { isAuthenticated, isAuthChecked } = useAuth();
    const location = useLocation();

    // Check if user is authenticated
    if (!isAuthChecked) {
        return null;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If no resource specified, just check authentication
    if (!resource) {
        return children;
    }

    const blocked = restrictions?.blockedPages || [];
    if (blocked.includes(location.pathname)) {
        return <Navigate to={redirectTo} replace />;
    }

    // Check specific permission
    let hasPermission = false;
    switch (permission) {
        case 'view':
            hasPermission = canView(resource);
            break;
        case 'create':
            hasPermission = canCreate(resource);
            break;
        case 'update':
            hasPermission = canUpdate(resource);
            break;
        case 'delete':
            hasPermission = canDelete(resource);
            break;
        default:
            hasPermission = false;
    }

    // If permission denied, redirect
    if (!hasPermission) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

export default ProtectedRoute;
