export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
      // Ambil koordinat awal dari view, bukan langsung dari DOM
      const { lat, lon } = this.#view.getInitialCoordinates();
      if (!isNaN(lat) && !isNaN(lon)) {
        this.#view.addMarkerToMap(lat, lon, 'New Destination');
      }
      await this.showStoriesOnMap(); // Tampilkan story di peta
      this.initMapClickListener();   // Pasang listener klik peta
    } catch (error) {
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async showStoriesOnMap() {
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Akses ditolak: Anda belum login.');
      }
      const stories = await this.#model.getStories(token);
      stories.forEach(story => {
        const lat = story.location?.latitude ?? story.lat;
        const lon = story.location?.longitude ?? story.lon;
        // Cek validitas koordinat
        if (
          typeof lat === 'number' && typeof lon === 'number' &&
          !isNaN(lat) && !isNaN(lon)
        ) {
          this.#view.addMarkerToMap(lat, lon, story.title, () => {
            this.#view.showPopup(story);
          });
        }
      });
    } catch (error) {
      console.error('showStoriesOnMap: error:', error);
    }
  }

  async postNewReport({ title, description, evidenceImages, latitude, longitude }) {
    this.#view.showSubmitLoadingButton();
    try {
      if (!evidenceImages || evidenceImages.length === 0) {
        this.#view.storeFailed('Please add at least one photo');
        return;
      }

      // Ambil nama user dari localStorage atau token jika tidak ada getUser
      let namaUser = 'Unknown';
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          if (user && user.name) namaUser = user.name;
        }
      } catch (e) {}

      const data = {
        name: title,
        description: description,
        photo: evidenceImages[0],
        lat: parseFloat(latitude),
        lon: parseFloat(longitude),
      };

      const response = await this.#model.postStory(data);

      if (response.error) {
        this.#view.storeFailed(response.message || 'Failed to post story');
        return;
      }

      // Ambil data destinasi dari daftar cerita utama (stories) setelah submit
      const token = localStorage.getItem('access_token');
      const stories = await this.#model.getStories(token);
      // Cari story yang baru saja dibuat berdasarkan id dari response
      let storyData = null;
      if (response.story && response.story.id) {
        storyData = stories.find(s => s.id === response.story.id);
      } else if (response.id) {
        storyData = stories.find(s => s.id === response.id);
      }
      // Jika tidak ketemu, fallback ke response
      if (!storyData) {
        storyData = response.story || response;
      }
      // Perbaikan: gunakan data dari parameter sebagai prioritas utama
      const placeholderImage = '/src/public/images/placeholder-image.jpg';
      const lat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude))
        ? Number(latitude)
        : (storyData.location && typeof storyData.location.latitude === 'number')
          ? storyData.location.latitude
          : (typeof storyData.lat === 'number' ? storyData.lat : null);
      const lon = longitude !== undefined && longitude !== null && !isNaN(Number(longitude))
        ? Number(longitude)
        : (storyData.location && typeof storyData.location.longitude === 'number')
          ? storyData.location.longitude
          : (typeof storyData.lon === 'number' ? storyData.lon : null);
      // Ambil string url gambar dari evidenceImages[0] jika berupa objek
      let mainImage = placeholderImage;
      if (evidenceImages && evidenceImages.length > 0) {
        if (typeof evidenceImages[0] === 'string') {
          mainImage = evidenceImages[0];
        } else if (typeof evidenceImages[0] === 'object' && evidenceImages[0] !== null) {
          mainImage = evidenceImages[0].url || evidenceImages[0].path || placeholderImage;
        }
      } else if (storyData.evidenceImages && storyData.evidenceImages.length > 0) {
        if (typeof storyData.evidenceImages[0] === 'string') {
          mainImage = storyData.evidenceImages[0];
        } else if (typeof storyData.evidenceImages[0] === 'object' && storyData.evidenceImages[0] !== null) {
          mainImage = storyData.evidenceImages[0].url || storyData.evidenceImages[0].path || placeholderImage;
        }
      }
      const newStory = {
        id: storyData.id || response.id || Date.now(),
        title: title || storyData.title || storyData.name || 'Tanpa Judul',
        description: description || storyData.description || '',
        reporter: { name: namaUser || storyData.reporter?.name || storyData.name || 'Tanpa Nama' },
        photo: mainImage || storyData.photo || storyData.photoUrl || placeholderImage,
        photoUrl: mainImage || storyData.photoUrl || storyData.photo || placeholderImage,
        image: mainImage || storyData.image || storyData.photoUrl || storyData.photo || placeholderImage,
        evidenceImages: Array.isArray(evidenceImages) && evidenceImages.length > 0 ? evidenceImages : (Array.isArray(storyData.evidenceImages) ? storyData.evidenceImages : []),
        createdAt: storyData.createdAt || new Date().toISOString(),
        location: {
          latitude: lat,
          longitude: lon,
        },
        lat: lat,
        lon: lon,
        name: title || storyData.name || storyData.title || 'Tanpa Judul',
        userId: storyData.userId,
        updatedAt: storyData.updatedAt,
      };
      // Hapus saveBookmark di sini, agar cerita baru tidak otomatis masuk ke destinasi tersimpan
      // saveBookmark(newStory); // Dihapus sesuai permintaan user

      this.#view.storeSuccessfully('Story posted successfully', response);
      // Hapus setTimeout navigasi di sini agar tidak terjadi navigasi ganda
    } catch (error) {
      console.error('postNewReport: error:', error);
      this.#view.storeFailed(error.message || 'Failed to post story');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  initMapClickListener() {
    this.#view.onMapClick((lat, lon) => {
      this.#view.addMarkerToMap(lat, lon, 'New Destination');
      this.#view.setCoordinates(lat, lon);
    });
  }
}
