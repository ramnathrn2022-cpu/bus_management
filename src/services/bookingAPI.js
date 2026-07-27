import apiClient from './apiClient';

/**
 * Booking / Ticket API services
 */
export const bookingAPI = {
  /**
   * Book a new ticket (User only)
   * @param {object} bookingData { user_id, bus_id, seat_number }
   */
  bookTicket: async (bookingData) => {
    const response = await apiClient.post('/book-ticket', bookingData);
    return response.data;
  },

  /**
   * Get tickets booked by the current logged-in user (User only)
   */
  getMyTickets: async () => {
    const response = await apiClient.get('/my-tickets');
    return response.data;
  },

  /**
   * Get all tickets in the system (Owner/Manager only)
   */
  getAllTickets: async () => {
    const response = await apiClient.get('/tickets');
    return response.data;
  },

  /**
   * Get details of a single ticket
   * @param {number} ticketId
   */
  getTicketById: async (ticketId) => {
    const response = await apiClient.get(`/ticket/${ticketId}`);
    return response.data;
  },

  /**
   * Cancel a booking / ticket (User only)
   * @param {number} ticketId
   */
  cancelTicket: async (ticketId) => {
    const response = await apiClient.delete(`/ticket/${ticketId}`);
    return response.data;
  },

  /**
   * Get total booking count in the system (Owner/Manager only)
   */
  getTotalBookings: async () => {
    const response = await apiClient.get('/total-bookings');
    return response.data;
  }
};

export default bookingAPI;
