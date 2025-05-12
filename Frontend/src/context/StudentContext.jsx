import React, { createContext, useState, useContext } from 'react';

const StudentContext = createContext();

export const StudentProvider = ({ children }) => {
  const [studentData, setStudentData] = useState(null);

  const updateStudentData = (data) => {
    setStudentData(data);
    localStorage.setItem('studentData', JSON.stringify(data));
  };

  return (
    <StudentContext.Provider value={{ studentData, updateStudentData }}>
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = () => useContext(StudentContext);
