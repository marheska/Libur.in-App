import NewPresenter from './new-presenter';
import { convertBase64ToBlob } from '../../utils';
import * as CityCareAPI from '../../data/api';
import { generateLoaderAbsoluteTemplate } from '../../templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import { saveBookmark } from '../../utils/bookmark';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #isCameraOpen = false;
  #takenDocumentations = [];
  #map = null;

  async render() {
    return `
<section>
  <div class="new-report__header">
    <div class="container">
      <h1 class="new-report__header__title">Bagikan Cerita Liburanmu</h1>
      <p class="new-report__header__description">
        Silakan lengkapi formulir di bawah untuk membagikan pengalaman liburanmu.<br>
        Ceritamu dapat membantu orang lain menjelajahi destinasi seru!
      </p>
    </div>
  </div>
</section>

<section class="container">
  <div class="new-form__container">
    <form id="new-form" class="new-form">
      <div class="form-control">
        <label for="title-input" class="new-form__title__title">Judul Cerita</label>
        <div class="new-form__title__container">
          <input
            id="title-input"
            name="title"
            placeholder="Contoh: Liburan Seru di Danau Toba"
            aria-describedby="title-input-more-info"
          >
        </div>
        <div id="title-input-more-info">Buat judul cerita yang menarik dan deskriptif dalam satu kalimat.</div>
      </div>

      <div class="form-control">
        <label for="description-input" class="new-form__description__title">Ceritakan Pengalamanmu</label>
        <div class="new-form__description__container">
          <textarea
            id="description-input"
            name="description"
            placeholder="Ceritakan keseruan liburanmu, hal menarik yang kamu temui, rekomendasi spot, dsb."
          ></textarea>
        </div>
      </div>

      <div class="form-control">
        <label for="documentations-input" class="new-form__documentations__title">Foto Liburan</label>
        <div id="documentations-more-info">Unggah foto-foto untuk mendukung ceritamu.</div>

        <div class="new-form__documentations__container">
          <div class="new-form__documentations__buttons">
            <button id="documentations-input-button" class="btn btn-outline" type="button">
              Pilih Gambar
            </button>
            <input
              id="documentations-input"
              name="documentations"
              type="file"
              accept="image/*"
              multiple
              hidden="hidden"
              aria-multiline="true"
              aria-describedby="documentations-more-info"
            >
            <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
              Buka Kamera
            </button>
          </div>
          <div id="camera-container" class="new-form__camera__container">
            <video id="camera-video" class="new-form__camera__video">
              Video stream not available.
            </video>
            <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>

            <div class="new-form__camera__tools">
              <select id="camera-select"></select>
              <div class="new-form__camera__tools_buttons">
                <button id="camera-take-button" class="btn" type="button">
                  Ambil Gambar
                </button>
              </div>
            </div>
          </div>
          <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
        </div>
      </div>

      <div class="form-control">
        <div class="new-form__location__title">Lokasi Destinasi</div>
        <div class="new-form__location__container">
          <div class="new-form__location__map__container">
            <div id="map" class="new-form__location__map"></div>
            <div id="map-loading-container"></div>
          </div>
          <div class="new-form__location__lat-lng">
            <input type="number" name="latitude" id="latitude-input" step="any" placeholder="Latitude, contoh: -6.175389" value="-6.175389">
            <input type="number" name="longitude" id="longitude-input" step="any" placeholder="Longitude, contoh: 106.827139" value="106.827139">
          </div>
        </div>
      </div>

      <div class="form-buttons">
        <span id="submit-button-container">
          <button class="btn" type="submit">Bagikan Cerita</button>
        </span>
        <a class="btn btn-outline" href="#/">Batal</a>
      </div>
    </form>
  </div>
</section>

    `;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: CityCareAPI,
    });
    this.#takenDocumentations = [];

    this.#presenter.showNewFormMap();
    this.#setupForm();
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        title: this.#form.elements.namedItem('title').value,
        description: this.#form.elements.namedItem('description').value,
        evidenceImages: this.#takenDocumentations.map((picture) => picture.blob),
        latitude: this.#form.elements.namedItem('latitude').value,
        longitude: this.#form.elements.namedItem('longitude').value,
      };
      await this.#presenter.postNewReport(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Object.values(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);

      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    document
      .getElementById('open-documentations-camera-button')
      .addEventListener('click', async (event) => {
        cameraContainer.classList.toggle('open');
        this.#isCameraOpen = cameraContainer.classList.contains('open');

        if (this.#isCameraOpen) {
          event.currentTarget.textContent = 'Tutup Kamera';
          this.#setupCamera();
          await this.#camera.launch();

          return;
        }

        event.currentTarget.textContent = 'Buka Kamera';
        this.#camera.stop();
      });
  }

  async initialMap() {
    this.#map = await Map.build('#map', {
      zoom: 15,
      locate: true,
    });
  }

  addMarkerToMap(lat, lon, title = 'New Destination') {
    if (this.#map) {
      // Hapus marker lama jika ada
      if (this._currentMarker) {
        this.#map.removeMarker(this._currentMarker);
      }
      const marker = this.#map.addMarker([lat, lon], { draggable: true, alt: title }, { content: title });
      this._currentMarker = marker;
      marker.on('move', (event) => {
        const coordinate = event.target.getLatLng();
        this.setCoordinates(coordinate.lat, coordinate.lng);
      });
      this.setCoordinates(lat, lon);
    }
  }

  setCoordinates(lat, lon) {
    if (this.#form) {
      this.#form.elements.namedItem('latitude').value = lat;
      this.#form.elements.namedItem('longitude').value = lon;
    }
  }

  onMapClick(callback) {
    if (this.#map) {
      this.#map.addMapEventListener('click', (event) => {
        const { lat, lng } = event.latlng;
        callback(lat, lng);
      });
    }
  }

  // // Preparing marker for select coordinate
  // const centerCoordinate = this.#map.getCenter();
  // const draggableMarker = this.#map.addMarker(
  //   [centerCoordinate.latitude, centerCoordinate.longitude],
  //   { draggable: 'true' },
  // );
  // draggableMarker.addEventListener('move', (event) => {
  //   const coordinate = event.target.getLatLng();
  //   this.#updateLatLngInput(coordinate.lat, coordinate.lng);
  //   });

  //   this.#map.addMapEventListener('click', (event) => {
  //     draggableMarker.setLatLng(event.latlng);

  //     // Keep center with user view
  //     event.sourceTarget.flyTo(event.latlng);
  //   });
  // }
  // #updateLatLngInput(latitude, longitude) {
  //   this.#form.elements.namedItem('latitude').value = latitude;
  //   this.#form.elements.namedItem('longitude').value = longitude;
  // }

  #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        cameraSelect: document.getElementById('camera-select'),
        canvas: document.getElementById('camera-canvas'),
      });
    }

    this.#camera.addCheeseButtonListener('#camera-take-button', async () => {
      const image = await this.#camera.takePicture();
      await this.#addTakenPicture(image);
      await this.#populateTakenPictures();
    });
  }

  async #addTakenPicture(image) {
    let blob = image;

    if (image instanceof String) {
      blob = await convertBase64ToBlob(image, 'image/png');
    }

    const newDocumentation = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      blob: blob,
    };
    this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
  }

  async #populateTakenPictures() {
    const html = this.#takenDocumentations.reduce((accumulator, picture, currentIndex) => {
      const imageUrl = URL.createObjectURL(picture.blob);
      return accumulator.concat(`
        <li class="new-form__documentations__outputs-item">
          <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
            <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
          </button>
        </li>
      `);
    }, '');

    document.getElementById('documentations-taken-list').innerHTML = html;

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;

        const deleted = this.#removePicture(pictureId);
        if (!deleted) {
          console.log(`Picture with id ${pictureId} was not found`);
        }

        // Updating taken pictures
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => {
      return picture.id == id;
    });

    // Check if founded selectedPicture is available
    if (!selectedPicture) {
      return null;
    }

    // Deleting selected selectedPicture from takenPictures
    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => {
      return picture.id != selectedPicture.id;
    });

    return selectedPicture;
  }

  storeSuccessfully(message, response) {
    // Setelah berhasil submit, redirect ke halaman detail report yang baru dibuat
    const goTo = (response && response.id) ? `/reports/${response.id}` : '/bookmark';
    if (location.hash !== `#${goTo}`) {
      location.hash = goTo;
    }
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
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

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Buat Cerita
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Buat Cerita</button>
    `;
  }

  getInitialCoordinates() {
    if (!this.#form) {
      this.#form = document.getElementById('new-form');
    }
    const lat = parseFloat(this.#form.elements.namedItem('latitude').value);
    const lon = parseFloat(this.#form.elements.namedItem('longitude').value);
    return { lat, lon };
  }
}
