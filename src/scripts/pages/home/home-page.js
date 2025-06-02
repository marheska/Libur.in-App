import {
  generateLoaderAbsoluteTemplate,
  generateReportItemTemplate,
  generateReportsListEmptyTemplate,
  generateReportsListErrorTemplate,
} from '../../templates';
import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as LiburInAPI from '../../data/api';
import { saveStory, getAllStories, deleteStory } from '../../utils/db';

export default class HomePage {
  #presenter = null;
  #map = null;
  #stories = [];

  async render() {
    return `
      <section>
        <div class="reports-list__map__container">
          <div id="map" class="reports-list__map"></div>
          <div id="map-loading-container"></div>
        </div>
      </section>

      <section class="container">
        <h1 class="section-title">Daftar Cerita</h1>

        <div class="reports-list__container">
          <div id="reports-list"></div>
          <div id="reports-list-loading-container"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: LiburInAPI,
    });

    await this.#presenter.initialGalleryAndMap();

    // Hapus tombol offline di container utama jika ada
    const offlineBtns = document.querySelectorAll('.offline-action-btn');
    offlineBtns.forEach(btn => btn.remove());

    // Tambahkan tombol 'Simpan ke Offline' di setiap report-item
    setTimeout(() => {
      document.querySelectorAll('.report-item').forEach((item, idx) => {
        if (!item.querySelector('.save-offline-btn')) {
          const saveBtn = document.createElement('button');
          saveBtn.textContent = 'Simpan ke Offline';
          saveBtn.className = 'btn btn-outline save-offline-btn offline-action-btn';
          saveBtn.style.marginTop = '8px';
          saveBtn.addEventListener('click', async () => {
            const story = this.#stories[idx];
            await saveStory(story);
            alert('Cerita berhasil disimpan ke offline!');
          });
          item.querySelector('.report-item__body').appendChild(saveBtn);
        }
      });
    }, 0);

    // Tambahkan tombol 'Simpan ke Offline' di bawah tombol Selengkapnya pada detail cerita
    setTimeout(() => {
      document.querySelectorAll('.report-item__link').forEach((link, idx) => {
        link.addEventListener('click', (e) => {
          setTimeout(() => {
            const detailBtn = document.getElementById('report-detail-save');
            if (detailBtn && !document.getElementById('save-offline-detail-btn')) {
              const saveBtn = document.createElement('button');
              saveBtn.textContent = 'Simpan ke Offline';
              saveBtn.className = 'btn btn-outline';
              saveBtn.id = 'save-offline-detail-btn';
              saveBtn.style.marginLeft = '8px';
              saveBtn.addEventListener('click', async () => {
                const story = this.#stories[idx];
                await saveStory(story);
                alert('Cerita berhasil disimpan ke offline!');
              });
              detailBtn.parentNode.appendChild(saveBtn);
            }
          }, 500);
        });
      });
    }, 0);
  }

  populateReportsList(message, reports) {
    this.#stories = reports;
    
    if (reports.length <= 0) {
      this.populateReportsListEmpty();
      return;
    }
    
    const html = reports.reduce((accumulator, report) => {
      return accumulator.concat(
        generateReportItemTemplate({
          id: report.id,
          title: report.title || report.name, // pastikan ambil judul cerita, fallback ke name jika title kosong
          description: report.description,
          reporterName: report.reporter?.name || 'Unknown',
          photo: report.photo || (report.evidenceImages ? report.evidenceImages[0] : undefined),
          photoUrl: report.photoUrl,
          image: report.image,
          evidenceImages: report.evidenceImages,
        }),
      );
    }, '');
    
    document.getElementById('reports-list').innerHTML = `
      <div class="reports-list">${html}</div>
    `;
  }

  getStoryById(id) {
    return this.#stories.find(story => story.id === id);
  }

  populateReportsListEmpty() {
    document.getElementById('reports-list').innerHTML = generateReportsListEmptyTemplate();
  }

  populateReportsListError(message) {
    document.getElementById('reports-list').innerHTML = generateReportsListErrorTemplate(message);
  }

  showLoading() {
    const loadingEl = document.getElementById('reports-list-loading-container');
    if (loadingEl) {
      loadingEl.innerHTML = generateLoaderAbsoluteTemplate();
    }
  }

  hideLoading() {
    const loadingEl = document.getElementById('reports-list-loading-container');
    if (loadingEl) {
      loadingEl.innerHTML = '';
    }
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });
  }

  addMarkerToMap(coordinate, markerOptions = {}, popupOptions = null) {
    if (this.#map) {
      this.#map.addMarker(coordinate, markerOptions, popupOptions);
    }
  }
}
