// MeetingService.ts - API integration for consultation scheduling

export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  avatar?: string;
}

export interface MeetingLocation {
  name: string;
  address: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface MeetingDetails {
  id: string;
  title: string;
  date: string;
  time: string;
  location: MeetingLocation;
  committeeMember: CommitteeMember;
  description?: string;
  isUrgent?: boolean;
  status: 'scheduled' | 'cancelled' | 'completed';
  createdAt: string;
  updatedAt: string;
}

class MeetingService {
  private static instance: MeetingService;
  private baseUrl = 'https://api.your-prayer-app.com'; // Replace with actual API URL

  private constructor() {}

  public static getInstance(): MeetingService {
    if (!MeetingService.instance) {
      MeetingService.instance = new MeetingService();
    }
    return MeetingService.instance;
  }

  /**
   * Get the current active consultation (single consultation approach)
   */
  async getActiveConsultation(): Promise<MeetingDetails | null> {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`${this.baseUrl}/consultation/active`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const consultation = await response.json();
      return consultation;
    } catch (error) {
      console.error('Error fetching active consultation:', error);
      
      // Return dummy data for development
      return this.getDummyConsultationData();
    }
  }

  /**
   * Alias for getActiveConsultation (for backwards compatibility)
   */
  async getNextMeeting(): Promise<MeetingDetails | null> {
    return this.getActiveConsultation();
  }

  /**
   * Check if there's an active consultation scheduled
   */
  async hasActiveConsultation(): Promise<boolean> {
    try {
      const consultation = await this.getActiveConsultation();
      return consultation !== null;
    } catch (error) {
      console.error('Error checking for active consultation:', error);
      return false;
    }
  }

  /**
   * Cancel the current consultation
   */
  async cancelConsultation(consultationId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/consultation/${consultationId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Error cancelling consultation:', error);
      return false;
    }
  }

  /**
   * Reschedule the current consultation
   */
  async rescheduleConsultation(consultationId: string, newDate: string, newTime: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/consultation/${consultationId}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authentication headers here
        },
        body: JSON.stringify({ date: newDate, time: newTime }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error rescheduling consultation:', error);
      return false;
    }
  }

  /**
   * Dummy data for development - remove when API is ready
   */
  private getDummyConsultationData(): MeetingDetails | null {
    // Simulate having an active consultation scheduled
    const now = new Date();
    const consultationDate = new Date('2025-06-28T14:30:00');
    
    // Only return consultation if it's in the future
    if (consultationDate > now) {
      return {
        id: '1',
        title: 'Personal Guidance Session',
        date: '2025-06-28',
        time: '2:30 PM',
        location: {
          name: 'Counseling Room',
          address: '123 Mosque Street, Islamic Center',
          coordinates: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        },
        committeeMember: {
          id: 'c1',
          name: 'Sheikh Ahmed Al-Rashid',
          role: 'Religious Counselor',
          phone: '+1 (555) 123-4567',
          email: 'sheikh.ahmed@islamiccenter.org',
        },
        description: 'Personal consultation regarding spiritual guidance and religious matters.',
        isUrgent: false,
        status: 'scheduled',
        createdAt: '2025-06-20T10:00:00Z',
        updatedAt: '2025-06-25T15:30:00Z',
      };
    }
    
    return null; // No active consultation
  }

  /**
   * Check if there are any meetings scheduled for today or upcoming days
   * @deprecated Use hasActiveConsultation() instead
   */
  async hasMeetingsScheduled(): Promise<boolean> {
    return this.hasActiveConsultation();
  }
}

export default MeetingService;
