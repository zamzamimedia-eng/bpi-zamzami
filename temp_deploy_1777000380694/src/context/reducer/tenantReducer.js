export const tenantInitialState = {
    activeTenantId: 1, // Default to first tenant
};

const tenantReducer = (state, action) => {
    switch (action.type) {
        case 'set_active_tenant':
            return {
                ...state,
                activeTenantId: action.tenantId,
            };
        default:
            return state;
    }
}

export default tenantReducer;
