import { useAuth } from '../context/AuthContext.jsx';

/**
 * Custom hook to manage role-based permissions
 * Reads user role from localStorage and provides permission checking functions
 */
export const usePermissions = () => {
    const { role: userRole, userName, restrictions } = useAuth();

    /**
     * Permission rules based on role
     */
    const permissions = {
        admin: {
            students: { view: true, create: true, update: true, delete: true },
            teachers: { view: true, create: true, update: true, delete: true },
            parents: { view: true, create: true, update: true, delete: true },
            classes: { view: true, create: true, update: true, delete: true },
            attendance: { view: true, create: true, update: true, delete: true },
            exams: { view: true, create: true, update: true, delete: true },
            results: { view: true, create: true, update: true, delete: true },
            assignments: { view: true, create: true, update: true, delete: true },
            books: { view: true, create: true, update: true, delete: true },
            files: { view: true, create: true, update: true, delete: true },
            timetable: { view: true, create: true, update: true, delete: true },
            profile: { view: true, update: true },
            dashboard: { view: true },
            calendar: { view: true, create: true, update: true, delete: true },
            adminUsers: { view: true, create: true, update: true, delete: true }
        },
        teacher: {
            students: { view: true, create: false, update: true, delete: false },
            teachers: { view: true, create: false, update: false, delete: false },
            parents: { view: true, create: false, update: false, delete: false },
            classes: { view: true, create: false, update: false, delete: false },
            attendance: { view: true, create: true, update: true, delete: false },
            exams: { view: true, create: true, update: true, delete: false },
            results: { view: true, create: true, update: true, delete: false },
            assignments: { view: true, create: true, update: true, delete: true },
            books: { view: true, create: false, update: false, delete: false },
            files: { view: true, create: true, update: false, delete: true },
            timetable: { view: true, create: false, update: false, delete: false },
            profile: { view: true, update: true },
            dashboard: { view: true },
            calendar: { view: true, create: true, update: true, delete: true }
        },
        student: {
            students: { view: true, create: false, update: false, delete: false },
            teachers: { view: true, create: false, update: false, delete: false },
            parents: { view: false, create: false, update: false, delete: false },
            classes: { view: true, create: false, update: false, delete: false },
            attendance: { view: false, create: false, update: false, delete: false },
            exams: { view: true, create: false, update: false, delete: false },
            results: { view: true, create: false, update: false, delete: false },
            assignments: { view: true, create: false, update: false, delete: false },
            books: { view: true, create: false, update: false, delete: false },
            files: { view: true, create: false, update: false, delete: false },
            timetable: { view: true, create: false, update: false, delete: false },
            profile: { view: true, update: true },
            dashboard: { view: true },
            calendar: { view: true, create: false, update: false, delete: false }
        },
        parent: {
            students: { view: true, create: false, update: false, delete: false },
            teachers: { view: true, create: false, update: false, delete: false },
            parents: { view: false, create: false, update: false, delete: false },
            classes: { view: true, create: false, update: false, delete: false },
            attendance: { view: false, create: false, update: false, delete: false },
            exams: { view: true, create: false, update: false, delete: false },
            results: { view: true, create: false, update: false, delete: false },
            assignments: { view: true, create: false, update: false, delete: false },
            books: { view: true, create: false, update: false, delete: false },
            files: { view: true, create: false, update: false, delete: false },
            timetable: { view: true, create: false, update: false, delete: false },
            profile: { view: true, update: true },
            dashboard: { view: true },
            calendar: { view: true, create: false, update: false, delete: false }
        }
    };

    /**
     * Check if user can view a resource
     */
    const canView = (resource) => {
        if (!userRole || !permissions[userRole]) return false;
        const base = permissions[userRole][resource]?.view || false;
        const override = restrictions?.permissionsOverride?.[resource]?.view;
        return typeof override === 'boolean' ? override : base;
    };

    /**
     * Check if user can create a resource
     */
    const canCreate = (resource) => {
        if (!userRole || !permissions[userRole]) return false;
        const base = permissions[userRole][resource]?.create || false;
        const override = restrictions?.permissionsOverride?.[resource]?.create;
        return typeof override === 'boolean' ? override : base;
    };

    /**
     * Check if user can update a resource
     */
    const canUpdate = (resource) => {
        if (!userRole || !permissions[userRole]) return false;
        const base = permissions[userRole][resource]?.update || false;
        const override = restrictions?.permissionsOverride?.[resource]?.update;
        return typeof override === 'boolean' ? override : base;
    };

    /**
     * Check if user can delete a resource
     */
    const canDelete = (resource) => {
        if (!userRole || !permissions[userRole]) return false;
        const base = permissions[userRole][resource]?.delete || false;
        const override = restrictions?.permissionsOverride?.[resource]?.delete;
        return typeof override === 'boolean' ? override : base;
    };

    return {
        userRole,
        userName,
        restrictions,
        canView,
        canCreate,
        canUpdate,
        canDelete
    };
};
