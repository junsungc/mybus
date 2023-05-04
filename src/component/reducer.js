const initialState = {
    busLocation: [],
    location: null,
    map: null,
};

const reducer = (state = initialState, action) => {
    switch (action.type) {
        case 'SETBUSLOCATION':
            return {
                ...state,
                busLocation: action.busLocation
            };
        case 'SETLOCATION':
            return {
                ...state,
                location: action.location
            };
        case 'SETMAP':
            return {
                ...state,
                map: action.map
            };
        default:
            return state;
    }
}

export default reducer;