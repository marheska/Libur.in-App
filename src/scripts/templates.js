import { showFormattedDate } from './utils';

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

export function generateMainNavigationListTemplate() {
  const currentPath = location.hash.replace('#', '') || '/';
  return `
    <li><a id="destination-list-button" class="destination-list-button ${currentPath === '/' ? 'active' : ''}" href="#/">Daftar Destinasi</a></li>
    <li><a id="saved-destination-list-button" class="saved-destination-list-button ${currentPath === '/saved' ? 'active' : ''}" href="#/saved">Destinasi Tersimpan</a></li>
  `;
}

export function generateUnauthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="login-button" href="#/login">Login</a></li>
    <li><a id="register-button" href="#/register">Daftar</a></li>
  `;
}

export function generateAuthenticatedNavigationListTemplate() {
  return `
    <li id="push-notification-tools" class="push-notification-tools"></li>
    <li><a id="new-destination-button" class="btn new-destination-button" href="#/new">Tambah Destinasi <i class="fas fa-plus"></i></a></li>
    <li><a id="logout-button" class="logout-button" href="#/logout"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;
}

export function generateDestinationsListEmptyTemplate() {
  return `
    <div id="destinations-list-empty" class="destinations-list__empty">
      <h2>Tidak ada destinasi yang tersedia</h2>
      <p>Saat ini, tidak ada destinasi wisata yang dapat ditampilkan.</p>
    </div>
  `;
}

