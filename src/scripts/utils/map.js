import { map, tileLayer, Icon, icon, marker, popup, latLng } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const MAPTILER_API_KEY = '';

export default class Map {
  #zoom = 5;
  #map = null;

  static async getPlaceNameByCoordinate(latitude, longitude) {
    if (!MAPTILER_API_KEY) {
      // Jika tidak ada API key, tampilkan koordinat saja
      return `${latitude}, ${longitude}`;
    }
    try {
      const url = new URL(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json`);
      url.searchParams.set('key', MAPTILER_API_KEY);
      url.searchParams.set('language', 'id');
      url.searchParams.set('limit', '1');

      const response = await fetch(url);
      const json = await response.json();
      if (!json.features || !json.features[0] || !json.features[0].place_name) {
        return `${latitude}, ${longitude}`;
      }
      const place = json.features[0].place_name.split(', ');
      return [place.at(-2), place.at(-1)].map((name) => name).join(', ');
    } catch (error) {
      console.error('getPlaceNameByCoordinate: error:', error);
      return `${latitude}, ${longitude}`;
    }
  }

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }
  
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
  
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
  
  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }
  
    const jakartaCoordinate = [-6.2, 106.816666];
  
    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];
  
        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error('build: error:', error);
  
        return new Map(selector, {
          ...options,
          center: jakartaCoordinate,
        });
      }
    }
  
    return new Map(selector, {
      ...options,
      center: jakartaCoordinate,
    });
  }

  constructor(selector, options = {}) {
    // FIX: Bersihkan instance Leaflet pada container jika sudah ada
    const container = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (container && container._leaflet_id) {
      // Hapus instance Leaflet sebelumnya
      container._leaflet_id = null;
      container.innerHTML = '';
    }
    this.#zoom = options.zoom ?? this.#zoom;
    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    });
    this.#map = map(container, {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      layers: [tileOsm],
      ...options,
    });
  }

  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(latLng(coordinate), zoomLevel);
  }

  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return {
      latitude: lat,
      longitude: lng,
    };
  }

  createIcon(options = {}) {
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }

    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });

    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }

      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }

 const newPopup = popup(coordinates, popupOptions);
      newMarker.bindPopup(newPopup);
    }

    newMarker.addTo(this.#map);

    return newMarker;
  }

  removeMarker(markerInstance) {
    if (this.#map && markerInstance) {
      this.#map.removeLayer(markerInstance);
    }
  }

  addMapEventListener(eventName, callback) {
    this.#map.addEventListener(eventName, callback);
  }
}

// Utilitas peta digital dengan Leaflet.js
// Pastikan Leaflet sudah di-install dan di-import di HTML utama

export function initMap(mapContainerId, initialLat = -6.2, initialLng = 106.8, onClick) {
  // Cek dan hapus instance peta sebelumnya jika sudah ada
  if (window._leaflet_maps && window._leaflet_maps[mapContainerId]) {
    window._leaflet_maps[mapContainerId].remove();
  } else {
    if (!window._leaflet_maps) window._leaflet_maps = {};
  }

  // eslint-disable-next-line no-undef
  const map = L.map(mapContainerId).setView([initialLat, initialLng], 13);
  window._leaflet_maps[mapContainerId] = map;
  // eslint-disable-next-line no-undef
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  // Custom icon jika file marker-icon.png dan marker-shadow.png sudah ada di public/images
  const customIcon = L.icon({
    iconUrl: '/images/marker-icon.png',
    iconRetinaUrl: '/images/marker-icon-2x.png',
    shadowUrl: '/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  let marker = null;
  map.on('click', function(e) {
    const { lat, lng } = e.latlng;
    if (marker) {
      marker.setLatLng([lat, lng]);
    } else {
      // eslint-disable-next-line no-undef
      marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);
    }
    if (typeof onClick === 'function') {
      onClick(lat, lng);
    }
  });
  return map;
}
