import React, { useEffect, useState } from 'react';

const ProductFilter = ({ onFilter }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [exporterName, setExporterName] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    onFilter({ category: selectedCategory, keyword, exporterName });
  };

  return (
    <div className="filter-container">
      <h3 className="form-title">Filter Products</h3>
      <form onSubmit={handleFilter} className="form">
        <label>Category</label>
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">-- All Categories --</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>

        <label>Keyword</label>
        <input
          type="text"
          placeholder="Enter keyword"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <label>Exporter Name</label>
        <input
          type="text"
          placeholder="Enter exporter name"
          value={exporterName}
          onChange={(e) => setExporterName(e.target.value)}
        />

        <button type="submit" className="submit-btn">Apply Filters</button>
      </form>
    </div>
  );
};

export default ProductFilter;
