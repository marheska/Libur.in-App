import {
  generateCommentsListEmptyTemplate,
  generateCommentsListErrorTemplate,
  generateLoaderAbsoluteTemplate,
  generateRemoveReportButtonTemplate,
  generateReportCommentItemTemplate,
  generateReportDetailErrorTemplate,
  generateReportDetailTemplate,
  generateSaveReportButtonTemplate,
} from '../../templates';
import { createCarousel } from '../../utils';
import ReportDetailPresenter from './report-detail-presenter';
import { parseActivePathname } from '../../routes/url-parser';
import Map from '../../utils/map';
import * as LiburInAPI from '../../data/api';

export default class ReportDetailPage {
  #presenter = null;
  #form = null;
  #map = null;

  async render() {
    return `
      <section>
        <div class="report-detail__container">
          <div id="report-detail" class="report-detail"></div>
          <div id="report-detail-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const parsed = parseActivePathname();
    if (!parsed.id) {
      // Jika id tidak ada di URL, tampilkan error yang jelas
      document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate('ID laporan tidak ditemukan di URL.');
      return;
    }
    this.#presenter = new ReportDetailPresenter(parsed.id, {
      view: this,
      apiModel: LiburInAPI,
    });

    this.#presenter.showReportDetail();
  }

  async populateReportDetailAndInitialMap(message, report) {
    document.getElementById('report-detail').innerHTML = generateReportDetailTemplate({
      title: report.title,
      description: report.description,
      evidenceImages: report.evidenceImages,
      location: report.location,
      reporterName: report.reporter?.name || report.title || 'Anonim',
      createdAt: report.createdAt || report.date,
      image: report.image,
    });

    // Bersihkan container aksi sebelum render ulang
    const saveActionsContainer = document.getElementById('save-actions-container');
    if (saveActionsContainer) saveActionsContainer.innerHTML = '';

    // Carousel images
    if (Array.isArray(report.evidenceImages) && report.evidenceImages.length > 0) {
      createCarousel(document.getElementById('images'));
    }

    // Inisialisasi peta digital, marker, dan popup
    const mapContainer = document.getElementById('map');
    if (mapContainer && report.location && typeof report.location.latitude === 'number' && typeof report.location.longitude === 'number' && !isNaN(report.location.latitude) && !isNaN(report.location.longitude)) {
      // FIX: Bersihkan instance Leaflet sebelumnya jika ada
      if (mapContainer._leaflet_id) {
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = '';
      }
      if (!document.body.contains(mapContainer)) return;
      const lat = report.location.latitude;
      const lng = report.location.longitude;
      // Gunakan Map utility agar konsisten
      this.#map = await Map.build(mapContainer, {
        zoom: 15,
        center: [lat, lng],
        locate: false,
      });
      this.#map.addMarker([lat, lng], {}, { content: `<b>${report.title}</b><br>${report.location.placeName || ''}` });
    }

    this.addNotifyMeEventListener();
    const saveBtn = document.getElementById('report-detail-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        alert('Laporan telah disimpan!');
      });
    }
    const notifyBtn = document.getElementById('report-detail-notify-me');
    if (notifyBtn) {
      notifyBtn.addEventListener('click', () => {
        alert('Anda akan diberitahu jika ada update pada laporan ini!');
      });
    }
  }

  populateReportDetailError(message) {
    document.getElementById('report-detail').innerHTML = generateReportDetailErrorTemplate(message);
  }

  populateReportDetailComments(message, comments) {
    if (!Array.isArray(comments) || comments.length <= 0) {
      this.populateCommentsListEmpty();
      return;
    }

    const html = comments.reduce(
      (accumulator, comment) =>
        accumulator.concat(
          generateReportCommentItemTemplate({
            photoUrlCommenter: comment.commenter?.photoUrl || 'images/placeholder-image.jpg',
            nameCommenter: comment.commenter?.name || 'Anonim',
            body: comment.body || '',
          }),
        ),
      '',
    );

    document.getElementById('report-detail-comments-list').innerHTML = `
      <div class="report-detail__comments-list">${html}</div>
    `;
  }

  populateCommentsListEmpty() {
    document.getElementById('report-detail-comments-list').innerHTML =
      generateCommentsListEmptyTemplate();
  }

  populateCommentsListError(message) {
    document.getElementById('report-detail-comments-list').innerHTML =
      generateCommentsListErrorTemplate(message);
  }

  async initialMap() {
    // Selalu inisialisasi ulang map agar instance tidak null
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: false,
    });
  }

  #setupForm() {
    this.#form = document.getElementById('comments-list-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        body: this.#form.elements.namedItem('body').value,
      };
      await this.#presenter.postNewComment(data);
    });
  }

  postNewCommentSuccessfully(message, response) {
    console.log(message);

    this.#presenter.getCommentsList();
    this.clearForm();
  }

  postNewCommentFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  renderRemoveButton() {
    document.getElementById('save-actions-container').innerHTML =
      generateRemoveReportButtonTemplate();

    document.getElementById('report-detail-remove').addEventListener('click', async () => {
      alert('Fitur simpan laporan akan segera hadir!');
    });
  }

  addNotifyMeEventListener() {
    const subscribeBtn = document.getElementById('report-detail-subscribe-notification');
    const unsubscribeBtn = document.getElementById('report-detail-unsubscribe-notification');
    if (!subscribeBtn || !unsubscribeBtn) return;

    // Helper to check subscription state
    async function updateButtonState() {
      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        subscribeBtn.style.display = 'none';
        unsubscribeBtn.style.display = 'inline-block';
      } else {
        subscribeBtn.style.display = 'inline-block';
        unsubscribeBtn.style.display = 'none';
      }
    }
    // Pastikan updateButtonState dipanggil setelah subscribe/unsubscribe
    updateButtonState();

    subscribeBtn.addEventListener('click', async () => {
      const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';
      function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }
      if (!('serviceWorker' in navigator)) {
        alert('Service Worker tidak didukung di browser ini.');
        return;
      }
      if (!('PushManager' in window)) {
        alert('Push API tidak didukung di browser ini.');
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        // Kirim subscription ke endpoint Dicoding
        const token = localStorage.getItem('access_token');
        const body = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.getKey('p256dh') ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))) : '',
            auth: subscription.getKey('auth') ? btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))) : '',
          },
        };
        const response = await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        const result = await response.json();
        if (!result.error) {
          showNotificationDialog('Langganan push notification berhasil diaktifkan.');
        } else {
          showNotificationDialog('Gagal subscribe notifikasi: ' + result.message);
        }
        updateButtonState(); // <-- Panggil setelah subscribe
      } catch (err) {
        if (Notification.permission === 'denied') {
          showNotificationDialog('Izin notifikasi ditolak. Silakan aktifkan notifikasi di pengaturan browser.');
        } else {
          showNotificationDialog('Gagal subscribe notifikasi: ' + err.message);
        }
        updateButtonState(); // <-- Tetap panggil agar tombol update
      }
    });

    unsubscribeBtn.addEventListener('click', async () => {
      if (!('serviceWorker' in navigator)) return;
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        alert('Anda belum berlangganan notifikasi.');
        return;
      }
      try {
        const token = localStorage.getItem('access_token');
        await fetch('https://story-api.dicoding.dev/v1/notifications/subscribe', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
        showNotificationDialog('Langganan push notification berhasil dinonaktifkan.');
        updateButtonState(); // <-- Panggil setelah unsubscribe
      } catch (err) {
        showNotificationDialog('Gagal unsubscribe notifikasi: ' + err.message);
        updateButtonState(); // <-- Tetap panggil agar tombol update
      }
    });
  }

  showReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideReportDetailLoading() {
    document.getElementById('report-detail-loading-container').innerHTML = '';
  }

  showMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideMapLoading() {
    const mapLoadingContainer = document.getElementById('map-loading-container');
    if (mapLoadingContainer) {
      mapLoadingContainer.innerHTML = '';
    }
  }

  showCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideCommentsLoading() {
    document.getElementById('comments-list-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Tanggapi
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Tanggapi</button>
    `;
  }

