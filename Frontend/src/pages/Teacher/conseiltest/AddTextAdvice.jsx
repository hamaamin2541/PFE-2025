import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../config/api';

const AddTextAdvice = () => {
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/teacher-advice`,
        {
          content: textContent,
          type: 'text'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status === 201) {
        setMessage('Conseil ajouté avec succès!');
        setTextContent('');
      }
    } catch (error) {
      console.error('Error adding advice:', error);
      setMessage(error.response?.data?.message || 'Erreur lors de l\'ajout du conseil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Ajouter un conseil texte</h2>
      {message && (
        <div className={`alert ${message.includes('succès') ? 'alert-success' : 'alert-danger'}`}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="adviceText">Conseil</label>
          <textarea
            id="adviceText"
            className="form-control"
            rows="5"
            placeholder="Entrez votre conseil ici"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            required
          />
        </div>
        <button 
          type="submit" 
          className="btn btn-primary mt-3"
          disabled={loading || !textContent.trim()}
        >
          {loading ? 'Ajout en cours...' : 'Ajouter le conseil'}
        </button>
      </form>
    </div>
  );
};

export default AddTextAdvice;
