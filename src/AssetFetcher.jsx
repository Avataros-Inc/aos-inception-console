import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE_URL, getSessionToken } from './postgrestAPI';

const AssetFetcher = () => {
  const { org, job, filename } = useParams();
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchAsset = async () => {

      try {
        const encodedFilename = `${org}/${job}/${filename}`;
        const response = await fetch(`${API_BASE_URL}/asset/${encodedFilename}`, {
          headers: {
            'Authorization': `Bearer ${getSessionToken()}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'An error occurred');
        }

        const data = await response.json();
        if (data.exists) {
        //   forward to the asset URL
         window.location.href = data.url;
        } else {
          setError('Asset does not exist');
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchAsset();
  }, [filename]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div>Loading...</div>;
};

export default AssetFetcher;