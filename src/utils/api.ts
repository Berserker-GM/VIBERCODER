import { projectId } from './supabase/info';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for keys
const getUserKey = (userId: string, type: string) => `moodglow:user:${userId}:${type}`;
const getUsernameKey = (name: string) => `moodglow:username:${name.toLowerCase()}`;

export const api = {
    // Auth
    login: async (name: string, password: string) => {
        await delay(500);
        const usernameKey = getUsernameKey(name);
        const userId = localStorage.getItem(usernameKey);

        if (!userId) {
            throw new Error('User not found');
        }

        const profileKey = getUserKey(userId, 'profile');
        const profileStr = localStorage.getItem(profileKey);

        if (!profileStr) {
            throw new Error('Profile not found');
        }

        const profile = JSON.parse(profileStr);

        if (profile.password !== password) {
            throw new Error('Invalid password');
        }

        return { profile };
    },

    signup: async (userId: string, name: string, password: string, gender: string) => {
        await delay(500);

        if (name) {
            const usernameKey = getUsernameKey(name);
            const existingUserId = localStorage.getItem(usernameKey);

            if (existingUserId && existingUserId !== userId) {
                throw new Error('Username already taken');
            }
        }

        const profileKey = getUserKey(userId, 'profile');
        const existingProfileStr = localStorage.getItem(profileKey);

        if (existingProfileStr) {
            return { profile: JSON.parse(existingProfileStr) };
        }

        const profile = {
            userId,
            gender: gender || 'not-specified',
            name: name || 'User',
            password: password || '',
            createdAt: new Date().toISOString(),
        };

        localStorage.setItem(profileKey, JSON.stringify(profile));
        if (name) {
            localStorage.setItem(getUsernameKey(name), userId);
        }

        return { profile };
    },

    // Profile
    getProfile: async (userId: string) => {
        await delay(300);
        const profileKey = getUserKey(userId, 'profile');
        const profileStr = localStorage.getItem(profileKey);
        return profileStr ? { profile: JSON.parse(profileStr) } : { error: 'Not found' };
    },

    // Check-ins
    saveCheckin: async (userId: string, data: any) => {
        await delay(300);
        const date = new Date().toISOString().split('T')[0];
        const checkinKey = getUserKey(userId, `checkin:${date}`);

        const checkin = {
            userId,
            date,
            ...data,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(checkinKey, JSON.stringify(checkin));

        // Update streak
        await api.updateStreak(userId, date);

        return { success: true, checkin };
    },

    getCheckins: async (userId: string) => {
        await delay(300);
        const checkins = [];
        // Scan localStorage for checkins (inefficient but works for local)
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`moodglow:user:${userId}:checkin:`)) {
                checkins.push(JSON.parse(localStorage.getItem(key)!));
            }
        }
        return { checkins };
    },

    // Streak
    updateStreak: async (userId: string, date: string) => {
        const streakKey = getUserKey(userId, 'streak');
        const streakStr = localStorage.getItem(streakKey);
        const streak = streakStr ? JSON.parse(streakStr) : { current: 0, longest: 0, lastDate: null };

        const today = new Date(date);
        const lastDate = streak.lastDate ? new Date(streak.lastDate) : null;

        if (lastDate) {
            const diffTime = today.getTime() - lastDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                streak.current += 1;
            } else if (diffDays > 1) {
                streak.current = 1;
            }
        } else {
            streak.current = 1;
        }

        streak.longest = Math.max(streak.longest, streak.current);
        streak.lastDate = date;

        localStorage.setItem(streakKey, JSON.stringify(streak));
        return streak;
    },

    getStreak: async (userId: string) => {
        await delay(300);
        const streakKey = getUserKey(userId, 'streak');
        const streakStr = localStorage.getItem(streakKey);
        return { streak: streakStr ? JSON.parse(streakStr) : { current: 0 } };
    },

    // Journal
    saveJournal: async (userId: string, content: string, password?: string, title?: string) => {
        await delay(300);
        const entryId = `${Date.now()}`;
        const journalKey = getUserKey(userId, `journal:${entryId}`);

        const entry = {
            id: entryId,
            userId,
            title: title || 'Untitled',
            content,
            password,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(journalKey, JSON.stringify(entry));
        return { success: true, entryId };
    },

    getJournalEntries: async (userId: string, password?: string) => {
        await delay(300);
        const entries = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`moodglow:user:${userId}:journal:`)) {
                const entry = JSON.parse(localStorage.getItem(key)!);
                if (entry.password === password) {
                    entries.push(entry);
                }
            }
        }
        return { entries };
    },

    // Contacts
    saveContacts: async (userId: string, contacts: any[]) => {
        await delay(300);
        const contactsKey = getUserKey(userId, 'contacts');
        localStorage.setItem(contactsKey, JSON.stringify({ userId, contacts }));
        return { success: true };
    },

    getContacts: async (userId: string) => {
        await delay(300);
        const contactsKey = getUserKey(userId, 'contacts');
        const dataStr = localStorage.getItem(contactsKey);
        return { contacts: dataStr ? JSON.parse(dataStr).contacts : [] };
    },

    // Period
    savePeriod: async (userId: string, data: any) => {
        await delay(300);
        const periodId = `${new Date(data.startDate).getTime()}`;
        const periodKey = getUserKey(userId, `period:${periodId}`);

        const periodData = {
            id: periodId,
            userId,
            ...data,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(periodKey, JSON.stringify(periodData));
        return { success: true, periodData };
    },

    getPeriodData: async (userId: string) => {
        await delay(300);
        const periods = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(`moodglow:user:${userId}:period:`)) {
                periods.push(JSON.parse(localStorage.getItem(key)!));
            }
        }

        // Sort and predict (simplified)
        periods.sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());

        // Simple prediction logic
        const prediction = periods.length > 0 ? {
            nextPeriodDate: new Date(new Date(periods[0].startDate).getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            averageCycleLength: 28,
            daysUntilNext: 14 // Mock
        } : null;

        return { periods, prediction };
    }
};
