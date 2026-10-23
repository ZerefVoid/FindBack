import { useState, useEffect } from 'react';
import { api } from '../api.js';
import { fmt } from '../utils.js';

export default function Notif({ go }) {
  const [daftar, setDaftar] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' atau 'unread'

  useEffect(() => {
    api('/notifikasi').then(setDaftar);
  }, []);

  const tampil = filter === 'unread' ? daftar.filter((n) => !n.sudah_dibaca) : daftar;

  return (
    <div className="w860">
      <h1 className="pt">Notifikasi</h1>

      <div className="chips" style={{ margin: '16px 0' }}>
        <span className={'chip ' + (filter === 'all' ? 'on' : '')} onClick={() => setFilter('all')}>
          Semua
        </span>
        <span className={'chip ' + (filter === 'unread' ? 'on' : '')} onClick={() => setFilter('unread')}>
          Belum dibaca
        </span>
      </div>

      <div className="panel" style={{ padding: '8px 16px' }}>
        {tampil.map((n) => (
          <div key={n.id} className={'lrow ' + (n.sudah_dibaca ? '' : 'top')}>
            {!n.sudah_dibaca && <span className="ico" />}
            <div className="gr">
              <b>{n.isi}</b>
              <div className="sm">{fmt(n.dibuat_pada)}</div>
            </div>
            {n.tautan && (
              <button
                className={'btn ' + (n.sudah_dibaca ? 'out' : 'pri')}
                onClick={() => go('detail', +n.tautan)}
              >
                Lihat
              </button>
            )}
          </div>
        ))}
        {!tampil.length && <div className="sm" style={{ padding: 16 }}>Belum ada notifikasi.</div>}
      </div>
    </div>
  );
}
