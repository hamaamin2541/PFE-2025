export const initializeNewStudent = {
  stats: {
    totalCourses: 0,
    completedCourses: 0,
    totalTests: 0,
    completedTests: 0,
    unreadMessages: 0
  },
  courses: [],
  tests: [],
  messages: [], // Ensure this is an empty array
  notifications: [],
  messagesFolders: {
    inbox: [],
    sent: [],
    trash: [],
    starred: []
  }
};