  storeSuccessfully(message, response) {
    // Tidak ada lagi saveBookmark otomatis di sini, hanya lewat tombol bookmark
  }
}

// Tambahkan fungsi dialog notifikasi
function showNotificationDialog(message) {
  // Cek jika sudah ada dialog, hapus dulu
  const existing = document.getElementById('notif-dialog-modal');
  if (existing) existing.remove();
  const modal = document.createElement('div');
  modal.id = 'notif-dialog-modal';
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100vw';
  modal.style.height = '100vh';
  modal.style.background = 'rgba(0,0,0,0.4)';
  modal.style.display = 'flex';
  modal.style.alignItems = 'center';
  modal.style.justifyContent = 'center';
  modal.style.zIndex = '9999';
  modal.innerHTML = `
    <div style="background:#fff;padding:32px 40px;border-radius:18px;box-shadow:0 2px 16px rgba(0,0,0,0.15);min-width:320px;max-width:90vw;text-align:center;">
      <div style="margin-bottom:18px;font-size:1.1rem;">${message}</div>
      <button id="notif-dialog-ok" style="padding:8px 32px;font-size:1.1rem;border-radius:24px;border:none;background:#8b4252;color:#fff;cursor:pointer;outline:none;">OK</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('notif-dialog-ok').focus();
  document.getElementById('notif-dialog-ok').onclick = () => modal.remove();
  modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
