import React from 'react';

const AcademicCard = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Academic Information
      </h2>

      <p>Program: Bachelors</p>
      <p>Semester: 8th</p>
      <p>CGPA: 3.85</p>
    </div>
  );
};

export default AcademicCard;