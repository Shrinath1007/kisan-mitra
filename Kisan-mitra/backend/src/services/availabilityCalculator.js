const Vacancy = require("../models/Vacancy");

class AvailabilityCalculator {
  /**
   * Calculate availability for a labour user on a specific date
   * @param {string} labourId - The labour user's ID
   * @param {Date} targetDate - The date to check availability for (defaults to today)
   * @returns {Object} Availability status and details
   */
  async calculateAvailability(labourId, targetDate = new Date()) {
    try {
      // Normalize target date to start of day for comparison
      const checkDate = new Date(targetDate);
      checkDate.setHours(0, 0, 0, 0);

      // Get work schedule for the target date
      const workSchedule = await this.getWorkSchedule(labourId, checkDate, checkDate);
      
      // Check if user has any work on the target date
      const hasWork = workSchedule.length > 0;
      
      const result = {
        isAvailable: !hasWork,
        date: checkDate,
        workSchedule: workSchedule,
        reason: hasWork ? 'Has scheduled work' : 'No work scheduled'
      };

      // If not available, calculate next available date
      if (!result.isAvailable) {
        result.nextAvailableDate = await this.getNextAvailableDate(labourId, checkDate);
      }

      return result;
    } catch (error) {
      console.error('Error calculating availability:', error);
      // Return conservative availability (unavailable) on error
      return {
        isAvailable: false,
        date: targetDate,
        workSchedule: [],
        reason: 'Error calculating availability',
        error: error.message
      };
    }
  }

  /**
   * Get work schedule for a labour user within a date range
   * @param {string} labourId - The labour user's ID
   * @param {Date} startDate - Start date of the range
   * @param {Date} endDate - End date of the range
   * @returns {Array} Array of work periods
   */
  async getWorkSchedule(labourId, startDate, endDate) {
    try {
      // Find all vacancies where the labour user has accepted applications
      const vacancies = await Vacancy.find({
        'applicants': {
          $elemMatch: {
            labourId: labourId,
            status: 'accepted'
          }
        }
      }).populate('postedBy', 'name');

      const workPeriods = [];

      for (const vacancy of vacancies) {
        if (vacancy.startDate) {
          const workStartDate = new Date(vacancy.startDate);
          workStartDate.setHours(0, 0, 0, 0);

          let workEndDate;
          if (vacancy.duration && vacancy.duration > 0) {
            // Calculate end date based on duration (in days)
            workEndDate = new Date(workStartDate);
            workEndDate.setDate(workEndDate.getDate() + vacancy.duration - 1);
          } else {
            // If no duration specified, assume single day work
            workEndDate = new Date(workStartDate);
          }
          workEndDate.setHours(23, 59, 59, 999);

          // Check if work period overlaps with the requested date range
          if (workStartDate <= endDate && workEndDate >= startDate) {
            workPeriods.push({
              vacancyId: vacancy._id,
              jobTitle: vacancy.jobTitle,
              farmerName: vacancy.postedBy?.name,
              startDate: workStartDate,
              endDate: workEndDate,
              duration: vacancy.duration || 1,
              location: vacancy.location
            });
          }
        }
      }

      return workPeriods;
    } catch (error) {
      console.error('Error getting work schedule:', error);
      return [];
    }
  }

  /**
   * Get the next available date for a labour user
   * @param {string} labourId - The labour user's ID
   * @param {Date} fromDate - Start searching from this date
   * @returns {Date|null} Next available date or null if error
   */
  async getNextAvailableDate(labourId, fromDate = new Date()) {
    try {
      // Look ahead up to 30 days to find next available date
      const maxDaysAhead = 30;
      const searchStartDate = new Date(fromDate);
      searchStartDate.setDate(searchStartDate.getDate() + 1); // Start from tomorrow

      for (let i = 0; i < maxDaysAhead; i++) {
        const checkDate = new Date(searchStartDate);
        checkDate.setDate(checkDate.getDate() + i);
        
        const availability = await this.calculateAvailability(labourId, checkDate);
        if (availability.isAvailable) {
          return checkDate;
        }
      }

      // If no available date found within 30 days, return null
      return null;
    } catch (error) {
      console.error('Error getting next available date:', error);
      return null;
    }
  }

  /**
   * Check if a labour user is working on a specific date
   * @param {string} labourId - The labour user's ID
   * @param {Date} date - The date to check
   * @returns {boolean} True if working on that date
   */
  async isWorkingOnDate(labourId, date) {
    try {
      const availability = await this.calculateAvailability(labourId, date);
      return !availability.isAvailable;
    } catch (error) {
      console.error('Error checking if working on date:', error);
      return false; // Conservative approach - assume not working if error
    }
  }

  /**
   * Get all work periods for a labour user
   * @param {string} labourId - The labour user's ID
   * @returns {Array} Array of all work periods
   */
  async getWorkPeriods(labourId) {
    try {
      // Get work schedule for a wide date range (past 30 days to future 90 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90);

      return await this.getWorkSchedule(labourId, startDate, endDate);
    } catch (error) {
      console.error('Error getting work periods:', error);
      return [];
    }
  }
}

module.exports = new AvailabilityCalculator();