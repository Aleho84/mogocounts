class ApiResponse {
    static success(data) {
        return {
            status: 'success',
            data
        };
    }

    static error(message) {
        return {
            status: 'error',
            message
        };
    }
}

module.exports = ApiResponse;
