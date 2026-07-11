import React from 'react';

const TagList = ({ title }) => {
  const tags =
    title === "Research Interests"
      ? ["Machine Learning", "NLP", "Computer Vision"]
      : ["React", "Node.js", "MongoDB", "Express"];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4">
        {title}
      </h2>

      <div className="flex flex-wrap gap-3">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default TagList;