export function generateDestinationsListErrorTemplate(message) {
  return `
    <div id="destinations-list-error" class="destinations-list__error">
      <h2>Terjadi kesalahan pengambilan daftar destinasi</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateDestinationDetailErrorTemplate(message) {
  return `
    <div id="destination-detail-error" class="destination-detail__error">
      <h2>Terjadi kesalahan pengambilan detail destinasi</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

export function generateCommentsListEmptyTemplate() {
  return `
    <div id="destination-detail-comments-list-empty" class="destination-detail__comments-list__empty">
      <h2>Tidak ada komentar yang tersedia</h2>
      <p>Saat ini, tidak ada komentar yang dapat ditampilkan.</p>
    </div>
  `;
}

export function generateCommentsListErrorTemplate(message) {
  return `
    <div id="destination-detail-comments-list-error" class="destination-detail__comments-list__error">
      <h2>Terjadi kesalahan pengambilan daftar komentar</h2>
      <p>${message ? message : 'Gunakan jaringan lain atau laporkan error ini.'}</p>
    </div>
  `;
}

// Ambil judul cerita dari bagian awal description (baris pertama sebelum baris baru atau titik)
// function extractTitleFromDescription(description) {
//   if (!description) return '';
//   // Ambil baris pertama, atau sebelum titik pertama
//   const firstLine = description.split('\n')[0];
//   const beforeDot = firstLine.split('.')[0];
//   return beforeDot.trim() || firstLine.trim();
// }

export function generateReportItemTemplate({ id, title, description, reporterName, photo, photoUrl, image, evidenceImages }) {
  let imageUrl = photo || photoUrl || image;
  if (!imageUrl && Array.isArray(evidenceImages) && evidenceImages.length > 0) {
    imageUrl = evidenceImages[0];
  }
  if (!imageUrl) {
    imageUrl = 'images/placeholder-image.jpg';
  }
  const displayTitle = title;
  return `
    <div class="report-item">
      <div class="report-item__image-wrapper" style="background:#e5e7eb;overflow:hidden;border-radius:12px;min-height:180px;display:flex;align-items:center;justify-content:center;">
        <img class="report-item__image" src="${imageUrl}" alt="Gambar Cerita" style="width:100%;height:180px;object-fit:cover;object-position:center;display:block;background:#e5e7eb;" onerror="this.onerror=null;this.src='images/placeholder-image.jpg';" />
      </div>
      <div class="report-item__body">
        <h3 class="report-item__title">
          <a href="#/reports/${id}" class="report-item__link" style="text-decoration:none;color:inherit;">${displayTitle}</a>
        </h3>
        <p class="report-item__description">${description}</p>
        <p class="report-item__reporter">Dilaporkan oleh: ${reporterName}</p>
        <a href="#/reports/${id}" class="btn" style="margin-top:12px;display:inline-block;">Selengkapnya &rarr;</a>
      </div>
    </div>
  `;
}

export function generateReportsListEmptyTemplate() {
  return `
    <div class="reports-list__empty">
      <h2>Tidak ada laporan kerusakan</h2>
      <p>Saat ini belum ada laporan kerusakan yang masuk.</p>
    </div>
  `;
}

export function generateReportsListErrorTemplate(message) {
  return `
    <div class="reports-list__error">
      <h2>Terjadi kesalahan saat memuat laporan</h2>
      <p>${message || 'Silakan coba lagi nanti atau periksa koneksi Anda.'}</p>
    </div>
  `;
}

export function generateReportDetailTemplate({
  title,
  description,
  evidenceImages,
  location,
  reporterName,
  createdAt,
  image,
}) {
  return `
    <div class="report-detail__content">
      <h2 class="report-detail__title">${title}</h2>
      <div class="report-detail__info-block">
        <div class="report-detail__info-row">
          <span class="report-detail__info-label">Pelapor:</span>
          <span class="report-detail__info-value">${reporterName}</span>
        </div>
        <div class="report-detail__info-row">
          <span class="report-detail__info-label">Tanggal:</span>
          <span class="report-detail__info-value">${showFormattedDate(createdAt, 'id-ID')}</span>
        </div>
        <div class="report-detail__info-row">
          <span class="report-detail__info-label">Lokasi:</span>
          <span class="report-detail__info-value">${location?.placeName || '-'} (${location?.latitude ?? '-'}, ${location?.longitude ?? '-'})</span>
        </div>
        <div class="report-detail__info-row">
          <span class="report-detail__info-label">Deskripsi:</span>
          <span class="report-detail__info-value">${description}</span>
        </div>
      </div>
      <div id="images" class="report-detail__images">
        ${image ? `<img src="${image}" alt="Foto utama" style="width:100%;max-width:400px;display:block;margin-bottom:12px;" />` : ''}
        ${(Array.isArray(evidenceImages) ? evidenceImages : []).map((img) => `<img src="${img}" alt="Bukti">`).join('')}
      </div>
      <div id="map" class="report-detail__map-container report-detail__map">
        <div id="map-loading-container"></div>
      </div>
      <div id="save-actions-container" class="report-detail__actions"></div>
      <button id="report-detail-subscribe-notification" class="btn" style="display:;">Subscribe Notifikasi Cerita <i class="fas fa-bell"></i></button>
      <button id="report-detail-unsubscribe-notification" class="btn" style="display:none;">Unsubscribe Notifikasi Cerita <i class="fas fa-bell-slash"></i></button>
      <button id="report-detail-save" class="btn">Simpan Cerita <i class="fas fa-bookmark"></i></button>
    </div>
  `;
}

export function generateReportDetailErrorTemplate(message) {
  return `
    <div class="report-detail__error">
      <h2>Terjadi kesalahan saat memuat detail laporan</h2>
      <p>${message || 'Silakan coba beberapa saat lagi.'}</p>
    </div>
  `;
}

export function generateReportCommentItemTemplate({ photoUrlCommenter, nameCommenter, body }) {
  return `
    <div class="report-detail__comment-item">
      <img src="${photoUrlCommenter}" alt="${nameCommenter}" class="comment-item__avatar" />
      <div class="comment-item__content">
        <strong class="comment-item__name">${nameCommenter}</strong>
        <p class="comment-item__body">${body}</p>
      </div>
    </div>
  `;
}

export function generateSaveReportButtonTemplate() {
  return `
    <button id="report-detail-save" class="btn">
      Simpan Laporan <i class="fas fa-bookmark"></i>
    </button>
  `;
}

export function generateRemoveReportButtonTemplate() {
  return `
    <button id="report-detail-remove" class="btn">
      Hapus dari Tersimpan <i class="fas fa-bookmark-slash"></i>
    </button>
  `;
}
