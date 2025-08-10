// frontend/src/data/announcements.ts

export interface Announcement {
  id: number;
  title: string;
  date: string;
}

export const mockAnnouncements: Announcement[] = [
  { id: 1, title: 'システムメンテナンスのお知らせ', date: '2025-08-15' },
  { id: 2, title: '新しいクイズグループ「歴史編」を追加しました！１', date: '2025-08-10' },
  { id: 3, title: '利用規約を更新しました。', date: '2025-08-01' },
];
