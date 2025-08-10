'use client';

import React from 'react';
import { mockAnnouncements } from '../data/announcements'; // mockAnnouncementsをインポート

const Announcements = () => {
  return (
    <div className="announcements-section" style={{ marginTop: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>お知らせ</h2>
      {mockAnnouncements.length > 0 ? (
        <ul>
          {mockAnnouncements.map(ann => (
            <li key={ann.id} style={{ marginBottom: '0.5rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
              <strong>{ann.date}:</strong> {ann.title}
            </li>
          ))}
        </ul>
      ) : (
        <p>現在、新しいお知らせはありません。</p>
      )}
    </div>
  );
};

export default Announcements;
